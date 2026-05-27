#!/usr/bin/env bash
# validate-stage.sh <stage_id> <project_dir>
# 每个 Stage 完成时自动验证产出——脚本能做的事不交给 LLM 判断
# 返回 0 = 通过，1 = 失败（调用方在失败时不应 mark done）
set -euo pipefail

STAGE="${1:-}"
PROJECT_DIR="${2:-$PWD}"

pass() { echo "[validate] ✅ Stage $STAGE: $*"; }
fail() { echo "[validate] ❌ Stage $STAGE: $*" >&2; exit 1; }

case "$STAGE" in
  1)
    ls "$PROJECT_DIR"/docs/prd-*.md 2>/dev/null | grep -q . \
      || fail "docs/prd-*.md 不存在"
    wc -c < "$(ls "$PROJECT_DIR"/docs/prd-*.md | head -1)" | grep -qv "^0$" \
      || fail "PRD 文件为空"
    pass "PRD 存在且有内容"
    ;;

  2)
    ls "$PROJECT_DIR"/docs/tdd-*.md 2>/dev/null | grep -q . \
      || fail "docs/tdd-*.md 不存在"
    pass "TDD 存在"
    ;;

  3)
    [ -f "$PROJECT_DIR/apps/server/src/index.ts" ] \
      || fail "apps/server/src/index.ts 缺失"
    [ -f "$PROJECT_DIR/apps/web/src/main.tsx" ] \
      || fail "apps/web/src/main.tsx 缺失"
    [ -f "$PROJECT_DIR/package.json" ] \
      || fail "workspace package.json 缺失"
    # 验证服务器能启动
    (cd "$PROJECT_DIR/apps/server" && bun run src/index.ts &)
    SERVER_PID=$!
    sleep 3
    if curl -sf http://localhost:3000 > /dev/null 2>&1 || \
       curl -sf http://localhost:3000/api 2>&1 | grep -qv "connection refused"; then
      kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null || true
      pass "项目结构完整，服务器可启动"
    else
      kill $SERVER_PID 2>/dev/null; wait $SERVER_PID 2>/dev/null || true
      fail "服务器启动失败"
    fi
    ;;

  4)
    count=$(ls "$PROJECT_DIR"/design/*.html 2>/dev/null | wc -l | tr -d ' ')
    [ "$count" -gt 0 ] || fail "design/ 下没有 HTML 原型文件"
    pass "$count 个 HTML 原型"
    ;;

  5)
    [ -d "$PROJECT_DIR/tests/unit" ] || fail "tests/unit/ 不存在"
    [ -d "$PROJECT_DIR/tests/api"  ] || fail "tests/api/ 不存在"
    [ -d "$PROJECT_DIR/tests/e2e"  ] || fail "tests/e2e/ 不存在"
    # 单元测试必须全通
    result=$(cd "$PROJECT_DIR" && bun test tests/unit/ 2>&1)
    echo "$result" | grep -q " 0 fail" || fail "单元测试未全通:\n$result"
    # API 测试必须存在且有内容（全红证明它们是真实的）
    api_files=$(ls "$PROJECT_DIR"/tests/api/*.test.ts 2>/dev/null | wc -l | tr -d ' ')
    [ "$api_files" -gt 0 ] || fail "tests/api/ 下没有测试文件"
    pass "单元测试全通，API 测试骨架存在（$api_files 个文件）"
    ;;

  6)
    result=$(cd "$PROJECT_DIR" && bun test tests/unit/ tests/api/ 2>&1)
    if echo "$result" | grep -q " 0 fail"; then
      summary=$(echo "$result" | grep -E "[0-9]+ pass" | tail -1)
      pass "单元 + API 测试全通: $summary"
    else
      fail "测试未全通:\n$result"
    fi
    ;;

  7)
    result=$(cd "$PROJECT_DIR/apps/web" && bun run build 2>&1)
    echo "$result" | grep -qE "built in|✓ built" || fail "前端构建失败:\n$result"
    pass "前端构建成功"
    ;;

  9)
    result=$(cd "$PROJECT_DIR" && bun test tests/unit/ tests/api/ 2>&1)
    echo "$result" | grep -q " 0 fail" || fail "单元/API 测试失败:\n$result"
    pass "自动化测试全通"
    ;;

  10)
    curl -sf http://localhost:3000 > /dev/null 2>&1 \
      || fail "生产服务器（:3000）未响应"
    pass "生产服务器响应正常"
    ;;

  *)
    echo "[validate] Stage $STAGE 无自动验证，跳过"
    ;;
esac
