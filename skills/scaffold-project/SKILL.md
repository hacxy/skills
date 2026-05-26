---
name: scaffold-project
description: |
  Scaffold new fullstack projects (React + Elysia.js + SQLite + Drizzle ORM) that deliver a browser-accessible URL.
  Copies the fullstack template, renames the project, installs dependencies, initializes git.
  Use this skill when the user says "create new project", "new project", "init project", "scaffold", "start a new app",
  "create project", "I want to build a XX system", "help me set up a XX", "start a new XX project",
  "创建新项目", "新建项目", "初始化项目", "开一个新项目", "我要做一个 XX 系统", "帮我搭一个 XX".
  Even if the user doesn't explicitly say "scaffold", use this skill whenever the intent is to start a new web product from scratch.
---

# Scaffold Project

快速创建全栈项目的脚手架工具：React 前端 + Elysia.js 后端 + SQLite + Drizzle ORM，
产出物是一个可在浏览器访问的完整 Web 应用。

**只有一个模板：fullstack**（monorepo，包含 apps/server + apps/web + packages/shared）

## Core Principles

- **Do not ask for confirmation**: Template type, project name, directory location — make all decisions autonomously
- **Auto-derive project name**: Extract keywords from the user's description and convert to kebab-case (e.g., "build a blog system" → `blog-system`, "做一个天气应用" → `weather-app`)
- **If the user hasn't provided a detailed plan**: Autonomously design the feature plan (data models, API design, page structure, etc.), then start implementing immediately without waiting for approval
- **Target directory**: Create in the current working directory by default

## Language Detection

Detect the language the user is conversing in and use it as the project's default language. This affects:
- Code comments and inline documentation
- Error messages and user-facing strings in the scaffolded code
- API response messages (e.g., validation errors, business error messages)
- README and documentation files generated during development

For example, if the user writes in Chinese, error messages like `'邮箱已被注册'` stay in Chinese. If the user writes in English, use English equivalents like `'Email already registered'`.

## 技术栈

全栈模板包含：
- **后端**：Elysia.js + Bun + Drizzle ORM + SQLite
- **前端**：React 19 + Vite + TypeScript + React Router + Zustand
- **结构**：monorepo（apps/server + apps/web + packages/shared）
- **工具链**：ESLint + Husky + CommitLint + Playwright E2E

**Drizzle 使用方式：**
- 在 `apps/server/src/db/schema.ts` 定义表结构
- 运行 `bun db:push` 将 schema 同步到 SQLite（无需手写 migration 文件）
- 测试环境自动使用内存数据库（`:memory:`），不影响开发数据

---

## 模板内容

### 1. Fullstack — `templates/fullstack/`

Best for: Users who need a complete front-and-back project.

