#!/usr/bin/env bash
set -euo pipefail

log() { echo "[detect-stage] $*" >&2; }

HAS_PRD=false
HAS_TDD=false
HAS_SCAFFOLD=false
HAS_TESTS=false
HAS_COMMITS=false
SRC_FILE_COUNT=0

# 检测各阶段产物
ls docs/prd-*.md 2>/dev/null && HAS_PRD=true || true
ls docs/tdd-*.md 2>/dev/null && HAS_TDD=true || true
ls package.json 2>/dev/null && HAS_SCAFFOLD=true || true
ls tests/ 2>/dev/null && HAS_TESTS=true || true
git log --oneline -1 2>/dev/null && HAS_COMMITS=true || true

# 统计业务源码文件数（排除 node_modules 和脚手架默认文件）
if [ "$HAS_SCAFFOLD" = true ]; then
  SRC_FILE_COUNT=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null \
    | grep -v node_modules \
    | grep -v "\.d\.ts" \
    | wc -l \
    | tr -d ' ')
fi

# 判断起始阶段（明确情况由脚本决定，模糊情况输出 ambiguous 交给 LLM）
STAGE=1
STAGE_NAME="write-prd"
AMBIGUOUS=false

if [ "$HAS_PRD" = false ]; then
  STAGE=1; STAGE_NAME="write-prd"
elif [ "$HAS_PRD" = true ] && [ "$HAS_TDD" = false ]; then
  STAGE=2; STAGE_NAME="write-tdd"
elif [ "$HAS_TDD" = true ] && [ "$HAS_SCAFFOLD" = false ]; then
  STAGE=3; STAGE_NAME="scaffold-project"
elif [ "$HAS_SCAFFOLD" = true ] && [ "$HAS_TESTS" = false ]; then
  # stage 4 (dev) vs stage 5 (code-review)：按源码文件数启发式判断
  if [ "$SRC_FILE_COUNT" -lt 6 ]; then
    STAGE=4; STAGE_NAME="dev"
  else
    STAGE=5; STAGE_NAME="code-review"
    AMBIGUOUS=true  # 文件数量无法精确判断是否已完成开发，LLM 需复核
  fi
elif [ "$HAS_TESTS" = true ]; then
  # stage 6 (test) vs stage 7 (deploy)：无法通过文件判断是否已部署，交给 LLM
  STAGE=6; STAGE_NAME="test"
  AMBIGUOUS=true
fi

log "检测结果：stage=$STAGE ($STAGE_NAME), src_files=$SRC_FILE_COUNT"

cat << EOF
{
  "stage": $STAGE,
  "stage_name": "$STAGE_NAME",
  "ambiguous": $AMBIGUOUS,
  "has_prd": $HAS_PRD,
  "has_tdd": $HAS_TDD,
  "has_scaffold": $HAS_SCAFFOLD,
  "has_tests": $HAS_TESTS,
  "has_commits": $HAS_COMMITS,
  "src_file_count": $SRC_FILE_COUNT
}
EOF
