#!/usr/bin/env bash
# 更新 workflow 状态文件（存放于 ~/.claude/skills/ship/workflow/）
# 用法:
#   update-status.sh init <project> <mode>               # 初始化
#   update-status.sh start <stage_id> [project]          # 阶段开始
#   update-status.sh done <stage_id> [project]           # 阶段完成（自动记录 git hash）
#   update-status.sh fail <stage_id> <reason> [project]  # 阶段失败
#   update-status.sh rollback <stage_id> [project]       # 回滚到指定阶段完成时的状态
set -euo pipefail

WORKFLOW_DIR="$HOME/.claude/skills/ship/workflow"
mkdir -p "$WORKFLOW_DIR"

STAGES=("write-prd" "write-tdd" "scaffold-project" "frontend-design" "write-tests" "backend-dev" "frontend-dev" "code-review" "test" "deploy")

log() { echo "[workflow] $*" >&2; }
now() { date +%s; }
git_hash() { git rev-parse HEAD 2>/dev/null || echo ""; }

case "${1:-}" in
  init)
    PROJECT="${2:-$(basename "$PWD")}"
    MODE="${3:-new-project}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"
    log "Initializing: $PROJECT ($MODE) → $STATUS_FILE"
    # 迭代模式下跳过 Stage 3（scaffold-project）
    SKIP_STAGES=()
    [ "$MODE" = "iteration" ] && SKIP_STAGES=(3)

    STAGES_JSON="[]"
    for i in "${!STAGES[@]}"; do
      STAGE_ID=$((i + 1))
      STAGE_NAME="${STAGES[$i]}"
      STATUS="pending"
      for SKIP in "${SKIP_STAGES[@]}"; do
        [ "$STAGE_ID" -eq "$SKIP" ] && STATUS="skipped"
      done
      ENTRY="{\"id\":$STAGE_ID,\"name\":\"$STAGE_NAME\",\"status\":\"$STATUS\",\"started_at\":null,\"ended_at\":null,\"git_hash\":null}"
      STAGES_JSON=$(echo "$STAGES_JSON" | jq ". + [$ENTRY]")
    done
    cat > "$STATUS_FILE" << ENDJSON
{
  "project": "$PROJECT",
  "mode": "$MODE",
  "started_at": $(now),
  "stages": $STAGES_JSON
}
ENDJSON
    echo "{\"status\":\"ok\",\"file\":\"$STATUS_FILE\"}"
    ;;

  start)
    STAGE_ID="${2:?Usage: update-status.sh start <stage_id>}"
    PROJECT="${3:-$(basename "$PWD")}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"
    NOW=$(now)
    log "Stage $STAGE_ID → in_progress"
    jq "(.stages[] | select(.id == $STAGE_ID)).status = \"in_progress\" |
        (.stages[] | select(.id == $STAGE_ID)).started_at = $NOW" \
      "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"
    echo "{\"status\":\"ok\"}"
    ;;

  done)
    STAGE_ID="${2:?}"
    PROJECT="${3:-$(basename "$PWD")}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"
    NOW=$(now)
    STARTED=$(jq ".stages[] | select(.id == $STAGE_ID) | .started_at // $NOW" "$STATUS_FILE")
    DURATION=$((NOW - STARTED))
    HASH=$(git_hash)
    log "Stage $STAGE_ID → done (${DURATION}s) @ ${HASH:0:8}"

    # 自动创建 git checkpoint commit（如果有未提交的改动）
    if [ -n "$HASH" ] && ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
      STAGE_NAME=$(jq -r ".stages[] | select(.id == $STAGE_ID) | .name" "$STATUS_FILE")
      git add -A 2>/dev/null && \
      git commit --no-verify -m "workflow: stage $STAGE_ID ($STAGE_NAME) completed" 2>/dev/null || true
      HASH=$(git_hash)
    fi

    jq "(.stages[] | select(.id == $STAGE_ID)).status = \"done\" |
        (.stages[] | select(.id == $STAGE_ID)).ended_at = $NOW |
        (.stages[] | select(.id == $STAGE_ID)).duration_s = $DURATION |
        (.stages[] | select(.id == $STAGE_ID)).git_hash = \"$HASH\"" \
      "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"
    echo "{\"status\":\"ok\",\"duration_s\":$DURATION,\"git_hash\":\"$HASH\"}"
    ;;

  fail)
    STAGE_ID="${2:?}"
    REASON="${3:-unknown}"
    PROJECT="${4:-$(basename "$PWD")}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"
    NOW=$(now)
    STARTED=$(jq ".stages[] | select(.id == $STAGE_ID) | .started_at // $(now)" "$STATUS_FILE")
    DURATION=$((NOW - STARTED))
    log "Stage $STAGE_ID → failed: $REASON"
    jq "(.stages[] | select(.id == $STAGE_ID)).status = \"failed\" |
        (.stages[] | select(.id == $STAGE_ID)).ended_at = $NOW |
        (.stages[] | select(.id == $STAGE_ID)).duration_s = $DURATION |
        (.stages[] | select(.id == $STAGE_ID)).error = \"$REASON\"" \
      "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"
    echo "{\"status\":\"ok\"}"
    ;;

  rollback)
    STAGE_ID="${2:?Usage: update-status.sh rollback <stage_id>}"
    PROJECT="${3:-$(basename "$PWD")}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"

    STAGE_NAME=$(jq -r ".stages[] | select(.id == $STAGE_ID) | .name" "$STATUS_FILE")
    HASH=$(jq -r ".stages[] | select(.id == $STAGE_ID) | .git_hash // empty" "$STATUS_FILE")

    if [ -z "$HASH" ]; then
      echo "{\"status\":\"error\",\"message\":\"Stage $STAGE_ID has no git snapshot. Cannot rollback.\"}" >&2
      exit 1
    fi

    log "Rolling back to stage $STAGE_ID ($STAGE_NAME) @ ${HASH:0:8}"
    git reset --hard "$HASH" 2>/dev/null

    # 将后续阶段状态重置为 pending
    jq "(.stages[] | select(.id > $STAGE_ID)).status = \"pending\" |
        (.stages[] | select(.id > $STAGE_ID)).started_at = null |
        (.stages[] | select(.id > $STAGE_ID)).ended_at = null |
        (.stages[] | select(.id > $STAGE_ID)).git_hash = null |
        (.stages[] | select(.id > $STAGE_ID)).error = null" \
      "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"

    log "Rollback complete. Stages after $STAGE_ID reset to pending."
    echo "{\"status\":\"ok\",\"rolled_back_to\":$STAGE_ID,\"git_hash\":\"$HASH\"}"
    ;;

  *)
    echo "Usage: update-status.sh <init|start|done|fail|rollback> [args...]" >&2
    exit 1
    ;;
esac
