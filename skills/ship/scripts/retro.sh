#!/usr/bin/env bash
# retro.sh <project-name> <project-dir>
# 采集本次 ship 运行数据，生成复盘 context 文件供 LLM agent 分析
set -euo pipefail

PROJECT="${1:?Usage: retro.sh <project-name> <project-dir>}"
PROJECT_DIR="${2:?Usage: retro.sh <project-name> <project-dir>}"
WORKFLOW_DIR="$HOME/.claude/skills/ship/workflow"
STATUS_FILE="$WORKFLOW_DIR/$PROJECT.json"
CONTEXT_FILE="/tmp/ship-retro-context-$PROJECT.md"

if [ ! -f "$STATUS_FILE" ]; then
  echo "[retro] 找不到状态文件: $STATUS_FILE" >&2
  exit 1
fi

STAGE_NAMES=("" "write-prd" "write-tdd" "scaffold-project" "frontend-design" "write-tests" "backend-dev" "frontend-dev" "code-review" "test" "deploy")

MODE=$(jq -r '.mode' "$STATUS_FILE")
STARTED_AT=$(jq -r '.started_at' "$STATUS_FILE")
NOW=$(date +%s)
TOTAL_DURATION=$((NOW - STARTED_AT))
TOTAL_MIN=$((TOTAL_DURATION / 60))
DATE_STR=$(date '+%Y-%m-%d %H:%M')

{
  echo "# Ship 运行数据 — $PROJECT"
  echo ""
  echo "- **日期**：$DATE_STR"
  echo "- **模式**：$MODE"
  echo "- **总耗时**：约 ${TOTAL_MIN} 分钟"
  echo ""
  echo "## 各阶段执行摘要"
  echo ""
  echo "| Stage | 名称 | 状态 | 耗时(s) | Retry次数 | 失败原因 |"
  echo "|---|---|---|---|---|---|"

  STAGE_COUNT=$(jq '.stages | length' "$STATUS_FILE")
  for i in $(seq 0 $((STAGE_COUNT - 1))); do
    STAGE=$(jq ".stages[$i]" "$STATUS_FILE")
    ID=$(echo "$STAGE" | jq -r '.id')
    NAME=$(echo "$STAGE" | jq -r '.name')
    STATUS=$(echo "$STAGE" | jq -r '.status')
    DURATION=$(echo "$STAGE" | jq -r '.duration_s // "-"')
    RETRY=$(echo "$STAGE" | jq -r '.retry_count // 0')
    FAIL_HISTORY=$(echo "$STAGE" | jq -r '.fail_history // [] | join(" | ")')
    echo "| $ID | $NAME | $STATUS | $DURATION | $RETRY | $FAIL_HISTORY |"
  done

  echo ""
  echo "## 问题阶段详情"
  echo ""

  for i in $(seq 0 $((STAGE_COUNT - 1))); do
    STAGE=$(jq ".stages[$i]" "$STATUS_FILE")
    ID=$(echo "$STAGE" | jq -r '.id')
    NAME=$(echo "$STAGE" | jq -r '.name')
    STATUS=$(echo "$STAGE" | jq -r '.status')
    RETRY=$(echo "$STAGE" | jq -r '.retry_count // 0')
    FAIL_HISTORY=$(echo "$STAGE" | jq -r '.fail_history // []')

    if [ "$STATUS" = "failed" ] || [ "$RETRY" -gt 0 ] 2>/dev/null; then
      echo "### Stage $ID — $NAME（状态: $STATUS，Retry: $RETRY 次）"
      echo ""
      echo "**失败历史：**"
      echo "$FAIL_HISTORY" | jq -r '.[]' 2>/dev/null | while IFS= read -r reason; do
        echo "- $reason"
      done
      echo ""
    fi
  done

  echo "## Git 提交记录（workflow checkpoints）"
  echo ""
  if git -C "$PROJECT_DIR" log --oneline --grep="workflow:" 2>/dev/null | head -20; then
    true
  else
    echo "（无 workflow 提交记录）"
  fi

  echo ""
  echo "## 项目文档摘要"
  echo ""
  PRD=$(ls "$PROJECT_DIR"/docs/prd-*.md 2>/dev/null | head -1 || echo "")
  if [ -n "$PRD" ]; then
    echo "### PRD（首段）"
    head -30 "$PRD"
    echo ""
  fi
  TDD=$(ls "$PROJECT_DIR"/docs/tdd-*.md 2>/dev/null | head -1 || echo "")
  if [ -n "$TDD" ]; then
    echo "### TDD（首段）"
    head -30 "$TDD"
    echo ""
  fi

} > "$CONTEXT_FILE"

echo "[retro] Context 文件已生成: $CONTEXT_FILE"
echo "$CONTEXT_FILE"
