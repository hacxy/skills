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

### competitor-analysis

Analyze competitors with strengths, weaknesses, and differentiation opportunities. Identifies direct competitors and maps the competitive landscape.

**Triggers:** "competitor analysis", "competitive research", "competitive brief", "differentiation opportunities", "analyze competitors"

```bash
npx skills add hacxy/skills --skill competitor-analysis
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

## License

[MIT](./LICENSE)
