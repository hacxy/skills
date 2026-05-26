# Skills

[![skills.sh](https://skills.sh/b/hacxy/skills)](https://skills.sh/hacxy/skills)

[中文](./README.zh.md)

Agent Skill Collection. A collection of agent skills compatible with all platforms supported by [skills.sh](https://skills.sh/), including Claude Code, Cursor, Codex, GitHub Copilot, Windsurf, Gemini, Cline, and more.

## Skills

### ship

Product delivery director: orchestrates 10 specialized role-agents (Product Manager, Architect, UI Designer, Backend/Frontend Engineers, QA, DevOps, etc.) to ship high-quality products. Actively monitors each stage, intervenes when needed, and ensures end-to-end logical coherence. Includes stage rollback, production rollback, and status dashboard.

**Triggers:** "ship", "ship it", "交付", "端到端开发", "全流程", "一键开发上线", "发一个版本"

```bash
npx skills add hacxy/skills --skill ship
```

### deploy

Deploy projects to a remote VPS via GitHub Actions + rsync over SSH. Collects server info on first run and persists it locally — no sensitive data stored in the skill itself.

**Triggers:** "deploy", "publish", "go live", "push to production", "generate CI/CD", "create GitHub Actions", "部署", "上线", "发布"

```bash
npx skills add hacxy/skills --skill deploy
```

### competitor-analysis

Analyze competitors with strengths, weaknesses, and differentiation opportunities. Identifies direct competitors and maps the competitive landscape.

**Triggers:** "competitor analysis", "competitive research", "competitive brief", "differentiation opportunities", "analyze competitors"

```bash
npx skills add hacxy/skills --skill competitor-analysis
```

### code-review

Evaluate code quality in a sub-agent for specified files or the entire project. Outputs a structured report with findings and optimization suggestions.

**Triggers:** "review code", "code review", "analyze code", "check code quality", "evaluate code"

```bash
npx skills add hacxy/skills --skill code-review
```

### create-skill

Create new skills, modify and improve existing skills, and measure skill performance through iterative evaluation with blind A/B comparison and quantitative benchmarking.

**Triggers:** "create a skill", "build a skill", "how to structure a skill", "improve existing skill", "optimize skill description", "run skill evals", "benchmark skill performance"

```bash
npx skills add hacxy/skills --skill create-skill
```

### find-docs

Fetch up-to-date documentation, API references, and code examples for any development technology using the Context7 CLI. Covers libraries, frameworks, SDKs, CLI tools, and cloud services.

**Triggers:** "look up the docs for...", "how does X API work", "what's the latest syntax for...", "show me the docs", "find documentation"

```bash
npx skills add hacxy/skills --skill find-docs
```

### scaffold-project

Quickly scaffold new projects from built-in templates. Offers three templates: fullstack (Elysia + React monorepo), frontend (React + Vite), and backend (Bun + Elysia). Automatically selects the right template, copies files, renames the project, installs dependencies, and initializes git. Detects the user's conversation language and uses it as the project's default language for code comments, error messages, and documentation.

**Triggers:** "create new project", "new project", "scaffold", "start a new app", "init project", "I want to build a XX system"

```bash
npx skills add hacxy/skills --skill scaffold-project
```

### dev

Implement features based on a TDD document in a structured order: Database Schema → Backend API → Frontend. Self-checks each layer before moving to the next. Sits between `write-tdd` / `scaffold-project` and `code-review` in the development pipeline.

**Triggers:** "start dev", "start implementing", "implement features", "write code", "开始开发", "开始实现", "按 TDD 写代码"

```bash
npx skills add hacxy/skills --skill dev
```

### write-tests

Generate test case code from a TDD document before implementation. Creates unit, API, and E2E test skeletons (initially failing / red phase) that guide the dev stage to implement against. Sits between `scaffold-project` and `dev`.

**Triggers:** "write test cases", "generate tests", "tests from TDD", "test-driven", "写测试用例", "根据 TDD 写测试", "先写测试"

```bash
npx skills add hacxy/skills --skill write-tests
```

### write-tdd

Generate a Technical Design Document (TDD) from a PRD. Covers system architecture, database schema, API design, module structure, and key technical decisions. Sits between `write-prd` and `scaffold-project` in the development pipeline.

**Triggers:** "write TDD", "technical design", "API design", "database design", "system design", "technical architecture"

```bash
npx skills add hacxy/skills --skill write-tdd
```

### test

Write and run tests across three layers — backend unit tests, API integration tests, and frontend E2E tests — then output a test report. Sits between `code-review` and `deploy` in the development pipeline.

**Triggers:** "write tests", "run tests", "unit test", "API test", "E2E test", "test coverage", "测试一下", "写测试", "跑测试"

```bash
npx skills add hacxy/skills --skill test
```

### write-prd

Generate structured PRD (Product Requirements Document) from a requirement description. Automatically detects whether it's a new product or an existing codebase iteration, and outputs a complete PRD covering problem background, user stories, feature scope, success metrics, MVP planning, and technical modules.

**Triggers:** "write PRD", "create PRD", "product requirements", "organize requirements", "feature planning", "需求文档", "写 PRD", "出需求文档"

```bash
npx skills add hacxy/skills --skill write-prd
```

## License

[MIT](./LICENSE)
