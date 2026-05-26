#!/usr/bin/env bash
set -euo pipefail

SERVER_HOST="${1:?Usage: save-config.sh <server_host> <ssh_user> <deploy_user> <projects_root> <domain_pattern> [ssh_key_path] [ssh_alias]}"
SSH_USER="${2:?}"
DEPLOY_USER="${3:?}"
PROJECTS_ROOT="${4:?}"
DOMAIN_PATTERN="${5:?}"
SSH_KEY_PATH="${6:-/home/$DEPLOY_USER/.ssh/github_actions}"
SSH_ALIAS="${7:-}"

CONFIG_FILE="$HOME/.deploy-config.json"
log() { echo "[save-config] $*" >&2; }

log "保存服务器配置到 $CONFIG_FILE"

cat > "$CONFIG_FILE" << EOF
{
  "server_host": "$SERVER_HOST",
  "ssh_user": "$SSH_USER",
  "deploy_user": "$DEPLOY_USER",
  "projects_root": "$PROJECTS_ROOT",
  "domain_pattern": "$DOMAIN_PATTERN",
  "ssh_key_path": "$SSH_KEY_PATH",
  "ssh_alias": "$SSH_ALIAS"
}
EOF

chmod 600 "$CONFIG_FILE"
log "配置已保存（权限 600）"

echo "{\"status\": \"ok\", \"config_file\": \"$CONFIG_FILE\"}"
