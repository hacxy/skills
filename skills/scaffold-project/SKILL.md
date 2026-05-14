---
name: scaffold-project
description: |
  Quickly scaffold new projects from built-in templates. Offers three templates: fullstack, frontend, and backend.
  Automatically determines the right template based on user needs, copies files, renames the project, installs dependencies, initializes git, then switches to the new project directory to start development.
  Use this skill when the user says "create new project", "new project", "init project", "scaffold", "start a new app",
  "create project", "I want to build a XX system", "help me set up a XX", "start a new XX project",
  "创建新项目", "新建项目", "初始化项目", "开一个新项目", "我要做一个 XX 系统", "帮我搭一个 XX".
  Even if the user doesn't explicitly say "template" or "scaffold", use this skill whenever the intent is to start a new web/api/fullstack project from scratch.
---

# Scaffold Project

A scaffolding tool that quickly creates new projects from built-in templates. The entire process runs automatically — no user confirmation needed at any step.

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

## Templates

Three templates are built into the `templates/` directory, each a standalone, ready-to-use project structure:

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

## Template Selection Decision Tree

Analyze the user's requirement description and decide using these priorities:

1. **User explicitly specified a template type?** → Use that template directly
2. **User explicitly says "backend API already exists", "only need pages/frontend"?** → **Frontend**
3. **User only mentions API/endpoints/server-side/data processing, with zero mention of any interface/pages/display?** → **Backend**
4. **User describes a complete product (e.g., "blog system", "admin dashboard", "e-commerce platform")?** → **Fullstack** (complete products typically need front-and-back coordination)
5. **Can't determine?** → Default to **Fullstack** (broadest coverage — user can trim what they don't need)

Key principle: Most users describe product requirements, not technical requirements. When a user says "build a XX system", analyze what the system fundamentally needs:
- Needs a user-facing interface + needs to store/process data → Fullstack
- Only needs to display pages, data comes from external sources → Frontend
- Only needs to provide APIs, no user interface involved → Backend

## Workflow

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

### Step 2: Autonomous Decisions

Make the following decisions directly from the user's requirement description, without asking:
- **Template type**: Use the decision tree above
- **Project name**: Extract keywords from the description and convert to kebab-case (e.g., "task management system" → `task-manager`, "做个天气应用" → `weather-app`)
- **Feature plan**: If the user only described a high-level direction (e.g., "build a blog"), autonomously design the data models, API endpoints, page structure, etc., then start implementing immediately

### Step 3: Run Scaffold

Run the scaffold script, which automatically handles template copying, name replacement, git init, dependency installation, and initial commit:
```bash
bun run /Users/hacxy/.claude/skills/scaffold-project/scripts/scaffold.ts \
  --template <fullstack|frontend|backend> \
  --name <project-name> \
  --target <target-directory>
```

### Step 4: Start Development

After the project is created:
- Use `cd` to switch to the new project directory
- Briefly inform the user of the created project structure and your feature plan
- Immediately start implementing features according to the plan, without waiting for user confirmation
