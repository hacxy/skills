#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:?Usage: analyze-project.sh <project_dir>}"
log() { echo "[analyze-project] $*" >&2; }

cd "$PROJECT_DIR"

# 包管理器检测
PKG_MANAGER="npm"
[ -f "bun.lockb" ] || [ -f "bun.lock" ] && PKG_MANAGER="bun"
[ -f "pnpm-lock.yaml" ] && PKG_MANAGER="pnpm"
[ -f "yarn.lock" ] && PKG_MANAGER="yarn"

# 项目类型检测
PROJECT_TYPE="static"
BUILD_CMD="$PKG_MANAGER run build"
BUILD_OUTPUT="dist"

if [ -f "package.json" ]; then
  HAS_NEXT=$(jq -r '.dependencies.next // .devDependencies.next // empty' package.json 2>/dev/null)
  HAS_VITE=$(jq -r '.devDependencies.vite // empty' package.json 2>/dev/null)
  HAS_ELYSIA=$(jq -r '.dependencies.elysia // empty' package.json 2>/dev/null)
  HAS_EXPRESS=$(jq -r '.dependencies.express // empty' package.json 2>/dev/null)

  [ -n "${HAS_NEXT:-}" ] && PROJECT_TYPE="ssr" && BUILD_OUTPUT=".next"
  [ -n "${HAS_ELYSIA:-}" ] || [ -n "${HAS_EXPRESS:-}" ] && PROJECT_TYPE="backend" && BUILD_OUTPUT="src"
  [ -n "${HAS_VITE:-}" ] && [ "$PROJECT_TYPE" = "static" ] && BUILD_OUTPUT="dist"
fi

# monorepo 检测
IS_MONOREPO=false
[ -f "pnpm-workspace.yaml" ] || [ -d "apps" ] && IS_MONOREPO=true

log "pkg_manager=$PKG_MANAGER, type=$PROJECT_TYPE, output=$BUILD_OUTPUT, monorepo=$IS_MONOREPO"

cat << EOF
{
  "pkg_manager": "$PKG_MANAGER",
  "build_cmd": "$BUILD_CMD",
  "build_output": "$BUILD_OUTPUT",
  "project_type": "$PROJECT_TYPE",
  "is_monorepo": $IS_MONOREPO
}
EOF
