#!/usr/bin/env bash
# setup-github-deploy.sh <project-dir> [app-name]
#
# 为项目配置 GitHub Actions 自动部署：
#   1. 生成（或复用）GitHub Actions 专用 SSH 密钥
#   2. 把公钥添加到服务器 deploy 用户
#   3. 在项目里生成 .github/workflows/deploy.yml
#   4. 输出需要添加到 GitHub Secrets 的内容

set -euo pipefail

PROJECT_DIR="${1:?Usage: setup-github-deploy.sh <project-dir> [app-name]}"
APP_NAME="${2:-$(basename "$PROJECT_DIR")}"
CONF_FILE="$HOME/.config/ship/server.conf"
GH_KEY="$HOME/.config/ship/github-deploy.key"

log()  { echo "[setup] $*"; }
fail() { echo "[setup] ❌ $*" >&2; exit 1; }

[ -f "$CONF_FILE" ] || fail "请先运行 deploy.sh 生成配置文件：$CONF_FILE"
source "$CONF_FILE"

[ -z "${SSH_HOST:-}"    ] && fail "SSH_HOST 未填写"
[ -z "${BASE_DOMAIN:-}" ] && fail "BASE_DOMAIN 未填写"

DEPLOY_KEY="${DEPLOY_KEY/#\~/$HOME}"
SSH_OPTS="-i $DEPLOY_KEY -o StrictHostKeyChecking=accept-new -p ${SSH_PORT:-22}"
REMOTE="deploy@${SSH_HOST}"

# ── 1. 生成 GitHub Actions 专用 SSH 密钥（所有项目共用一个）─────────────────
if [ ! -f "$GH_KEY" ]; then
    log "🔑 生成 GitHub Actions 部署密钥..."
    ssh-keygen -t ed25519 -N "" -f "$GH_KEY" \
        -C "github-actions-deploy@$(hostname)" -q
    log "   密钥已保存：$GH_KEY"

    log "📤 将公钥添加到服务器 deploy 用户..."
    ssh $SSH_OPTS "$REMOTE" "cat >> ~/.ssh/authorized_keys" < "${GH_KEY}.pub"
    log "   ✓ 公钥已添加"
else
    log "🔑 复用已有 GitHub Actions 密钥：$GH_KEY"
fi

# ── 2. 生成 .github/workflows/deploy.yml ────────────────────────────────────
WORKFLOW_DIR="$PROJECT_DIR/.github/workflows"
WORKFLOW_FILE="$WORKFLOW_DIR/deploy.yml"
mkdir -p "$WORKFLOW_DIR"

log "📝 生成 $WORKFLOW_FILE..."

DRIZZLE_OUT=$(grep -E 'out["\s]*:' "$PROJECT_DIR/apps/server/drizzle.config.ts" 2>/dev/null \
    | grep -o '"[^"]*"' | tail -1 | tr -d '"' || echo "drizzle")

cat > "$WORKFLOW_FILE" << WORKFLOW
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:  # 支持手动触发

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

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
          ssh-keyscan -p \${{ secrets.SSH_PORT || '${SSH_PORT:-22}' }} \${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy
        env:
          SSH_HOST: \${{ secrets.SSH_HOST }}
          SSH_PORT: \${{ secrets.SSH_PORT || '${SSH_PORT:-22}' }}
          APP_NAME: ${APP_NAME}
          BASE_DOMAIN: \${{ secrets.BASE_DOMAIN }}
        run: |
          SSH_OPTS="-i ~/.ssh/deploy_key -p \$SSH_PORT -o ControlMaster=auto -o ControlPath=/tmp/ssh_ctrl -o ControlPersist=60"
          REMOTE="deploy@\$SSH_HOST"
          APP_DOMAIN="\${APP_NAME}.\${BASE_DOMAIN}"
          REMOTE_APP_DIR="/srv/projects/\${APP_NAME}"

          # 建立 ControlMaster 连接
          ssh \$SSH_OPTS "\$REMOTE" true

          # 读取现有端口（保持不变）
          APP_PORT=\$(ssh \$SSH_OPTS "\$REMOTE" \
            "grep -s 'Environment=PORT=' /etc/systemd/system/\${APP_NAME}-server.service \
             | grep -o 'PORT=[0-9]*' | cut -d= -f2" || echo "3000")

          # 准备目录
          ssh \$SSH_OPTS "\$REMOTE" "mkdir -p \
            \${REMOTE_APP_DIR}/web \
            \${REMOTE_APP_DIR}/server/bin \
            \${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}"

          # 并行 rsync
          rsync -az --delete -e "ssh \$SSH_OPTS" \\
            apps/web/dist/ "\$REMOTE:\${REMOTE_APP_DIR}/web/" &
          rsync -az -e "ssh \$SSH_OPTS" \\
            apps/server/bin/server "\$REMOTE:\${REMOTE_APP_DIR}/server/bin/server" &
          [ -d "apps/server/${DRIZZLE_OUT}" ] && \\
            rsync -az -e "ssh \$SSH_OPTS" \\
              apps/server/${DRIZZLE_OUT}/ "\$REMOTE:\${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}/" &
          wait

          # 重启
          ssh \$SSH_OPTS "\$REMOTE" \\
            "sudo systemctl restart \${APP_NAME}-server && sudo nginx -s reload"

          echo "✅ Deployed: https://\${APP_DOMAIN}"
WORKFLOW

log "   ✓ workflow 已生成"

# ── 3. 自动配置 GitHub Secrets ───────────────────────────────────────────────
command -v gh >/dev/null 2>&1 || fail "需要安装 GitHub CLI：brew install gh"
gh auth status >/dev/null 2>&1 || fail "请先登录：gh auth login"

# 从 git remote 获取仓库名
REPO=$(git -C "$PROJECT_DIR" remote get-url origin 2>/dev/null \
    | sed 's|.*github.com[:/]\(.*\)\.git|\1|; s|.*github.com[:/]\(.*\)|\1|')
[ -z "$REPO" ] && fail "无法从 git remote 获取 GitHub 仓库名"

log "🔐 配置 GitHub Secrets → $REPO..."

gh secret set DEPLOY_SSH_KEY --body "$(cat "$GH_KEY")" --repo "$REPO"
log "   ✓ DEPLOY_SSH_KEY"

gh secret set SSH_HOST --body "$SSH_HOST" --repo "$REPO"
log "   ✓ SSH_HOST"

gh secret set SSH_PORT --body "${SSH_PORT:-22}" --repo "$REPO"
log "   ✓ SSH_PORT"

gh secret set BASE_DOMAIN --body "$BASE_DOMAIN" --repo "$REPO"
log "   ✓ BASE_DOMAIN"

echo ""
log "✅ 完成！"
log "   仓库：https://github.com/$REPO"
log "   推送到 main 分支即可触发自动部署"
log "   也可在 Actions 页面手动触发（workflow_dispatch）"
