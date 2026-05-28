#!/usr/bin/env bash
# setup-github-deploy.sh <project-dir> [app-name]
#
# 首次部署一键完成：
#   服务器基础设施 → GitHub 仓库 → CI/CD 配置 → 推送触发首次部署
#
# 后续只需 git push，GitHub Actions 自动构建并部署。

set -euo pipefail

PROJECT_DIR="$(cd "${1:?Usage: setup-github-deploy.sh <project-dir> [app-name]}" && pwd)"
APP_NAME="${2:-$(basename "$PROJECT_DIR")}"
CONF_FILE="$HOME/.config/ship/server.conf"
GH_KEY="$HOME/.config/ship/github-deploy.key"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

log()  { echo "[setup] $*"; }
fail() { echo "[setup] ❌ $*" >&2; exit 1; }

# ── 前提检查 ─────────────────────────────────────────────────────────────────
[ -f "$CONF_FILE" ] || fail "请先创建配置文件：$CONF_FILE\n运行一次 deploy.sh 自动生成模板"
command -v gh >/dev/null 2>&1 || fail "需要安装 GitHub CLI：brew install gh"
gh auth status >/dev/null 2>&1 || fail "请先登录 GitHub：gh auth login"

source "$CONF_FILE"
[ -z "${SSH_HOST:-}"    ] && fail "SSH_HOST 未填写，请编辑 $CONF_FILE"
[ -z "${BASE_DOMAIN:-}" ] && fail "BASE_DOMAIN 未填写，请编辑 $CONF_FILE"
[ -z "${DEPLOY_KEY:-}"  ] && fail "DEPLOY_KEY 未填写，请编辑 $CONF_FILE"

DEPLOY_KEY="${DEPLOY_KEY/#\~/$HOME}"
[ -f "$DEPLOY_KEY" ] || fail "密钥文件不存在：$DEPLOY_KEY"

SSH_CTRL_DIR=$(mktemp -d)
SSH_CTRL="$SSH_CTRL_DIR/ctrl"
trap 'ssh -O exit -o ControlPath="$SSH_CTRL" "deploy@${SSH_HOST}" 2>/dev/null; rm -rf "$SSH_CTRL_DIR"' EXIT

BASE_SSH_OPTS="-i $DEPLOY_KEY -o StrictHostKeyChecking=accept-new -p ${SSH_PORT:-22}"
SSH_OPTS="$BASE_SSH_OPTS -o ControlMaster=auto -o ControlPath=$SSH_CTRL -o ControlPersist=60"
REMOTE="deploy@${SSH_HOST}"

APP_DOMAIN="${APP_NAME}.${BASE_DOMAIN}"
REMOTE_APP_DIR="/srv/projects/${APP_NAME}"
SERVICE_NAME="${APP_NAME}-server"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
NGINX_CONF="/etc/nginx/conf.d/${APP_NAME}.conf"
DRIZZLE_OUT=$(grep -E 'out["\s]*:' "$PROJECT_DIR/apps/server/drizzle.config.ts" 2>/dev/null \
    | grep -o '"[^"]*"' | tail -1 | tr -d '"' || echo "drizzle")

log "App:    $APP_NAME"
log "Domain: $APP_DOMAIN"
log "Server: ${SSH_HOST}:${SSH_PORT:-22}"

# ── 1. 服务器基础设施配置（nginx + systemd，一次性）──────────────────────────
log ""
log "── Step 1: Server infrastructure"

ssh $SSH_OPTS "$REMOTE" true  # 建立 ControlMaster

