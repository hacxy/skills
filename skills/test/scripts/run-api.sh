#!/usr/bin/env bash
set -euo pipefail

log() { echo "[run-api] $*" >&2; }

if [ ! -d "tests/api" ]; then
  log "tests/api 目录不存在，跳过 API 测试"
  echo '{"status": "skipped", "reason": "tests/api not found", "passed": 0, "failed": 0, "total": 0}'
  exit 0
fi

log "运行 API 接口测试..."
OUTPUT=$(bun test tests/api 2>&1) || true
EXIT_CODE=$?

PASSED=$(echo "$OUTPUT" | grep -oE '[0-9]+ pass' | grep -oE '[0-9]+' | tail -1 || echo 0)
FAILED=$(echo "$OUTPUT" | grep -oE '[0-9]+ fail' | grep -oE '[0-9]+' | tail -1 || echo 0)
PASSED=${PASSED:-0}
FAILED=${FAILED:-0}
TOTAL=$((PASSED + FAILED))

STATUS="passed"
[ "$FAILED" -gt 0 ] && STATUS="failed"
[ "$EXIT_CODE" -ne 0 ] && [ "$FAILED" -eq 0 ] && STATUS="error"

log "结果：$PASSED 通过，$FAILED 失败"

cat << EOF
{
  "status": "$STATUS",
  "passed": $PASSED,
  "failed": $FAILED,
  "total": $TOTAL,
  "exit_code": $EXIT_CODE,
  "output": $(echo "$OUTPUT" | tail -20 | jq -Rs .)
}
EOF
