# create-skill

[中文](./README.zh.md)

A skill for creating and updating agent skills following best practices.

## What it does

Guides the agent through creating effective skills — from writing a concise `SKILL.md` under 200 lines, to structuring `references/` for progressive disclosure, to writing descriptions that trigger reliably.

**Triggers:** "create a skill", "create new skill", "build a skill", "how to structure a skill", "improve existing skill", "update skill"

## Install

```bash
npx skills add hacxy/skills --skill create-skill
```

## Skill structure it produces

```
skill-name/
├── SKILL.md              # Required, <200 lines
└── references/           # Optional, loaded on demand
    └── *.md
```

## References

- [`references/skill-structure.md`](references/skill-structure.md) — SKILL.md format and frontmatter
- [`references/best-practices.md`](references/best-practices.md) — Comprehensive authoring guide
- [`references/examples.md`](references/examples.md) — Good and bad skill examples
- [`references/progressive-disclosure.md`](references/progressive-disclosure.md) — 200-line rule deep dive