# 批量查询服务器状态
SERVER_STATE=$(ssh $SSH_OPTS "$REMOTE" bash << 'QUERY'
PORTS=$(grep -r 'Environment=PORT=' /etc/systemd/system/*-server.service 2>/dev/null \
    | grep -o 'PORT=[0-9]*' | cut -d= -f2 | sort -n | tr '\n' ' ' || true)
EXISTING=$(grep -s "Environment=PORT=" /etc/systemd/system/${SERVICE_NAME}.service \
    2>/dev/null | grep -o 'PORT=[0-9]*' | cut -d= -f2 || true)
NGINX_EXISTS=$([ -f "$NGINX_CONF" ] && echo "1" || echo "0")
SERVICE_EXISTS=$([ -f "$SERVICE_FILE" ] && echo "1" || echo "0")
SSL_CERT=$(ls /etc/nginx/ssl/*/fullchain.cer 2>/dev/null | head -1 || true)
SSL_KEY=$([ -n "$SSL_CERT" ] && ls "$(dirname "$SSL_CERT")"/*.key 2>/dev/null | head -1 || true)
echo "PORTS='${PORTS}'"
echo "EXISTING=$EXISTING"
echo "NGINX_EXISTS=$NGINX_EXISTS"
echo "SERVICE_EXISTS=$SERVICE_EXISTS"
echo "SSL_CERT=$SSL_CERT"
echo "SSL_KEY=$SSL_KEY"
QUERY
)
eval "$(echo "$SERVER_STATE" | tr -d '\r')"

# 确定端口
if [ -n "${EXISTING:-}" ]; then
    APP_PORT="$EXISTING"
    log "   端口：${APP_PORT}（已有）"
else
    APP_PORT=3000
    while echo " ${PORTS:-} " | grep -q " $APP_PORT "; do APP_PORT=$((APP_PORT + 1)); done
    log "   端口：${APP_PORT}（新分配）"
fi

# 准备目录
ssh $SSH_OPTS "$REMOTE" "mkdir -p \
    ${REMOTE_APP_DIR}/web \
    ${REMOTE_APP_DIR}/server/bin \
    ${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}"

# nginx conf
if [ "${NGINX_EXISTS}" = "0" ]; then
    if [ -n "${SSL_CERT:-}" ] && [ -n "${SSL_KEY:-}" ]; then
        LISTEN_BLOCK="listen 443 ssl; listen [::]:443 ssl; ssl_certificate ${SSL_CERT}; ssl_certificate_key ${SSL_KEY}; ssl_ciphers HIGH:!aNULL:!MD5; ssl_prefer_server_ciphers on;"
        REDIRECT_BLOCK="server { listen 80; listen [::]:80; server_name ${APP_DOMAIN}; return 301 https://\$host\$request_uri; }"
    else
        LISTEN_BLOCK="listen 80; listen [::]:80;"
        REDIRECT_BLOCK=""
    fi
    ssh $SSH_OPTS -T "$REMOTE" "sudo tee ${NGINX_CONF} > /dev/null" << NGINX
server {
    server_name ${APP_DOMAIN};
    root ${REMOTE_APP_DIR}/web;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; access_log off; }
    location /api/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    ${LISTEN_BLOCK}
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log  /var/log/nginx/${APP_NAME}_error.log;
}
${REDIRECT_BLOCK}
NGINX
    log "   ✓ nginx conf 已创建"
fi

# systemd service
if [ "${SERVICE_EXISTS}" = "0" ]; then
    ssh $SSH_OPTS -T "$REMOTE" << SETUP
sudo tee ${SERVICE_FILE} > /dev/null << 'SVC'
[Unit]
Description=${APP_NAME} Backend Server
After=network.target
[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=${REMOTE_APP_DIR}/server
ExecStart=${REMOTE_APP_DIR}/server/bin/server
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
Environment=DATABASE_URL=file:./sqlite.db
Environment=CORS_ORIGIN=https://${APP_DOMAIN}
Restart=on-failure
RestartSec=5s
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}
[Install]
WantedBy=multi-user.target
SVC
sudo tee /etc/sudoers.d/${APP_NAME}-deploy > /dev/null << 'SDO'
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl start ${SERVICE_NAME}, /usr/bin/systemctl stop ${SERVICE_NAME}, /usr/bin/systemctl restart ${SERVICE_NAME}, /usr/bin/tee /etc/nginx/conf.d/${APP_NAME}.conf, /usr/bin/tee /etc/systemd/system/${SERVICE_NAME}.service
SDO
sudo systemctl daemon-reload
sudo systemctl enable ${SERVICE_NAME}
SETUP
    log "   ✓ systemd service 已创建（端口 ${APP_PORT}）"
fi

ssh $SSH_OPTS "$REMOTE" "sudo nginx -t && sudo nginx -s reload"
log "   ✓ nginx reload"

# ── 2. GitHub Actions 部署密钥 ────────────────────────────────────────────────
log ""
log "── Step 2: GitHub Actions deploy key"

if [ ! -f "$GH_KEY" ]; then
    ssh-keygen -t ed25519 -N "" -f "$GH_KEY" -C "github-actions-deploy" -q
    ssh $SSH_OPTS "$REMOTE" "cat >> ~/.ssh/authorized_keys" < "${GH_KEY}.pub"
    log "   ✓ 新密钥已生成并添加到服务器"
else
    log "   ✓ 复用已有密钥：$GH_KEY"
fi

# ── 3. 创建 GitHub 私有仓库 ───────────────────────────────────────────────────
log ""
log "── Step 3: GitHub repository"

cd "$PROJECT_DIR"

# 初始化 git（如果需要）
if [ ! -d ".git" ]; then
    git init -q
    git checkout -b main 2>/dev/null || git checkout -q main
    log "   ✓ git init"
fi

# 检查是否已有 GitHub remote
if git remote get-url origin 2>/dev/null | grep -q "github.com"; then
    REPO=$(git remote get-url origin | sed 's|.*github.com[:/]\(.*\)\.git|\1|; s|.*github.com[:/]\(.*\)|\1|')
    log "   ✓ 复用已有仓库：$REPO"
else
    # 创建私有仓库
    GITHUB_USER=$(gh api user --jq .login)
    REPO="${GITHUB_USER}/${APP_NAME}"
    gh repo create "$REPO" --private --source=. --remote=origin 2>/dev/null \
        || { gh repo create "$REPO" --private; git remote add origin "https://github.com/${REPO}.git"; }
    log "   ✓ 创建私有仓库：https://github.com/$REPO"
fi

# ── 4. 生成 .github/workflows/deploy.yml ────────────────────────────────────
log ""
log "── Step 4: GitHub Actions workflow"

mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << WORKFLOW
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: |
          bun install --cwd apps/web
          bun install --cwd apps/server

      - name: Build (parallel)
        run: |
          bun run --cwd apps/web build &
          (cd apps/server && bun build --compile --target=bun-linux-x64 --outfile bin/server src/index.ts) &
          wait

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "\${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -p \${{ secrets.SSH_PORT }} \${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts 2>/dev/null

      - name: Deploy
        env:
          SSH_HOST: \${{ secrets.SSH_HOST }}
          SSH_PORT: \${{ secrets.SSH_PORT }}
          APP_NAME: ${APP_NAME}
          APP_PORT: ${APP_PORT}
          BASE_DOMAIN: \${{ secrets.BASE_DOMAIN }}
        run: |
          SSH="-i ~/.ssh/deploy_key -p \$SSH_PORT -o ControlMaster=auto -o ControlPath=/tmp/ssh_ctrl -o ControlPersist=60"
          REMOTE="deploy@\$SSH_HOST"
          REMOTE_APP_DIR="/srv/projects/\$APP_NAME"

          ssh \$SSH \$REMOTE true

          ssh \$SSH \$REMOTE "mkdir -p \${REMOTE_APP_DIR}/web \${REMOTE_APP_DIR}/server/bin \${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}"

          rsync -az --delete -e "ssh \$SSH" apps/web/dist/ "\$REMOTE:\${REMOTE_APP_DIR}/web/" &
          rsync -az -e "ssh \$SSH" apps/server/bin/server "\$REMOTE:\${REMOTE_APP_DIR}/server/bin/server" &
          [ -d "apps/server/${DRIZZLE_OUT}" ] && rsync -az -e "ssh \$SSH" apps/server/${DRIZZLE_OUT}/ "\$REMOTE:\${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}/" &
          wait

          ssh \$SSH \$REMOTE "sudo systemctl restart \${APP_NAME}-server && sudo nginx -s reload"
          echo "✅ https://\${APP_NAME}.\${BASE_DOMAIN}"
WORKFLOW
log "   ✓ .github/workflows/deploy.yml 已生成"

# ── 5. 配置 GitHub Secrets ───────────────────────────────────────────────────
log ""
log "── Step 5: GitHub Secrets"

gh secret set DEPLOY_SSH_KEY --body "$(cat "$GH_KEY")"          --repo "$REPO"
gh secret set SSH_HOST        --body "$SSH_HOST"                  --repo "$REPO"
gh secret set SSH_PORT        --body "${SSH_PORT:-22}"            --repo "$REPO"
gh secret set BASE_DOMAIN     --body "$BASE_DOMAIN"              --repo "$REPO"
log "   ✓ 4 个 Secrets 已配置"

# ── 6. 提交并推送（触发首次自动部署）────────────────────────────────────────
log ""
log "── Step 6: Push → trigger first deployment"

# 确保有 .gitignore
if [ ! -f .gitignore ]; then
    cat > .gitignore << 'IGNORE'
node_modules/
dist/
*.db
*.db-shm
*.db-wal
.env
apps/server/bin/
IGNORE
fi

git add -A
git diff --staged --quiet \
    && log "   （无变更，跳过 commit）" \
    || git commit -m "chore: add GitHub Actions deploy workflow"

git push -u origin main

log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "✅ 首次部署配置完成！"
log ""
log "   仓库：https://github.com/$REPO"
log "   部署：https://${APP_DOMAIN}"
log "   Actions：https://github.com/$REPO/actions"
log ""
log "   后续只需 git push 即可自动部署。"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
