#!/usr/bin/env bash
set -euo pipefail

log() { echo "[check-deps] $*" >&2; }

results="[]"

check() {
  local name="$1"
  local cmd="$2"
  local version=""
  local ok=false

  if eval "$cmd" > /dev/null 2>&1; then
    ok=true
    version=$(eval "$cmd" 2>/dev/null | head -1 || echo "ok")
  fi

  local entry="{\"name\":\"$name\",\"ok\":$ok,\"version\":$(echo "$version" | jq -Rs .)}"
  results=$(echo "$results" | jq ". + [$entry]")
}

# 运行时
check "bun"        "bun --version"
check "node"       "node --version"
check "git"        "git --version"
check "jq"         "jq --version"

# 测试工具
check "playwright" "npx playwright --version"

# 全局 npm 工具
check "npx"        "npx --version"

ok_count=$(echo "$results" | jq '[.[] | select(.ok == true)] | length')
fail_count=$(echo "$results" | jq '[.[] | select(.ok == false)] | length')

echo "$results" | jq "{
  \"deps\": .,
  \"summary\": {\"ok\": $ok_count, \"missing\": $fail_count}
}"
