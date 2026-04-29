# Skills 工具集

这是一个用于管理、检索、预览和分发本地 skills 的 monorepo。

## 技术栈（最新稳定版）

- Node.js 20+
- TypeScript
- Vite + React
- Commander CLI

## 目录结构

- `skills/`: skill 内容目录（每个 skill 含 `SKILL.md`）
- `packages/core`: 共享解析/检索/校验逻辑
- `packages/cli`: `skills` 命令行工具
- `apps/web`: Skill 检索与预览网页

## 本地开发

```bash
npm install
npm run build
npm run dev:web
```

## CLI 用法

```bash
# 列表/搜索/查看
node packages/cli/dist/index.js list --skills-dir .
node packages/cli/dist/index.js search commit --skills-dir .
node packages/cli/dist/index.js show find-docs --skills-dir .

# 安装到平台
node packages/cli/dist/index.js install --platform cursor --skills-dir .
node packages/cli/dist/index.js install --all-platforms --skills-dir .
node packages/cli/dist/index.js where codex
```

## 仅所有者上传（双因子）

上传功能要求同时通过两项校验：

1. GitHub 登录用户匹配 `SKILLS_OWNER_GITHUB`
2. 本地 token hash 文件与 `SKILLS_OWNER_TOKEN` 匹配

```bash
# 初始化 token hash 文件
node packages/cli/dist/index.js auth init --token your-secret-token

# 配置上传 token
export SKILLS_OWNER_TOKEN=your-secret-token
export SKILLS_OWNER_GITHUB=hacxy

# 查看认证状态
node packages/cli/dist/index.js auth status

# 上传 skill
node packages/cli/dist/index.js upload --source ./path/to/skill --skills-dir . --on-conflict rename
```

## Web 功能

- Skill 搜索与预览
- 路由直达：`/skill/:name`
- 仅 owner 显示上传入口（双因子失败时隐藏）
- 上传冲突策略：`rename`、`overwrite`、`error`

## CLI 发布说明

发布前建议：

1. 更新 `packages/cli/package.json`（`name`、`version`、`description`）
2. 执行构建：`npm run build`
3. 在 `packages/cli` 目录发布：`npm publish --access public`

---

English version: `README.md`