Includes:
- Full monorepo structure (apps/server + apps/web + packages/*)
- Elysia backend + React frontend
- Shared type package
- CI workflow
- E2E tests + unit tests

Selection signals: mentions "fullstack", "front and back", involves both API and pages, or doesn't specify frontend-only or backend-only

### 2. Frontend — `templates/frontend/`

Best for: Users who only need a frontend project, with APIs provided by another service.

Includes:
- React 19 + Vite + TypeScript
- React Router + Zustand state management
- openapi-fetch API client + auto type generation
- Playwright E2E tests
- ESLint + Husky + CommitLint

Selection signals: mentions "frontend", "React", "pages", "SPA", "web app", only needs UI without a backend

### 3. Backend — `templates/backend/`

Best for: Users who only need an API service.

Includes:
- Bun + Elysia + TypeScript
- Drizzle ORM + SQLite
- JWT authentication
- Swagger documentation
- Unit tests (bun:test)
- ESLint + Husky + CommitLint

Selection signals: mentions "backend", "API", "server-side", "server", "endpoints", no mention of pages/UI

### 4. CLI — `templates/cli/`

Best for: Users who need a command-line tool or CLI application.

Includes:
- Bun + TypeScript
- citty (command framework with subcommand support)
- consola (pretty logging)
- Compiled binary output (`bun build --compile`)
- Unit tests (bun:test)
- ESLint + Husky + CommitLint

Selection signals: mentions "CLI", "command line", "terminal tool", "脚手架", "命令行工具", wants to build a tool that runs in the terminal, no mention of web/API/pages

## Template Selection Decision Tree

Analyze the user's requirement description and decide using these priorities:

1. **User explicitly specified a template type?** → Use that template directly
2. **User mentions CLI/command-line/terminal tool, or wants a tool that processes input and produces output with no web interface?** → **CLI**
3. **User explicitly says "backend API already exists", "only need pages/frontend"?** → **Frontend**
4. **User only mentions API/endpoints/server-side/data processing, with zero mention of any interface/pages/display?** → **Backend**
5. **User describes a complete product (e.g., "blog system", "admin dashboard", "e-commerce platform")?** → **Fullstack** (complete products typically need front-and-back coordination)
6. **Can't determine?** → Default to **Fullstack** (broadest coverage — user can trim what they don't need)

Key principle: Most users describe product requirements, not technical requirements. When a user says "build a XX system", analyze what the system fundamentally needs:
- Needs a user-facing interface + needs to store/process data → Fullstack
- Only needs to display pages, data comes from external sources → Frontend
- Only needs to provide APIs, no user interface involved → Backend
- Runs in the terminal, processes files/input, no web server → CLI

## Scaffold Workflow

The entire flow runs end-to-end without pausing for user confirmation at any step.

### Step 1: Check Runtime Environment

Check if bun is available:
```bash
command -v bun
```
If not installed, install automatically:
```bash
curl -fsSL https://bun.sh/install | bash && source ~/.zshrc
```

### Step 2: Derive Project Name

Extract keywords from the user's description and convert to kebab-case:
- "task management system" → `task-manager`
- "做个天气应用" → `weather-app`
- "书签收藏夹" → `bookmarks`

### Step 3: Run Scaffold

Run the scaffold script (always fullstack):
```bash
bun run /Users/hacxy/.claude/skills/scaffold-project/scripts/scaffold.ts \
  --name <project-name> \
  --target <target-directory>
```

The script handles: template copying → name replacement → git init → bun install → initial commit.

### Step 4: Initialize Database Schema

After scaffolding, update `apps/server/src/db/schema.ts` with the project's tables, then sync to SQLite:
```bash
cd <project-dir>
bun db:push
```

### Step 5: Start Development

After the project is created and schema is synced:
- Inform the user of the created project structure
- Immediately start implementing features without waiting for user confirmation

---

## Create Template

When the user wants to add a new template type to this skill.

### Step 1: Understand Requirements

From the user's description, determine:
- **Template name**: short, lowercase identifier (e.g., `monorepo`, `library`, `electron`)
- **Core tech stack**: runtime, framework, key dependencies
- **Project structure**: entry point, source layout, output format

### Step 2: Create Template Files

Create `templates/<name>/` with these required files, following the conventions established by existing templates:

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts (`dev`, `build`, `lint`, `test`), lint-staged + commitlint config |
| `tsconfig.json` | TypeScript config with `@/*` path alias, bun-types |
| `eslint.config.js` | `@antfu/eslint-config` with TypeScript enabled |
| `.editorconfig` | UTF-8, 2-space indent, LF line endings |
| `.gitignore` | node_modules, dist, .env, coverage, build artifacts |
| `.husky/pre-commit` | `bunx lint-staged` |
| `.husky/commit-msg` | `bunx --no -- commitlint --edit "$1"` |
| `.github/workflows/ci.yml` | Lint + Build + Test jobs using `oven-sh/setup-bun@v2` |
| `LICENSE` | MIT license |
| `src/` | Entry point and core source files |
| `tests/` or `e2e/` | At least one working test |

Study existing templates for conventions — the new template should feel like it belongs in the same family.

### Step 3: Update scaffold.ts

In `scripts/scaffold.ts`:
1. Add the new template name to the type union
2. Add a `scaffold<Name>()` function that copies the template, updates `package.json` name, and handles any template-specific renaming
3. Add the case to the switch statement
4. Update the usage string

### Step 4: Update SKILL.md

1. Add a new template section under "## Templates" with description, tech stack, and selection signals
2. Update the template count ("Four templates" → "Five templates", etc.)
3. Add the template to the decision tree with appropriate priority
4. Update the `--template` flag options in the scaffold command

### Step 5: Verify

Run the scaffold script with the new template in `/tmp`, then:
1. `bun install` succeeds
2. `bun lint` passes
3. `bun test` passes
4. `bun run build` succeeds (if applicable)

Clean up the test project after verification.

### Step 6: Update READMEs

Update `README.md` and `README.zh.md` in the skill directory to reflect the new template.

---

## Optimize Template

When the user wants to improve an existing template — upgrade dependencies, refine configs, add features, or align with current best practices.

### Step 1: Identify Scope

Determine what to optimize:
- **Dependency updates**: Check for outdated packages, upgrade to latest stable
- **Config improvements**: Tighten TypeScript strict settings, improve ESLint rules, optimize build config
- **Structure refinement**: Better file organization, cleaner entry points, improved example code
- **New features**: Add tooling the template is missing (e.g., test coverage threshold, path aliases, API docs)

### Step 2: Apply Changes

Make changes directly to the template files in `templates/<name>/`. For dependency updates, update version ranges in `package.json` — the actual lockfile is generated fresh each time a project is scaffolded.

### Step 3: Cross-Template Consistency

After modifying one template, check if the same improvement should apply to others. Shared infrastructure (ESLint config style, husky hooks, CI workflow structure, editorconfig, commitlint) should stay consistent across all templates.

### Step 4: Verify

Same as Create Template Step 5 — scaffold a test project to `/tmp`, verify lint/test/build all pass, then clean up.

---

## Audit Templates

When the user wants to check template health — verify that all templates meet the baseline infrastructure requirements.

### Checklist

Run an automated check across all templates in `templates/` for:

| Category | Check | How |
|----------|-------|-----|
| **Lint** | `eslint.config.js` exists | file check |
| **Husky** | `.husky/pre-commit` + `.husky/commit-msg` exist | file check |
| **lint-staged** | `lint-staged` config in `package.json` | JSON field check |
| **CommitLint** | `commitlint` config in `package.json` | JSON field check |
| **Tests** | `tests/` or `e2e/` directory exists | dir check |
| **Test script** | `test` or `test:e2e` script in `package.json` | JSON field check |
| **CI** | `.github/workflows/ci.yml` exists | file check |
| **EditorConfig** | `.editorconfig` exists | file check |
| **License** | `LICENSE` file exists | file check |
| **Build** | `build` script in `package.json` | JSON field check |
| **GitIgnore** | `.gitignore` exists | file check |

### Output

Print a matrix table showing pass/fail for each template × check item. Flag any failures clearly so the user can decide whether to fix them.

If the user asks to fix issues, apply the missing infrastructure using the conventions from existing templates that pass the check — copy patterns, not reinvent them.
