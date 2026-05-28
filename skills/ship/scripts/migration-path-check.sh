#!/usr/bin/env bash
# migration-path-check.sh — Verify that drizzle.config.ts `out:` and
#   src/db/client.ts `migrationsFolder` point to the same directory.
#
# Usage: bash migration-path-check.sh <project-dir>
set -euo pipefail

PROJECT_DIR="${1:-$PWD}"
DRIZZLE_CONFIG="$PROJECT_DIR/apps/server/drizzle.config.ts"
CLIENT_FILE="$PROJECT_DIR/apps/server/src/db/client.ts"

echo ""
echo "=== [migration-check] Migration Path Consistency Check ==="
echo ""

# ── Guard: graceful degradation if files are absent ─────────────────────────
SKIP=0

if [ ! -f "$DRIZZLE_CONFIG" ]; then
  echo "[migration-check] WARN  drizzle.config.ts not found: $DRIZZLE_CONFIG"
  SKIP=1
fi

if [ ! -f "$CLIENT_FILE" ]; then
  echo "[migration-check] WARN  client.ts not found: $CLIENT_FILE"
  SKIP=1
fi

if [ "$SKIP" -eq 1 ]; then
  echo "[migration-check] WARN  one or more files missing — skipping check"
  exit 0
fi

# ── Extract out: value from drizzle.config.ts ───────────────────────────────
# Matches:  out: './drizzle'   or   out: "drizzle"
CONFIG_OUT=$(grep "out:" "$DRIZZLE_CONFIG" \
  | sed "s/.*out:[[:space:]]*//" \
  | sed "s/['\"]//g;s/,.*//" \
  | sed 's/[[:space:]].*//' \
  | grep -v '^$' \
  | head -1 || true)

if [ -z "$CONFIG_OUT" ]; then
  echo "[migration-check] WARN  Could not extract 'out:' from drizzle.config.ts — skipping"
  exit 0
fi

# ── Extract migrationsFolder value from client.ts ───────────────────────────
# Strategy 1: direct string assignment → migrationsFolder = './drizzle'
CLIENT_FOLDER=$(grep "migrationsFolder" "$CLIENT_FILE" \
  | grep "=" \
  | grep -v "migrate(" \
  | sed "s/.*=[[:space:]]*//" \
  | grep -oE "'[^']+'" \
  | tr -d "'" \
  | tail -1 || true)

# Strategy 2: double-quoted direct assignment
if [ -z "$CLIENT_FOLDER" ]; then
  CLIENT_FOLDER=$(grep "migrationsFolder" "$CLIENT_FILE" \
    | grep "=" \
    | grep -v "migrate(" \
    | sed 's/.*=[[:space:]]*//' \
    | grep -oE '"[^"]+"' \
    | tr -d '"' \
    | tail -1 || true)
fi

# Strategy 3: join(something, 'path') — extract last quoted arg of join()
if [ -z "$CLIENT_FOLDER" ]; then
  CLIENT_FOLDER=$(grep "migrationsFolder" "$CLIENT_FILE" \
    | grep "join(" \
    | grep -oE "'[^']+'" \
    | tail -1 \
    | tr -d "'" || true)
fi

# Strategy 4: join() with double quotes
if [ -z "$CLIENT_FOLDER" ]; then
  CLIENT_FOLDER=$(grep "migrationsFolder" "$CLIENT_FILE" \
    | grep "join(" \
    | grep -oE '"[^"]+"' \
    | tail -1 \
    | tr -d '"' || true)
fi

if [ -z "$CLIENT_FOLDER" ]; then
  echo "[migration-check] WARN  Could not extract migrationsFolder from client.ts — skipping"
  exit 0
fi

# ── Normalize: strip leading ./ so we compare bare relative paths ────────────
normalize() { echo "$1" | sed 's|^\./||'; }

CONFIG_NORM=$(normalize "$CONFIG_OUT")
CLIENT_NORM=$(normalize "$CLIENT_FOLDER")

echo "[migration-check] drizzle.config.ts   out:               '$CONFIG_NORM'"
echo "[migration-check] src/db/client.ts    migrationsFolder:  '$CLIENT_NORM'"
echo ""

# ── Compare ──────────────────────────────────────────────────────────────────
if [ "$CONFIG_NORM" = "$CLIENT_NORM" ]; then
  echo "[migration-check] ✅ Migration paths are consistent"
  exit 0
else
  echo "[migration-check] ❌ Migration path mismatch!"
  echo "  drizzle.config.ts out:       '$CONFIG_NORM'"
  echo "  client.ts migrationsFolder:  '$CLIENT_NORM'"
  echo "  Fix: align both to the same path (e.g. './drizzle')"
  exit 1
fi
