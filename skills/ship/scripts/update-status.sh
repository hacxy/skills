#!/usr/bin/env bash
# 更新 workflow 状态文件（存放于 ~/.claude/skills/ship/workflow/）
# 用法:
#   update-status.sh init <project> <mode>                      # 初始化（不预创建 Stage）
#   update-status.sh plan "<stage_ids>" <project>               # 总监声明执行计划
#   update-status.sh start <stage_id> [project]                 # 阶段开始
#   update-status.sh done <stage_id> [project]                  # 阶段完成（自动记录 git hash）
#   update-status.sh fail <stage_id> <reason> [project]         # 阶段失败
#   update-status.sh rollback <stage_id> [project]              # 回滚到指定阶段完成时的状态
set -euo pipefail

WORKFLOW_DIR="$HOME/.claude/skills/ship/workflow"
mkdir -p "$WORKFLOW_DIR"

# Stage ID → 名称映射（索引从 1 开始，0 位置留空）
STAGES=("" "write-prd" "write-tdd" "scaffold-project" "frontend-design" "write-tests" "backend-dev" "frontend-dev" "code-review" "test" "deploy")

log() { echo "[workflow] $*" >&2; }
now() { date +%s; }
git_hash() { git rev-parse HEAD 2>/dev/null || echo ""; }

stage_name() {
  local id=$1
  if [ "$id" -ge 1 ] && [ "$id" -le 10 ]; then
    echo "${STAGES[$id]}"
  else
    echo "stage-$id"
  fi
}

case "${1:-}" in
  init)
    PROJECT="${2:-$(basename "$PWD")}"
    MODE="${3:-new-project}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"
    log "Initializing: $PROJECT ($MODE) → $STATUS_FILE"
    cat > "$STATUS_FILE" << ENDJSON
{
  "project": "$PROJECT",
  "mode": "$MODE",
  "started_at": $(now),
  "planned_stage_ids": [],
  "stages": []
}
ENDJSON
    echo "{\"status\":\"ok\",\"file\":\"$STATUS_FILE\"}"
    ;;

  plan)
    STAGE_IDS="${2:?Usage: update-status.sh plan \"<stage_ids>\" <project>}"
    PROJECT="${3:-$(basename "$PWD")}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"

    # 构建 planned_stage_ids 数组和 stages 初始条目
    IDS_JSON="[]"
    STAGES_JSON="[]"
    for STAGE_ID in $STAGE_IDS; do
      STAGE_ID=$(echo "$STAGE_ID" | tr -d ' ')
      [ -z "$STAGE_ID" ] && continue
      NAME=$(stage_name "$STAGE_ID")
      IDS_JSON=$(echo "$IDS_JSON" | jq ". + [$STAGE_ID]")
      ENTRY="{\"id\":$STAGE_ID,\"name\":\"$NAME\",\"status\":\"pending\",\"started_at\":null,\"ended_at\":null,\"git_hash\":null,\"retry_count\":0,\"fail_history\":[]}"
      STAGES_JSON=$(echo "$STAGES_JSON" | jq ". + [$ENTRY]")
    done

    jq ".planned_stage_ids = $IDS_JSON | .stages = $STAGES_JSON" \
      "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"

    log "Plan set: stages [$(echo "$STAGE_IDS" | tr '\n' ' ')]"
    echo "{\"status\":\"ok\",\"planned\":$IDS_JSON}"
    ;;

  start)
    STAGE_ID="${2:?Usage: update-status.sh start <stage_id>}"
    PROJECT="${3:-$(basename "$PWD")}"
    STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"
    NOW=$(now)

    # 如果 Stage 不在 stages[]，临时追加（总监临时决策兼容）
    EXISTS=$(jq "[.stages[] | select(.id == $STAGE_ID)] | length" "$STATUS_FILE")
    if [ "$EXISTS" -eq 0 ]; then
      NAME=$(stage_name "$STAGE_ID")
      ENTRY="{\"id\":$STAGE_ID,\"name\":\"$NAME\",\"status\":\"pending\",\"started_at\":null,\"ended_at\":null,\"git_hash\":null,\"retry_count\":0,\"fail_history\":[]}"
      jq ".stages += [$ENTRY]" "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"
      log "Stage $STAGE_ID ($NAME) 临时追加到执行计划"
    fi

    CURRENT_STATUS=$(jq -r ".stages[] | select(.id == $STAGE_ID) | .status" "$STATUS_FILE")
    log "Stage $STAGE_ID → in_progress"
    jq "(.stages[] | select(.id == $STAGE_ID)).status = \"in_progress\" |
        (.stages[] | select(.id == $STAGE_ID)).started_at = $NOW" \
      "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"

    if [ "$CURRENT_STATUS" = "failed" ]; then
      jq "(.stages[] | select(.id == $STAGE_ID)).retry_count = \
          ((.stages[] | select(.id == $STAGE_ID)).retry_count // 0) + 1" \
        "$STATUS_FILE" > /tmp/.ws_tmp && mv /tmp/.ws_tmp "$STATUS_FILE"
      RETRY=$(jq ".stages[] | select(.id == $STAGE_ID) | .retry_count" "$STATUS_FILE")
      log "Stage $STAGE_ID retry #$RETRY"
    fi
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
        (.stages[] | select(.id == $STAGE_ID)).error = \"$REASON\" |
        (.stages[] | select(.id == $STAGE_ID)).fail_history += [\"$REASON\"]" \
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
    echo "Usage: update-status.sh <init|plan|start|done|fail|rollback> [args...]" >&2
    exit 1
    ;;
esac
