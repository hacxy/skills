# Skills

[![skills.sh](https://skills.sh/b/hacxy/skills)](https://skills.sh/hacxy/skills)

[中文](./README.zh.md)

Agent Skill Collection. A collection of agent skills compatible with all platforms supported by [skills.sh](https://skills.sh/), including Claude Code, Cursor, Codex, GitHub Copilot, Windsurf, Gemini, Cline, and more.

## Skills

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

### fit-docs

Generate requirement documents (PRD), technical design documents (TDD), and architecture design documents that fully satisfy user needs. Thinks like a product manager — analyzes purpose, value, user experience, and product closure before writing. Actively clarifies ambiguities — never fills gaps with assumptions.

**Triggers:** "write a PRD", "generate requirements doc", "create technical design", "write architecture doc", "generate documentation", "write a spec"

```bash
npx skills add hacxy/skills --skill fit-docs
```

### scaffold-project

Quickly scaffold new projects from built-in templates. Offers three templates: fullstack (Elysia + React monorepo), frontend (React + Vite), and backend (Bun + Elysia). Automatically selects the right template, copies files, renames the project, installs dependencies, and initializes git. Detects the user's conversation language and uses it as the project's default language for code comments, error messages, and documentation.

**Triggers:** "create new project", "new project", "scaffold", "start a new app", "init project", "I want to build a XX system"

```bash
npx skills add hacxy/skills --skill scaffold-project
```

## License

[MIT](./LICENSE)
