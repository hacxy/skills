#!/usr/bin/env bash
# deploy.sh <project-dir> [app-name]
#
# 优化：SSH ControlMaster 复用连接 + 并行 rsync + 批量 SSH 查询

set -euo pipefail

PROJECT_DIR="${1:?Usage: deploy.sh <project-dir> [app-name]}"
APP_NAME="${2:-$(basename "$PROJECT_DIR")}"
CONF_FILE="$HOME/.config/ship/server.conf"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

log()  { echo "[deploy] $*"; }
fail() { echo "[deploy] ❌ $*" >&2; exit 1; }

# ── 首次运行：生成配置 ───────────────────────────────────────────────────────
if [ ! -f "$CONF_FILE" ]; then
    mkdir -p "$(dirname "$CONF_FILE")"
    cat > "$CONF_FILE" << CONF
# Ship 全局部署配置（所有项目共用）

SSH_HOST=           # 服务器地址或 ~/.ssh/config 别名
SSH_PORT=22
DEPLOY_KEY=~/.ssh/id_ed25519

BASE_DOMAIN=        # 基础域名，应用部署到 <app>.<BASE_DOMAIN>
CONF
    log "配置文件已创建：$CONF_FILE"
    log "请填写 SSH_HOST 和 BASE_DOMAIN 后重新运行"
    exit 0
fi

source "$CONF_FILE"
[ -z "${SSH_HOST:-}"    ] && fail "SSH_HOST 未填写"
[ -z "${BASE_DOMAIN:-}" ] && fail "BASE_DOMAIN 未填写"
[ -z "${DEPLOY_KEY:-}"  ] && fail "DEPLOY_KEY 未填写"

DEPLOY_KEY="${DEPLOY_KEY/#\~/$HOME}"
[ -f "$DEPLOY_KEY" ] || fail "密钥文件不存在：$DEPLOY_KEY"

# ── SSH ControlMaster：建一条长连接，后续所有操作复用 ─────────────────────
SSH_CTRL_DIR=$(mktemp -d)
SSH_CTRL="$SSH_CTRL_DIR/ctrl"
trap 'ssh -O exit -o ControlPath="$SSH_CTRL" "deploy@${SSH_HOST}" 2>/dev/null; rm -rf "$SSH_CTRL_DIR"' EXIT

BASE_SSH_OPTS="-i $DEPLOY_KEY -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -p ${SSH_PORT}"
SSH_OPTS="$BASE_SSH_OPTS -o ControlMaster=auto -o ControlPath=$SSH_CTRL -o ControlPersist=120"
RSYNC_OPTS="-az -e 'ssh $BASE_SSH_OPTS -o ControlMaster=no -o ControlPath=$SSH_CTRL'"

REMOTE="deploy@${SSH_HOST}"
REMOTE_DIR="/srv/projects"
APP_DOMAIN="${APP_NAME}.${BASE_DOMAIN}"
REMOTE_APP_DIR="${REMOTE_DIR}/${APP_NAME}"
SERVICE_NAME="${APP_NAME}-server"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
NGINX_CONF="/etc/nginx/conf.d/${APP_NAME}.conf"

log "Host:   ${SSH_HOST}:${SSH_PORT}  (deploy)"
log "App:    ${APP_NAME} → ${REMOTE_APP_DIR}"
log "Domain: ${APP_DOMAIN}"

# ── 建立控制连接（后续所有 SSH 复用此连接）──────────────────────────────────
log "🔗 Connecting..."
ssh $SSH_OPTS "$REMOTE" true

