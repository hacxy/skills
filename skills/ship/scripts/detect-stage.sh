#!/usr/bin/env bash
set -euo pipefail

log() { echo "[detect-stage] $*" >&2; }

PROJECT_DIR="${1:-$PWD}"
PROJECT_NAME="${2:-}"
WORKFLOW_DIR="$HOME/.claude/skills/ship/workflow"

# 优先从状态文件读取（总监已声明执行计划）
if [ -n "$PROJECT_NAME" ] && [ -f "$WORKFLOW_DIR/$PROJECT_NAME.json" ]; then
  STATUS_FILE="$WORKFLOW_DIR/$PROJECT_NAME.json"
elif [ -f "$WORKFLOW_DIR/$(basename "$PROJECT_DIR").json" ]; then
  STATUS_FILE="$WORKFLOW_DIR/$(basename "$PROJECT_DIR").json"
else
  STATUS_FILE=""
fi

if [ -n "$STATUS_FILE" ]; then
  # 读取第一个非 done/skipped 的计划 Stage
  NEXT=$(jq -r '
    .stages[]
    | select(.status != "done" and .status != "skipped")
    | {id, name, status}
    | @json
  ' "$STATUS_FILE" | head -1)

  if [ -n "$NEXT" ]; then
    STAGE_ID=$(echo "$NEXT" | jq -r '.id')
    STAGE_NAME=$(echo "$NEXT" | jq -r '.name')
    STATUS=$(echo "$NEXT" | jq -r '.status')
    log "从状态文件读取：stage=$STAGE_ID ($STAGE_NAME), status=$STATUS"
    cat << EOF
{
  "stage": $STAGE_ID,
  "stage_name": "$STAGE_NAME",
  "status": "$STATUS",
  "ambiguous": false,
  "source": "status_file"
}
EOF
    exit 0
  else
    log "所有计划 Stage 已完成"
    cat << EOF
{
  "stage": null,
  "stage_name": "all-done",
  "ambiguous": false,
  "source": "status_file"
}
EOF
    exit 0
  fi
fi

# 回退：文件启发式检测（全新项目，尚未调用 plan）
cd "$PROJECT_DIR"

HAS_PRD=false
HAS_TDD=false
HAS_SCAFFOLD=false
HAS_TESTS=false
SRC_FILE_COUNT=0

ls docs/prd-*.md 2>/dev/null && HAS_PRD=true || true
ls docs/tdd-*.md 2>/dev/null && HAS_TDD=true || true
ls package.json 2>/dev/null && HAS_SCAFFOLD=true || true
ls tests/ 2>/dev/null && HAS_TESTS=true || true

if [ "$HAS_SCAFFOLD" = true ]; then
  SRC_FILE_COUNT=$(find apps/server/src apps/web/src -name "*.ts" -o -name "*.tsx" 2>/dev/null \
    | grep -v node_modules | grep -v "\.d\.ts" | wc -l | tr -d ' ')
fi

STAGE=1; STAGE_NAME="write-prd"; AMBIGUOUS=false

if [ "$HAS_PRD" = false ]; then
  STAGE=1; STAGE_NAME="write-prd"
elif [ "$HAS_TDD" = false ]; then
  STAGE=2; STAGE_NAME="write-tdd"
elif [ "$HAS_SCAFFOLD" = false ]; then
  STAGE=3; STAGE_NAME="scaffold-project"
elif [ "$HAS_TESTS" = false ]; then
  STAGE=4; STAGE_NAME="frontend-design"
elif [ "$SRC_FILE_COUNT" -lt 6 ]; then
  STAGE=6; STAGE_NAME="backend-dev"
else
  STAGE=9; STAGE_NAME="test"; AMBIGUOUS=true
fi

log "启发式检测：stage=$STAGE ($STAGE_NAME), src_files=$SRC_FILE_COUNT"

cat << EOF
{
  "stage": $STAGE,
  "stage_name": "$STAGE_NAME",
  "ambiguous": $AMBIGUOUS,
  "source": "heuristic",
  "has_prd": $HAS_PRD,
  "has_tdd": $HAS_TDD,
  "has_scaffold": $HAS_SCAFFOLD,
  "has_tests": $HAS_TESTS,
  "src_file_count": $SRC_FILE_COUNT
}
EOF
