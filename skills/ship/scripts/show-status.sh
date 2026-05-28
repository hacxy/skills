#!/usr/bin/env bash
# 显示 workflow 进度
# 用法: bash show-status.sh [status_file]
# 搭配 watch: watch -n 1 bash show-status.sh

STATUS_FILE="${1:-$HOME/.claude/skills/ship/workflow/$(basename "$PWD").json}"

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

echo ""
echo "  📋  Workflow: $PROJECT  ($MODE)"
echo "  🕐  Started: $(date -r "$STARTED" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date -d "@$STARTED" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "unknown")  │  Elapsed: $(fmt_duration $ELAPSED)"
echo ""

TOTAL=$(jq '.stages | length' "$STATUS_FILE")
DONE_COUNT=$(jq '[.stages[] | select(.status == "done")] | length' "$STATUS_FILE")

for i in $(seq 0 $((TOTAL - 1))); do
  STAGE=$(jq ".stages[$i]" "$STATUS_FILE")
  ID=$(echo "$STAGE" | jq '.id')
  NAME=$(echo "$STAGE" | jq -r '.name')
  STATUS=$(echo "$STAGE" | jq -r '.status')
  DURATION=$(echo "$STAGE" | jq '.duration_s')
  STARTED_AT=$(echo "$STAGE" | jq '.started_at')
  ERROR=$(echo "$STAGE" | jq -r '.error // ""')

  case "$STATUS" in
    done)
      ICON="✅"
      DUR_STR=$(fmt_duration "$DURATION")
      printf "  %s  [%d] %-22s %s\n" "$ICON" "$ID" "$NAME" "$DUR_STR"
      ;;
    in_progress)
      ICON="⏳"
      RUNNING=$((NOW - STARTED_AT))
      DUR_STR=$(fmt_duration "$RUNNING")
      printf "  %s  [%d] %-22s %s  ◐ running...\n" "$ICON" "$ID" "$NAME" "$DUR_STR"
      ;;
    failed)
      ICON="❌"
      DUR_STR=$(fmt_duration "$DURATION")
      printf "  %s  [%d] %-22s %s  ✗ %s\n" "$ICON" "$ID" "$NAME" "$DUR_STR" "$ERROR"
      ;;
    pending)
      ICON="⬜"
      printf "  %s  [%d] %-22s —\n" "$ICON" "$ID" "$NAME"
      ;;
  esac
done

echo ""
echo "  Progress: $DONE_COUNT / $TOTAL stages completed"
echo ""
