#!/usr/bin/env bash
set -euo pipefail

log() { echo "[run-e2e] $*" >&2; }

if [ ! -d "tests/e2e" ]; then
  log "tests/e2e 目录不存在，跳过 E2E 测试"
  echo '{"status": "skipped", "reason": "tests/e2e not found", "passed": 0, "failed": 0, "total": 0}'
  exit 0
fi

log "运行 E2E 测试（Playwright）..."
OUTPUT=$(npx playwright test tests/e2e 2>&1) || true
EXIT_CODE=$?

PASSED=$(echo "$OUTPUT" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | tail -1 || echo 0)
FAILED=$(echo "$OUTPUT" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | tail -1 || echo 0)
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