# ── 批量查询服务器状态（1 次 SSH 替代多次）───────────────────────────────────
log "🔍 Querying server state..."
SERVER_STATE=$(ssh $SSH_OPTS "$REMOTE" bash << 'QUERY'
# 已用端口
PORTS=$(grep -r 'Environment=PORT=' /etc/systemd/system/*-server.service 2>/dev/null \
    | grep -o 'PORT=[0-9]*' | cut -d= -f2 | sort -n | tr '\n' ' ' || true)
# 该 app 现有端口
EXISTING=$(grep -s 'Environment=PORT=' /etc/systemd/system/${SERVICE_NAME}.service \
    2>/dev/null | grep -o 'PORT=[0-9]*' | cut -d= -f2 || true)
# nginx conf 是否存在
NGINX_EXISTS=$([ -f "$NGINX_CONF" ] && echo "1" || echo "0")
# service 是否存在
SERVICE_EXISTS=$([ -f "$SERVICE_FILE" ] && echo "1" || echo "0")
# SSL 证书
SSL_CERT=$(ls /etc/nginx/ssl/*/fullchain.cer 2>/dev/null | head -1 || true)
SSL_KEY=$([ -n "$SSL_CERT" ] && ls "$(dirname "$SSL_CERT")"/*.key 2>/dev/null | head -1 || true)

echo "PORTS=$PORTS"
echo "EXISTING=$EXISTING"
echo "NGINX_EXISTS=$NGINX_EXISTS"
echo "SERVICE_EXISTS=$SERVICE_EXISTS"
echo "SSL_CERT=$SSL_CERT"
echo "SSL_KEY=$SSL_KEY"
QUERY
)

# 解析状态
eval "$SERVER_STATE"

# 确定端口
if [ -n "${EXISTING:-}" ]; then
    APP_PORT="$EXISTING"
    log "   端口：$APP_PORT（复用）"
else
    APP_PORT=3000
    while echo " ${PORTS:-} " | grep -q " $APP_PORT "; do
        APP_PORT=$((APP_PORT + 1))
    done
    log "   端口：$APP_PORT（新分配）"
fi

# ── 并行：本地编译前端 + 后端 ────────────────────────────────────────────────
log "🔨 Building (frontend + backend in parallel)..."

(cd "$PROJECT_DIR/apps/web" && bun run build > /tmp/deploy-fe.log 2>&1) &
FE_PID=$!

(cd "$PROJECT_DIR/apps/server" && \
    bun build --compile --target=bun-linux-x64 --outfile bin/server src/index.ts \
    > /tmp/deploy-be.log 2>&1) &
BE_PID=$!

# 等待两者完成，任一失败则报错
wait $FE_PID || { cat /tmp/deploy-fe.log; fail "前端编译失败"; }
wait $BE_PID || { cat /tmp/deploy-be.log; fail "后端编译失败"; }
log "   ✓ 编译完成"

# ── 检测 drizzle 迁移目录 ────────────────────────────────────────────────────
DRIZZLE_OUT=$(grep -E 'out["\s]*:' "$PROJECT_DIR/apps/server/drizzle.config.ts" 2>/dev/null \
    | grep -o '"[^"]*"' | tail -1 | tr -d '"' || echo "drizzle")

# ── 准备目录 ─────────────────────────────────────────────────────────────────
ssh $SSH_OPTS "$REMOTE" "mkdir -p \
    ${REMOTE_APP_DIR}/web \
    ${REMOTE_APP_DIR}/server/bin \
    ${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}"

# ── 并行 rsync（三路同时传，共用 ControlMaster）──────────────────────────────
log "📤 Syncing (parallel)..."

rsync -az --delete \
    -e "ssh $BASE_SSH_OPTS -o ControlPath=$SSH_CTRL" \
    "$PROJECT_DIR/apps/web/dist/" \
    "${REMOTE}:${REMOTE_APP_DIR}/web/" &
FE_RSYNC=$!

rsync -az \
    -e "ssh $BASE_SSH_OPTS -o ControlPath=$SSH_CTRL" \
    "$PROJECT_DIR/apps/server/bin/server" \
    "${REMOTE}:${REMOTE_APP_DIR}/server/bin/server" &
BE_RSYNC=$!

if [ -d "$PROJECT_DIR/apps/server/$DRIZZLE_OUT" ]; then
    rsync -az \
        -e "ssh $BASE_SSH_OPTS -o ControlPath=$SSH_CTRL" \
        "$PROJECT_DIR/apps/server/$DRIZZLE_OUT/" \
        "${REMOTE}:${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}/" &
    MG_RSYNC=$!
fi

wait $FE_RSYNC || fail "前端 rsync 失败"
wait $BE_RSYNC || fail "后端 rsync 失败"
[ -n "${MG_RSYNC:-}" ] && { wait $MG_RSYNC || fail "迁移文件 rsync 失败"; }
log "   ✓ 同步完成"

# ── nginx + systemd：按需配置（首次时批量操作）───────────────────────────────
if [ "${NGINX_EXISTS}" = "0" ] || [ "${SERVICE_EXISTS}" = "0" ]; then
    log "🔧 First-time setup..."

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
        log "   ✓ nginx conf 已写入"
    fi

    if [ "${SERVICE_EXISTS}" = "0" ]; then
        # 一次 SSH 创建 service + sudoers + daemon-reload + enable
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
fi

# ── 重启 + nginx reload（合并为一次 SSH）────────────────────────────────────
log "🔄 Restarting..."
ssh $SSH_OPTS "$REMOTE" \
    "sudo systemctl restart ${SERVICE_NAME} && sudo nginx -t && sudo nginx -s reload"

# ── 浏览器验证 ───────────────────────────────────────────────────────────────
log "🔍 Verifying..."
VERIFY_URL="https://${APP_DOMAIN}"
[ -n "${SSL_CERT:-}" ] || VERIFY_URL="http://${APP_DOMAIN}"

(cd "$PROJECT_DIR" && bun run "${SKILL_DIR}/scripts/verify-browser.ts" "$VERIFY_URL" /)

log ""
log "✅ Deployed: $VERIFY_URL  (port ${APP_PORT})"
log "   Logs: ssh deploy@${SSH_HOST} 'journalctl -u ${SERVICE_NAME} -f'"
