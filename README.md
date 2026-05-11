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

Guide for creating and updating agent skills following best practices. Covers SKILL.md structure, the 200-line rule, progressive disclosure, and writing effective descriptions.

**Triggers:** "create a skill", "build a skill", "how to structure a skill", "improve existing skill"

```bash
npx skills add hacxy/skills --skill create-skill
```

### fit-docs

Generate requirement documents (PRD), technical design documents (TDD), and architecture design documents that fully satisfy user needs. Actively clarifies ambiguities before writing — never fills gaps with assumptions.

**Triggers:** "write a PRD", "generate requirements doc", "create technical design", "write architecture doc", "generate documentation", "write a spec"

```bash
npx skills add hacxy/skills --skill fit-docs
```

## License

[MIT](./LICENSE)
