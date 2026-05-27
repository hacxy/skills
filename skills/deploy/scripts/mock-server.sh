#!/usr/bin/env bash
# deploy.sh <project-dir> [app-name] [port]
# 模拟真实服务器部署：
#   nginx 静态文件服务 + proxy_pass /api/ → Elysia（bun run）
#
# 真实服务器差异说明：
#   真实服务器用 bun build --compile 编译为原生 Linux x86_64 二进制（systemd 管理）
#   mock 环境用 bun run 直接运行（避免 macOS 交叉编译问题）
#   nginx 配置行为完全一致

set -euo pipefail

PROJECT_DIR="${1:?Usage: deploy.sh <project-dir> [app-name] [port]}"
APP_NAME="${2:-$(basename "$PROJECT_DIR")}"
APP_PORT="${3:-3000}"
CONTAINER="mock-server"
MOCK_DIR="$(cd "$(dirname "$0")" && pwd)"

log() { echo "[deploy] $*"; }

# 确保容器运行
if ! docker ps --format '{{.Names}}' | grep -q "^$CONTAINER$"; then
    log "Starting mock-server..."
    docker compose -f "$MOCK_DIR/docker-compose.yml" up -d
    sleep 3
fi

log "📦 Building frontend..."
(cd "$PROJECT_DIR/apps/web" && bun run build)

log "📁 Preparing container directories..."
docker exec "$CONTAINER" mkdir -p \
    "/srv/projects/$APP_NAME/web" \
    "/srv/projects/$APP_NAME/server/src/db/migrations" \
    "/srv/projects/$APP_NAME/server/drizzle"

log "📤 Copying frontend static files → /srv/projects/$APP_NAME/web/"
docker cp "$PROJECT_DIR/apps/web/dist/." \
    "$CONTAINER:/srv/projects/$APP_NAME/web/"

log "📤 Copying server source..."
docker cp "$PROJECT_DIR/apps/server/src/." \
    "$CONTAINER:/srv/projects/$APP_NAME/server/src/"
docker cp "$PROJECT_DIR/apps/server/package.json" \
    "$CONTAINER:/srv/projects/$APP_NAME/server/"

# 复制 drizzle 迁移文件（路径由 drizzle.config.ts 的 out 字段决定）
DRIZZLE_OUT=$(grep '"out":\|out:' "$PROJECT_DIR/apps/server/drizzle.config.ts" 2>/dev/null | grep -o '"[^"]*"' | tail -1 | tr -d '"' || echo "drizzle")
if [ -d "$PROJECT_DIR/apps/server/$DRIZZLE_OUT" ]; then
    docker cp "$PROJECT_DIR/apps/server/$DRIZZLE_OUT/." \
        "$CONTAINER:/srv/projects/$APP_NAME/server/$DRIZZLE_OUT/"
fi

# 复制数据库（如有）
if [ -f "$PROJECT_DIR/apps/server/dev.db" ]; then
    log "📤 Copying database..."
    docker cp "$PROJECT_DIR/apps/server/dev.db" \
        "$CONTAINER:/srv/projects/$APP_NAME/server/sqlite.db"
fi

log "📦 Installing dependencies inside container..."
docker exec "$CONTAINER" sh -c \
    "cd /srv/projects/$APP_NAME/server && /root/.bun/bin/bun install" 2>&1 | tail -3

# .env（对应服务器 systemd Environment）
log "📝 Writing .env..."
docker exec "$CONTAINER" sh -c "cat > /srv/projects/$APP_NAME/server/.env << ENV
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=file:./sqlite.db
CORS_ORIGIN=http://localhost:8088
ENV"

# nginx conf（与服务器完全一致的 pattern）
log "🔧 Configuring nginx..."
sed "s/APP_NAME/$APP_NAME/g; s/APP_PORT/$APP_PORT/g" \
    "$HOME/.claude/skills/deploy/scripts/nginx-app.conf.template" \
    > "$HOME/Projects/mock-server/nginx/conf.d/${APP_NAME}.conf"

# 停止旧进程
docker exec "$CONTAINER" sh -c \
    "pkill -f 'bun.*src/index.ts.*$APP_NAME\|$APP_NAME.*bun' 2>/dev/null || true"
sleep 1

# 启动（bun run，模拟服务器行为）
log "🚀 Starting backend (bun run mode)..."
docker exec -d "$CONTAINER" sh -c \
    "cd /srv/projects/$APP_NAME/server && \
     DATABASE_URL=file:./sqlite.db NODE_ENV=production PORT=$APP_PORT \
     /root/.bun/bin/bun run src/index.ts >> /var/log/${APP_NAME}-server.log 2>&1"
sleep 3

# 重载 nginx
log "🔄 Reloading nginx..."
docker exec "$CONTAINER" nginx -s reload
sleep 1

# 验证
echo ""
log "=== Verification ==="
echo "Frontend:    $(curl -s "http://localhost:8088/" | grep -o '<title>[^<]*</title>')"
echo "SPA routes:  $(curl -s "http://localhost:8088/transactions" | grep -o '<title>[^<]*</title>')"
echo "JS MIME:     $(curl -sI "http://localhost:8088/assets/" 2>/dev/null | head -1 || echo 'no assets found')"
echo "API:         $(curl -s "http://localhost:8088/api/transactions" | head -c 50)"
echo ""
log "✅ Deployed at http://localhost:8088"
log "   Logs: docker exec $CONTAINER tail -f /var/log/${APP_NAME}-server.log"
