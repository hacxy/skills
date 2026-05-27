#!/usr/bin/env bash
# check-ports.sh [--kill]
# Stage 9/10 前检查端口可用性，--kill 选项自动释放占用进程
set -euo pipefail

KILL_MODE=false
[[ "${1:-}" == "--kill" ]] && KILL_MODE=true

PORTS=(3000 5173)
blocked=()

for port in "${PORTS[@]}"; do
  pids=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    proc=$(lsof -i :"$port" 2>/dev/null | grep LISTEN | awk '{print $1}' | head -1)
    blocked+=("$port ($proc, pid: $pids)")
    if $KILL_MODE; then
      echo "[ports] 释放端口 $port (pid: $pids)"
      kill $pids 2>/dev/null || true
    fi
  fi
done

if [ ${#blocked[@]} -eq 0 ]; then
  echo "[ports] ✅ 端口 3000 和 5173 均可用"
  exit 0
fi

if $KILL_MODE; then
  sleep 1
  echo "[ports] ✅ 端口已释放"
  exit 0
fi

echo "[ports] ❌ 以下端口被占用：" >&2
for b in "${blocked[@]}"; do
  echo "   - $b" >&2
done
echo "[ports] 运行 bash \$SKILL_DIR/scripts/check-ports.sh --kill 自动释放" >&2
exit 1
