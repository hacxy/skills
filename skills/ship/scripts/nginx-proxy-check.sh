#!/usr/bin/env bash
# nginx-proxy-check.sh — Verify that the deploy skill's nginx template has a
#   location block for every non-/api/ route prefix used in the server.
#
# Usage: bash nginx-proxy-check.sh <project-dir>
set -euo pipefail

PROJECT_DIR="${1:-$PWD}"
NGINX_TEMPLATE="${HOME}/.claude/skills/deploy/scripts/nginx-app.conf.template"
ROUTES_DIR="$PROJECT_DIR/apps/server/src/routes"

echo ""
echo "=== [nginx-check] Nginx Proxy Coverage Check ==="
echo ""

# ── Guard: required paths ────────────────────────────────────────────────────
if [ ! -f "$NGINX_TEMPLATE" ]; then
  echo "[nginx-check] WARN  nginx template not found: $NGINX_TEMPLATE"
  echo "[nginx-check] WARN  install the deploy skill or check the path"
  exit 0
fi

if [ ! -d "$ROUTES_DIR" ]; then
  echo "[nginx-check] WARN  routes dir not found: $ROUTES_DIR"
  exit 0
fi

shopt -s nullglob
ROUTE_FILES=("$ROUTES_DIR"/*.ts)
shopt -u nullglob

if [ "${#ROUTE_FILES[@]}" -eq 0 ]; then
  echo "[nginx-check] WARN  no .ts files found in $ROUTES_DIR"
  exit 0
fi

MISSING=0

# ── Scan each route file for prefix declarations ─────────────────────────────
for route_file in "${ROUTE_FILES[@]}"; do
  filename="$(basename "$route_file")"

  # Extract all prefix: 'value' or prefix: "value" declarations
  prefixes=$(grep "prefix:" "$route_file" \
    | sed "s/.*prefix:[[:space:]]*//" \
    | sed "s/['\"]//g" \
    | grep -oE '^[^,} ]+' \
    | grep -v '^$' || true)

  [ -z "$prefixes" ] && continue

  while IFS= read -r prefix; do
    # Skip /api/* prefixes — the generic /api/ location block covers them
    case "$prefix" in
      /api*) continue ;;
    esac

    # Normalize: ensure trailing slash for nginx location match
    location="${prefix%/}/"

    if grep -q "location ${location}" "$NGINX_TEMPLATE"; then
      echo "[nginx-check] ✅ Covered:  location ${location}  (${filename})"
    else
      echo "[nginx-check] ❌ Missing location block for: ${location}  (${filename})"
      MISSING=1
    fi
  done <<< "$prefixes"
done

echo ""
if [ "$MISSING" -eq 0 ]; then
  echo "[nginx-check] ✅ All route prefixes covered in nginx template"
  exit 0
else
  echo "[nginx-check] ❌ Some route prefixes are missing from nginx template"
  exit 1
fi
