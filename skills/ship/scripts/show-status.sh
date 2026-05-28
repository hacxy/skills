#!/usr/bin/env bash
# 显示 workflow 进度（只显示计划内的 Stage）
# 用法: bash show-status.sh [project-name-or-status-file]

WORKFLOW_DIR="$HOME/.claude/skills/ship/workflow"
ARG="${1:-}"

if [ -f "$ARG" ]; then
  STATUS_FILE="$ARG"
elif [ -n "$ARG" ]; then
  STATUS_FILE="$WORKFLOW_DIR/$ARG.json"
else
  STATUS_FILE="$WORKFLOW_DIR/$(basename "$PWD").json"
fi

if [ ! -f "$STATUS_FILE" ]; then
  echo "⬜  Workflow has not started yet."
  echo "    Run: bash \$SKILL_DIR/scripts/update-status.sh init <project> <mode>"
  exit 0
fi

now() { date +%s; }

fmt_duration() {
  local secs=$1
  if [ "$secs" -lt 60 ]; then
    printf "%ds" "$secs"
  elif [ "$secs" -lt 3600 ]; then
    printf "%dm %02ds" $((secs / 60)) $((secs % 60))
  else
    printf "%dh %dm" $((secs / 3600)) $(((secs % 3600) / 60))
  fi
}

PROJECT=$(jq -r '.project' "$STATUS_FILE")
MODE=$(jq -r '.mode' "$STATUS_FILE")
STARTED=$(jq '.started_at' "$STATUS_FILE")
NOW=$(now)
ELAPSED=$((NOW - STARTED))

TOTAL=$(jq '.stages | length' "$STATUS_FILE")
DONE_COUNT=$(jq '[.stages[] | select(.status == "done")] | length' "$STATUS_FILE")
FAIL_COUNT=$(jq '[.stages[] | select(.status == "failed")] | length' "$STATUS_FILE")
PLANNED_COUNT=$(jq '.planned_stage_ids | length' "$STATUS_FILE")

echo ""
echo "  📋  $PROJECT  ($MODE)"
echo "  🕐  Started: $(date -r "$STARTED" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$STARTED" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "unknown")  │  Elapsed: $(fmt_duration $ELAPSED)"
echo "  📊  Planned: $PLANNED_COUNT stages  │  Done: $DONE_COUNT  │  Failed: $FAIL_COUNT"
echo ""

for i in $(seq 0 $((TOTAL - 1))); do
  STAGE=$(jq ".stages[$i]" "$STATUS_FILE")
  ID=$(echo "$STAGE" | jq '.id')
  NAME=$(echo "$STAGE" | jq -r '.name')
  STATUS=$(echo "$STAGE" | jq -r '.status')
  DURATION=$(echo "$STAGE" | jq '.duration_s // 0')
  STARTED_AT=$(echo "$STAGE" | jq '.started_at // 0')
  RETRY=$(echo "$STAGE" | jq '.retry_count // 0')
  ERROR=$(echo "$STAGE" | jq -r '.error // ""')

  RETRY_STR=""
  [ "$RETRY" -gt 0 ] && RETRY_STR="  (retry×$RETRY)"

  case "$STATUS" in
    done)
      DUR_STR=$(fmt_duration "$DURATION")
      printf "  ✅  [%2d] %-22s %s%s\n" "$ID" "$NAME" "$DUR_STR" "$RETRY_STR"
      ;;
    in_progress)
      RUNNING=$((NOW - STARTED_AT))
      DUR_STR=$(fmt_duration "$RUNNING")
      printf "  ⏳  [%2d] %-22s %s  ◐ running...%s\n" "$ID" "$NAME" "$DUR_STR" "$RETRY_STR"
      ;;
    failed)
      DUR_STR=$(fmt_duration "$DURATION")
      printf "  ❌  [%2d] %-22s %s  ✗ %s%s\n" "$ID" "$NAME" "$DUR_STR" "$ERROR" "$RETRY_STR"
      ;;
    pending)
      printf "  ⬜  [%2d] %-22s —\n" "$ID" "$NAME"
      ;;
  esac
done

echo ""
