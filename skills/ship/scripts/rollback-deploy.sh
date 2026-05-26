#!/usr/bin/env bash
# 生产环境回滚：将服务器上的当前版本替换回上一版本
# 用法: bash rollback-deploy.sh <project-name>
# 依赖: ~/.deploy-config.json 中的服务器配置
set -euo pipefail

PROJECT="${1:?Usage: rollback-deploy.sh <project-name>}"
CONFIG_FILE="$HOME/.deploy-config.json"

log() { echo "[rollback] $*" >&2; }

[ -f "$CONFIG_FILE" ] || { echo "No deploy config found at $CONFIG_FILE" >&2; exit 1; }

SERVER=$(jq -r '.server_host' "$CONFIG_FILE")
SSH_USER=$(jq -r '.ssh_user' "$CONFIG_FILE")
SSH_KEY=$(jq -r '.ssh_key_path' "$CONFIG_FILE")
PROJECTS_ROOT=$(jq -r '.projects_root' "$CONFIG_FILE")
DEPLOY_DIR="$PROJECTS_ROOT/$PROJECT"

SSH_OPTS="-o StrictHostKeyChecking=no"
[ -f "$SSH_KEY" ] && SSH_OPTS="$SSH_OPTS -i $SSH_KEY"

log "Checking for previous version on $SERVER..."
PREV_EXISTS=$(ssh $SSH_OPTS "$SSH_USER@$SERVER" \
  "[ -f '$DEPLOY_DIR/server-prev' ] && echo yes || echo no" 2>/dev/null)

if [ "$PREV_EXISTS" != "yes" ]; then
  echo "{\"status\":\"error\",\"message\":\"No previous version found at $DEPLOY_DIR/server-prev\"}" >&2
  exit 1
fi

log "Stopping current version..."
ssh $SSH_OPTS "$SSH_USER@$SERVER" \
  "pkill -f '$DEPLOY_DIR/server' 2>/dev/null; sleep 1; true"

log "Restoring previous version..."
ssh $SSH_OPTS "$SSH_USER@$SERVER" \
  "cp '$DEPLOY_DIR/server-prev' '$DEPLOY_DIR/server' && chmod +x '$DEPLOY_DIR/server'"

log "Starting previous version..."
ssh $SSH_OPTS "$SSH_USER@$SERVER" \
  "DATABASE_URL=file:$DEPLOY_DIR/app.db PORT=3001 nohup '$DEPLOY_DIR/server' > /tmp/${PROJECT}.log 2>&1 &"

sleep 2

log "Verifying service..."
STATUS=$(ssh $SSH_OPTS "$SSH_USER@$SERVER" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/ 2>/dev/null || echo 000")

if [ "$STATUS" = "200" ] || [ "$STATUS" = "404" ]; then
  log "Previous version is running (HTTP $STATUS)"
  echo "{\"status\":\"ok\",\"message\":\"Rolled back to previous version\",\"http_status\":\"$STATUS\"}"
else
  log "WARNING: Service may not be healthy (HTTP $STATUS)"
  echo "{\"status\":\"warning\",\"message\":\"Rollback done but service returned $STATUS\"}"
fi
