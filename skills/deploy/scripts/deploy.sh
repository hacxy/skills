#!/usr/bin/env bash
# deploy.sh <project-dir> [app-name]
#
# SSH 登录用户固定为 deploy，全程使用 sudo 执行特权操作
# 首次运行：生成 ~/.config/ship/<app>.conf 配置文件模板
# 后续运行：读取配置文件，执行完整部署

set -euo pipefail

PROJECT_DIR="${1:?Usage: deploy.sh <project-dir> [app-name]}"
APP_NAME="${2:-$(basename "$PROJECT_DIR")}"
CONF_FILE="$HOME/.config/ship/${APP_NAME}.conf"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

log()  { echo "[deploy] $*"; }
fail() { echo "[deploy] ❌ $*" >&2; exit 1; }

# ── 首次运行：生成配置文件 ────────────────────────────────────────────────────
if [ ! -f "$CONF_FILE" ]; then
    mkdir -p "$(dirname "$CONF_FILE")"
    cat > "$CONF_FILE" << CONF
# 部署配置：$APP_NAME
# 保存在本地，不提交到仓库

SSH_HOST=           # 服务器地址或 IP（支持 ~/.ssh/config 里的别名）
SSH_PORT=22         # SSH 端口
DEPLOY_KEY=~/.ssh/id_ed25519  # deploy 用户的本地私钥路径

APP_DOMAIN=         # 域名，用于 nginx server_name 和浏览器验证
APP_PORT=3000       # Elysia 后端监听端口
REMOTE_DIR=/srv/projects  # 服务器项目根目录
CONF
    log "配置文件已创建：$CONF_FILE"
    log "请填写 SSH_HOST、APP_DOMAIN 等信息后重新运行"
    exit 0
fi

# ── 加载配置 ──────────────────────────────────────────────────────────────────
source "$CONF_FILE"

[ -z "${SSH_HOST:-}"   ] && fail "SSH_HOST 未填写，请编辑 $CONF_FILE"
[ -z "${APP_DOMAIN:-}" ] && fail "APP_DOMAIN 未填写，请编辑 $CONF_FILE"
[ -z "${DEPLOY_KEY:-}" ] && fail "DEPLOY_KEY 未填写，请编辑 $CONF_FILE"

DEPLOY_KEY="${DEPLOY_KEY/#\~/$HOME}"
[ -f "$DEPLOY_KEY" ] || fail "密钥文件不存在：$DEPLOY_KEY"

SSH_OPTS="-i $DEPLOY_KEY -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -p ${SSH_PORT}"
REMOTE="deploy@${SSH_HOST}"
REMOTE_APP_DIR="${REMOTE_DIR}/${APP_NAME}"
SERVICE_NAME="${APP_NAME}-server"

log "Host:    ${SSH_HOST}:${SSH_PORT}  (user: deploy)"
log "App:     ${APP_NAME} → ${REMOTE_APP_DIR}"
log "Domain:  ${APP_DOMAIN}"

# ── 1. 本地编译前端 ───────────────────────────────────────────────────────────
log "📦 Building frontend..."
(cd "$PROJECT_DIR/apps/web" && bun run build)

# ── 2. 本地交叉编译后端 Linux x64 二进制 ─────────────────────────────────────
log "🔨 Compiling backend binary (linux-x64)..."
(cd "$PROJECT_DIR/apps/server" && \
    bun build --compile \
        --target=bun-linux-x64 \
        --outfile bin/server \
        src/index.ts)

# ── 3. 检测 drizzle 迁移目录 ─────────────────────────────────────────────────
DRIZZLE_OUT=$(grep -E 'out["\s]*:' "$PROJECT_DIR/apps/server/drizzle.config.ts" 2>/dev/null \
    | grep -o '"[^"]*"' | tail -1 | tr -d '"' || echo "drizzle")

# ── 4. 准备服务器目录 ─────────────────────────────────────────────────────────
log "📁 Preparing server directories..."
ssh $SSH_OPTS "$REMOTE" "mkdir -p \
    ${REMOTE_APP_DIR}/web \
    ${REMOTE_APP_DIR}/server/bin \
    ${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}"

# ── 5. rsync ─────────────────────────────────────────────────────────────────
log "📤 Syncing frontend → web/"
rsync -az --delete -e "ssh $SSH_OPTS" \
    "$PROJECT_DIR/apps/web/dist/" \
    "${REMOTE}:${REMOTE_APP_DIR}/web/"

log "📤 Syncing backend binary → server/bin/server"
rsync -az -e "ssh $SSH_OPTS" \
    "$PROJECT_DIR/apps/server/bin/server" \
    "${REMOTE}:${REMOTE_APP_DIR}/server/bin/server"

