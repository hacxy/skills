#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="$HOME/.deploy-config.json"
log() { echo "[check-config] $*" >&2; }

if [ ! -f "$CONFIG_FILE" ]; then
  log "配置文件不存在：$CONFIG_FILE"
  echo '{"configured": false}'
  exit 0
fi

# 验证必填字段是否完整
REQUIRED_FIELDS=("server_host" "ssh_user" "deploy_user" "projects_root" "domain_pattern")
MISSING=()

for field in "${REQUIRED_FIELDS[@]}"; do
  VALUE=$(jq -r ".$field // empty" "$CONFIG_FILE" 2>/dev/null)
  if [ -z "$VALUE" ]; then
    MISSING+=("$field")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  MISSING_JSON=$(printf '%s\n' "${MISSING[@]}" | jq -R . | jq -s .)
  log "配置不完整，缺少字段：${MISSING[*]}"
  echo "{\"configured\": false, \"missing_fields\": $MISSING_JSON}"
  exit 0
fi

log "配置完整，读取成功"
jq '. + {"configured": true}' "$CONFIG_FILE"
