---
name: create-skill
description: Guide for creating and updating agent skills following best practices. Use when creating a new skill, improving an existing skill, or when the user asks how to build/structure a skill.
---

# Create Skill

Create effective agent skills with specialized knowledge, workflows, and tool integrations.

## What a Skill Is

A modular, self-contained package that extends agent capabilities — think of it as an "onboarding guide" for a specific domain or task. Skills provide:

1. Specialized workflows — multi-step procedures for specific domains
2. Tool integrations — instructions for working with APIs or file formats
3. Domain expertise — schemas, business logic, naming conventions
4. Bundled resources — scripts, references, assets

## Skill Structure

```
skill-name/
├── SKILL.md              (required, <200 lines)
│   ├── YAML frontmatter  (name + description)
│   └── Markdown body
└── references/           (optional, loaded on demand)
    └── *.md
```

## The 200-Line Rule

SKILL.md must stay under 200 lines. Split anything beyond that into `references/` files.

Three loading levels:
1. **Metadata** (name + description) — always in context
2. **SKILL.md body** — loaded when skill triggers
3. **references/** — loaded only when needed

## Writing SKILL.md

- Lead with a one-line purpose statement
- State triggers: when should this skill activate?
- Use imperative/verb-first instructions
- Reference bundled files rather than inlining long content

## Description Field

The `description` determines when the skill activates. Be specific:

```yaml
# Good — specific, includes triggers
description: Extract text and tables from PDF files. Use when working with PDFs, forms, or document extraction.

# Bad — too vague
description: Helps with documents
```

## Core Principles

- **Concise**: Every token costs. Challenge each sentence — does the agent need this?
- **Appropriate freedom**: High for open-ended tasks, low for fragile/sequential operations
- **One level deep**: References link from SKILL.md only — avoid chained references
- **No time-sensitive content**: Use "old patterns" sections for deprecated info
- **Test across models**: Skill effectiveness depends on the underlying model

## Adding a README

When creating a skill for a shared repository, also create:
- `README.md` — English, links to `README.zh.md`
- `README.zh.md` — Chinese, links to `README.md`

Include: what the skill does, triggers, and install command:
```bash
npx skills add <owner/repo> --skill <skill-name>
```

## References

- `references/skill-structure.md` — SKILL.md format and frontmatter details
- `references/best-practices.md` — Comprehensive authoring guide
- `references/examples.md` — Good and bad skill examples
- `references/progressive-disclosure.md` — 200-line rule deep dive
