#!/usr/bin/env bash
# deploy.sh <project-dir> [app-name]
#
# 通过 SSH 部署到目标服务器（mock 或生产，流程完全一致）：
#   1. 本地编译前端
#   2. rsync 前端 + 后端源码 + 迁移文件到服务器
#   3. SSH 进服务器编译后端二进制（在目标环境原生编译，无架构问题）
#   4. 配置 nginx + 重启进程
#   5. headless 浏览器验证
#
# 首次运行：在 ~/.config/ship/<app>.conf 创建配置文件，填写后重新运行
# 后续运行：读取配置文件直接部署

set -euo pipefail

PROJECT_DIR="${1:?Usage: deploy.sh <project-dir> [app-name]}"
APP_NAME="${2:-$(basename "$PROJECT_DIR")}"
CONF_DIR="$HOME/.config/ship"
CONF_FILE="$CONF_DIR/${APP_NAME}.conf"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

log()  { echo "[deploy] $*"; }
fail() { echo "[deploy] ❌ $*" >&2; exit 1; }

# ── 读取或创建配置 ─────────────────────────────────────────────────────────────
if [ ! -f "$CONF_FILE" ]; then
    log "首次部署 '$APP_NAME'，创建配置文件..."
    mkdir -p "$CONF_DIR"
    cat > "$CONF_FILE" << CONF
# 部署配置：$APP_NAME
# 本文件保存在本地，不提交到仓库

# SSH 连接信息
SSH_HOST=
SSH_PORT=22
SSH_USER=root

# 服务器上的项目根目录
REMOTE_DIR=/srv/projects

# 应用访问地址（用于部署后验证）
APP_URL=http://yourdomain.com

# 后端端口（nginx proxy_pass 到此端口）
APP_PORT=3000
CONF
    echo ""
    log "📝 配置文件已创建：$CONF_FILE"
    log "   请填写服务器信息后重新运行部署命令"
    exit 0
fi

# 加载配置
source "$CONF_FILE"

[ -z "${SSH_HOST:-}" ] && fail "SSH_HOST 未填写，请编辑 $CONF_FILE"

SSH_OPTS="-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 -p ${SSH_PORT}"
REMOTE="${SSH_USER}@${SSH_HOST}"
REMOTE_APP_DIR="${REMOTE_DIR}/${APP_NAME}"

log "Host:    ${SSH_HOST}:${SSH_PORT}"
log "App:     ${APP_NAME} → ${REMOTE_APP_DIR}"
log "URL:     ${APP_URL}"

# ── 1. 编译前端（本地）────────────────────────────────────────────────────────
log "📦 Building frontend..."
(cd "$PROJECT_DIR/apps/web" && bun run build)

# ── 2. 检测 drizzle 迁移目录 ─────────────────────────────────────────────────
DRIZZLE_OUT=$(grep -E "out.*:" "$PROJECT_DIR/apps/server/drizzle.config.ts" 2>/dev/null \
    | grep -o '"[^"]*"' | tail -1 | tr -d '"' || echo "drizzle")

# ── 3. 准备远程目录 ───────────────────────────────────────────────────────────
log "📁 Preparing server directories..."
ssh $SSH_OPTS "$REMOTE" "mkdir -p \
    ${REMOTE_APP_DIR}/web \
    ${REMOTE_APP_DIR}/server/bin \
    ${REMOTE_APP_DIR}/server/${DRIZZLE_OUT} \
    ${REMOTE_APP_DIR}/server/src"

# ── 4. rsync 文件 ─────────────────────────────────────────────────────────────
log "📤 Syncing frontend..."
rsync -az --delete -e "ssh $SSH_OPTS" \
    "$PROJECT_DIR/apps/web/dist/" \
    "${REMOTE}:${REMOTE_APP_DIR}/web/"

