#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="${1:?Usage: sync-skill.sh <skill-name> [direction: project->global|global->project|both]}"
DIRECTION="${2:-both}"
PROJECT_SKILLS_DIR="${3:-/Users/hacxy/Projects/skills/skills}"
GLOBAL_SKILLS_DIR="${4:-/Users/hacxy/.claude/skills}"

log() { echo "[sync-skill] $*" >&2; }

PROJECT_PATH="$PROJECT_SKILLS_DIR/$SKILL_NAME"
GLOBAL_PATH="$GLOBAL_SKILLS_DIR/$SKILL_NAME"

sync_project_to_global() {
  log "$SKILL_NAME: project → global"
  [ -d "$PROJECT_PATH" ] || { log "ERROR: $PROJECT_PATH 不存在"; exit 1; }
  cp -r "$PROJECT_PATH/" "$GLOBAL_PATH/"
  log "同步完成"
}

sync_global_to_project() {
  log "$SKILL_NAME: global → project"
  [ -d "$GLOBAL_PATH" ] || { log "ERROR: $GLOBAL_PATH 不存在"; exit 1; }
  cp -r "$GLOBAL_PATH/" "$PROJECT_PATH/"
  log "同步完成"
}

case "$DIRECTION" in
  "project->global") sync_project_to_global ;;
  "global->project") sync_global_to_project ;;
  "both")
    [ -d "$PROJECT_PATH" ] && sync_project_to_global || sync_global_to_project
    ;;
  *) echo "ERROR: direction 必须是 project->global / global->project / both"; exit 1 ;;
esac

chmod +x "$GLOBAL_PATH/scripts/"*.sh 2>/dev/null || true
chmod +x "$PROJECT_PATH/scripts/"*.sh 2>/dev/null || true

echo "{\"status\": \"ok\", \"skill\": \"$SKILL_NAME\", \"direction\": \"$DIRECTION\"}"
