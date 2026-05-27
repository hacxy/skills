#!/usr/bin/env bash
set -euo pipefail

AGENTS_DIR="$HOME/.claude/agents"
REQUIRED=(
  product-manager
  tech-architect
  ui-designer
  test-engineer
  backend-engineer
  frontend-engineer
  code-reviewer
  devops-engineer
)

missing=()
for agent in "${REQUIRED[@]}"; do
  [[ -f "$AGENTS_DIR/$agent.md" ]] || missing+=("$agent")
done

if [[ ${#missing[@]} -eq 0 ]]; then
  echo "[ship] ✅ All agents installed"
  exit 0
fi

echo "[ship] Missing agents: ${missing[*]}"
echo "[ship] Installing from hacxy/agents..."

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if command -v gh &>/dev/null; then
  gh repo clone hacxy/agents "$TMP_DIR" -- --depth=1 --quiet 2>/dev/null
else
  git clone --depth=1 --quiet https://github.com/hacxy/agents "$TMP_DIR"
fi

bash "$TMP_DIR/scripts/install.sh"

echo ""
echo "[ship] ⚠️  Agents installed. Please RESTART Claude Code for them to take effect."
echo "[ship] After restarting, run /ship again to continue."
exit 1