log "📤 Syncing backend source..."
rsync -az --delete -e "ssh $SSH_OPTS" \
    "$PROJECT_DIR/apps/server/src/" \
    "${REMOTE}:${REMOTE_APP_DIR}/server/src/"
rsync -az -e "ssh $SSH_OPTS" \
    "$PROJECT_DIR/apps/server/package.json" \
    "${REMOTE}:${REMOTE_APP_DIR}/server/"

if [ -f "$PROJECT_DIR/apps/server/bun.lockb" ]; then
    rsync -az -e "ssh $SSH_OPTS" \
        "$PROJECT_DIR/apps/server/bun.lockb" \
        "${REMOTE}:${REMOTE_APP_DIR}/server/"
fi

if [ -d "$PROJECT_DIR/apps/server/$DRIZZLE_OUT" ]; then
    log "📤 Syncing migrations..."
    rsync -az -e "ssh $SSH_OPTS" \
        "$PROJECT_DIR/apps/server/$DRIZZLE_OUT/" \
        "${REMOTE}:${REMOTE_APP_DIR}/server/${DRIZZLE_OUT}/"
fi

# ── 5. 服务器上安装依赖 + 编译二进制 ─────────────────────────────────────────
log "🔨 Installing deps and compiling on server..."
ssh $SSH_OPTS "$REMOTE" "
    cd ${REMOTE_APP_DIR}/server
    # 安装依赖（如果服务器有 bun）
    if command -v bun >/dev/null 2>&1; then
        bun install --frozen-lockfile 2>/dev/null || bun install
        bun build --compile --outfile bin/server src/index.ts
    elif command -v node >/dev/null 2>&1; then
        # 降级：直接用 node/bun run（不编译二进制）
        echo '[deploy] bun not found on server, will use bun run'
    fi
    chmod +x bin/server 2>/dev/null || true
"

# ── 6. nginx 配置 ────────────────────────────────────────────────────────────
log "🔧 Configuring nginx..."
ssh $SSH_OPTS "$REMOTE" "cat > /etc/nginx/conf.d/${APP_NAME}.conf" << NGINX
server {
    server_name _;
    root ${REMOTE_APP_DIR}/web;
    index index.html;

    location / { try_files \$uri \$uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; access_log off; }
    location /api/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    listen 80;
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log  /var/log/nginx/${APP_NAME}_error.log;
}
NGINX

# ── 7. 重启后端 ───────────────────────────────────────────────────────────────
log "🔄 Restarting backend..."
ssh $SSH_OPTS -T "$REMOTE" << SSHSCRIPT
pkill -f '${REMOTE_APP_DIR}/server/bin/server' 2>/dev/null || true
pkill -f 'bun.*${REMOTE_APP_DIR}' 2>/dev/null || true
sleep 1
if systemctl list-unit-files ${APP_NAME}-server.service > /dev/null 2>&1; then
    systemctl restart ${APP_NAME}-server
else
    cd ${REMOTE_APP_DIR}/server
    DATABASE_URL=file:./sqlite.db NODE_ENV=production PORT=${APP_PORT} ./bin/server >> /var/log/${APP_NAME}-server.log 2>&1 &
    echo "started pid=\$!"
fi
SSHSCRIPT
sleep 2

# nginx reload
ssh $SSH_OPTS "$REMOTE" "nginx -t && nginx -s reload"
sleep 1

# ── 8. 验证 ──────────────────────────────────────────────────────────────────
log "🔍 Verifying deployment..."
# 从有 playwright 安装的项目目录运行验证
(cd "${PROJECT_DIR}" && bun run "${SKILL_DIR}/scripts/verify-browser.ts" "${APP_URL}" /)

log ""
log "✅ Deployed: ${APP_URL}"
log "   Config:  ${CONF_FILE}"
log "   Logs:    ssh -p ${SSH_PORT} ${SSH_USER}@${SSH_HOST} 'tail -f /var/log/${APP_NAME}-server.log'"