if [ -d "$PROJECT_DIR/apps/server/$DRIZZLE_OUT" ]; then
    log "📤 Syncing migrations → server/${DRIZZLE_OUT}/"
    rsync -az -e "ssh $SSH_OPTS" \
        "$PROJECT_DIR/apps/server/$DRIZZLE_OUT/" \
        "${REMOTE}:${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}/"
fi

# ── 6. nginx 配置（幂等，已存在则跳过）──────────────────────────────────────
NGINX_CONF="/etc/nginx/conf.d/${APP_NAME}.conf"
log "🔧 Configuring nginx..."

if ssh $SSH_OPTS "$REMOTE" "test -f ${NGINX_CONF}"; then
    log "   nginx conf 已存在，跳过"
else
    SSL_CERT=$(ssh $SSH_OPTS "$REMOTE" "ls /etc/nginx/ssl/*/fullchain.cer 2>/dev/null | head -1 || true")
    SSL_KEY=""
    if [ -n "$SSL_CERT" ]; then
        CERT_DIR=$(dirname "$SSL_CERT")
        SSL_KEY=$(ssh $SSH_OPTS "$REMOTE" "ls ${CERT_DIR}/*.key 2>/dev/null | head -1 || true")
    fi

    if [ -n "$SSL_CERT" ] && [ -n "$SSL_KEY" ]; then
        LISTEN_BLOCK="listen 443 ssl;\n    listen [::]:443 ssl;\n    ssl_certificate ${SSL_CERT};\n    ssl_certificate_key ${SSL_KEY};\n    ssl_ciphers HIGH:!aNULL:!MD5;\n    ssl_prefer_server_ciphers on;"
        REDIRECT="server {\n    listen 80;\n    listen [::]:80;\n    server_name ${APP_DOMAIN};\n    return 301 https://\$host\$request_uri;\n}"
    else
        LISTEN_BLOCK="listen 80;\n    listen [::]:80;"
        REDIRECT=""
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

    $(printf "$LISTEN_BLOCK")

    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log  /var/log/nginx/${APP_NAME}_error.log;
}
$(printf "$REDIRECT")
NGINX
    log "   nginx conf 已写入"
fi

# ── 7. systemd 服务（首次部署时自动创建）────────────────────────────────────
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

if ! ssh $SSH_OPTS "$REMOTE" "test -f ${SERVICE_FILE}"; then
    log "🔧 Creating systemd service: ${SERVICE_NAME}..."
    ssh $SSH_OPTS -T "$REMOTE" "sudo tee ${SERVICE_FILE} > /dev/null" << SERVICE
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
SERVICE

    ssh $SSH_OPTS "$REMOTE" "sudo systemctl daemon-reload && sudo systemctl enable ${SERVICE_NAME}"
    log "   systemd service 已创建并启用"

    # 为 deploy 用户添加该服务的 restart 权限
    ssh $SSH_OPTS -T "$REMOTE" "sudo tee /etc/sudoers.d/${APP_NAME}-deploy > /dev/null" << SUDOERS
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl start ${SERVICE_NAME}, /usr/bin/systemctl stop ${SERVICE_NAME}, /usr/bin/systemctl restart ${SERVICE_NAME}, /usr/sbin/nginx, /usr/bin/tee /etc/nginx/conf.d/${APP_NAME}.conf, /usr/bin/tee /etc/systemd/system/${SERVICE_NAME}.service
SUDOERS
    log "   deploy sudo 权限已配置"
fi

# ── 8. 重启服务 ───────────────────────────────────────────────────────────────
log "🔄 Restarting ${SERVICE_NAME}..."
ssh $SSH_OPTS "$REMOTE" "sudo systemctl restart ${SERVICE_NAME}"
sleep 2

# ── 9. reload nginx ───────────────────────────────────────────────────────────
ssh $SSH_OPTS "$REMOTE" "sudo nginx -t && sudo nginx -s reload"

# ── 10. 浏览器验证 ────────────────────────────────────────────────────────────
log "🔍 Verifying..."
VERIFY_URL="https://${APP_DOMAIN}"
ssh $SSH_OPTS "$REMOTE" "test -f /etc/nginx/ssl/*/fullchain.cer" 2>/dev/null \
    || VERIFY_URL="http://${APP_DOMAIN}"

(cd "$PROJECT_DIR" && bun run "${SKILL_DIR}/scripts/verify-browser.ts" "$VERIFY_URL" /)

log ""
log "✅ Deployed: $VERIFY_URL"
log "   Config:  $CONF_FILE"
log "   Logs:    ssh -i $DEPLOY_KEY -p ${SSH_PORT} deploy@${SSH_HOST} 'journalctl -u ${SERVICE_NAME} -f'"
