#!/usr/bin/env bash
set -euo pipefail

PKG_MANAGER="${1:?Usage: gen-workflow.sh <pkg_manager> <build_output> <project_name> <project_type> <deploy_user> <projects_root> [port]}"
BUILD_OUTPUT="${2:?}"
PROJECT_NAME="${3:?}"
PROJECT_TYPE="${4:?}"
DEPLOY_USER="${5:?}"
PROJECTS_ROOT="${6:?}"
PORT="${7:-}"

log() { echo "[gen-workflow] $*" >&2; }

DEPLOY_DIR="$PROJECTS_ROOT/$PROJECT_NAME"
WORKFLOW_DIR=".github/workflows"
WORKFLOW_FILE="$WORKFLOW_DIR/deploy.yml"

mkdir -p "$WORKFLOW_DIR"

# 安装步骤
case "$PKG_MANAGER" in
  bun)
    SETUP_STEP='      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile'
    ;;
  pnpm)
    SETUP_STEP='      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile'
    ;;
  yarn)
    SETUP_STEP='      - run: yarn install --frozen-lockfile'
    ;;
  *)
    SETUP_STEP='      - run: npm ci'
    ;;
esac

# 后端服务重启命令
RESTART_CMD=""
if [ "$PROJECT_TYPE" = "backend" ] || [ "$PROJECT_TYPE" = "ssr" ]; then
  RESTART_CMD="          ssh -i ~/.ssh/deploy_key \${{ secrets.SSH_USER }}@\${{ secrets.SSH_HOST }} \"sudo systemctl restart $PROJECT_NAME\""
fi

log "生成 $WORKFLOW_FILE (type=$PROJECT_TYPE, pkg=$PKG_MANAGER)"

cat > "$WORKFLOW_FILE" << WORKFLOW
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

$SETUP_STEP

      - name: Build
        run: $PKG_MANAGER run build

      - name: Setup SSH
        run: |
          mkdir -p ~/.ssh
          echo "\${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H \${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy via rsync
        run: |
          rsync -avz --delete \\
            --exclude='.git' \\
            --exclude='node_modules' \\
            $BUILD_OUTPUT/ \\
            -e "ssh -i ~/.ssh/deploy_key" \\
            $DEPLOY_USER@\${{ secrets.SSH_HOST }}:$DEPLOY_DIR/
$([ -n "$RESTART_CMD" ] && echo "
      - name: Restart service
        run: |
$RESTART_CMD")
WORKFLOW

log "workflow 已生成：$WORKFLOW_FILE"
echo "{\"status\": \"ok\", \"file\": \"$WORKFLOW_FILE\"}"
