#!/usr/bin/env bash
# env-sync-check.sh — Check that env vars are consistent across
#   1) apps/server/.env.example
#   2) .github/workflows/deploy.yml  (printf format string)
#   3) apps/server/src/              (process.env.XXX references)
#
# Usage: bash env-sync-check.sh <project-dir>
set -euo pipefail

PROJECT_DIR="${1:-$PWD}"

ENV_EXAMPLE="$PROJECT_DIR/apps/server/.env.example"
DEPLOY_FILE="$PROJECT_DIR/.github/workflows/deploy.yml"
SRC_DIR="$PROJECT_DIR/apps/server/src"

MISSING=0

# ── 1. Extract vars from .env.example (KEY= lines) ─────────────────────────
if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "[env-sync] WARN  .env.example not found: $ENV_EXAMPLE"
  EXAMPLE_VARS=""
else
  EXAMPLE_VARS=$(grep -E '^[A-Z][A-Z0-9_]+=' "$ENV_EXAMPLE" | sed 's/=.*//' | sort -u)
fi

# ── 2. Extract vars written by deploy.yml printf (KEY=%s / KEY=value) ───────
if [ ! -f "$DEPLOY_FILE" ]; then
  echo "[env-sync] WARN  deploy.yml not found: $DEPLOY_FILE"
  DEPLOY_VARS=""
else
  # Target the printf line specifically — format string uses KEY= not KEY:
  DEPLOY_VARS=$(grep "printf" "$DEPLOY_FILE" \
    | grep -oE '[A-Z][A-Z0-9_]+=' \
    | sed 's/=//' \
    | sort -u)
fi

# ── 3. Extract vars from src/ process.env.XXX references ───────────────────
if [ ! -d "$SRC_DIR" ]; then
  echo "[env-sync] WARN  src dir not found: $SRC_DIR"
  CODE_VARS=""
else
  CODE_VARS=$(grep -rh "process\.env\." "$SRC_DIR" --include="*.ts" 2>/dev/null \
    | grep -oE 'process[.]env[.][A-Z][A-Z0-9_]+' \
    | sed 's/process\.env\.//' \
    | sort -u)
fi

# Helper: check if $2 appears as a whole line in $1
in_list() { echo "$1" | grep -qx "$2" 2>/dev/null; }

echo ""
echo "=== [env-sync] Env Variable Sync Check ==="
echo ""
echo "  .env.example : $(echo "$EXAMPLE_VARS" | tr '\n' ' ')"
echo "  deploy.yml   : $(echo "$DEPLOY_VARS"  | tr '\n' ' ')"
echo "  code refs    : $(echo "$CODE_VARS"    | tr '\n' ' ')"
echo ""

# ── Check: vars used in code but NOT written by deploy.yml ─────────────────
for var in $CODE_VARS; do
  if ! in_list "$DEPLOY_VARS" "$var"; then
    echo "[MISSING FROM DEPLOY]      $var  — code uses it, deploy.yml printf does not write it"
    MISSING=1
  fi
done

# ── Check: vars used in code but NOT defined in .env.example ───────────────
for var in $CODE_VARS; do
  if ! in_list "$EXAMPLE_VARS" "$var"; then
    echo "[MISSING FROM ENV_EXAMPLE] $var  — code uses it, .env.example does not define it"
    MISSING=1
  fi
done

# ── Warn: vars in .env.example that code never reads (not an error) ─────────
for var in $EXAMPLE_VARS; do
  if ! in_list "$CODE_VARS" "$var"; then
    echo "[UNUSED IN CODE]           $var  — defined in .env.example but never read in src/"
  fi
done

echo ""
if [ "$MISSING" -eq 0 ]; then
  echo "[env-sync] ✅ All env vars are in sync"
  exit 0
else
  echo "[env-sync] ❌ Env var sync issues found (see above)"
  exit 1
fi
