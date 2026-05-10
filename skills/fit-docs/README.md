# fit-docs

A skill for generating requirement documents (PRD), technical design documents (TDD), and architecture design documents that **fully satisfy user needs**.

The key differentiator: this skill **actively clarifies ambiguities before writing**, never filling in gaps with generic assumptions. The result is documentation that precisely matches what you asked for.

→ [中文文档](README.zh.md)

## What it does

- Generates **PRD**, **TDD**, and **Architecture docs** in Markdown
- Asks targeted clarifying questions before writing any section
- Presents an outline for your approval before producing the full document
- Saves files to a sensible directory structure under `docs/`
- Matches the **language you use** (write in Chinese → gets Chinese docs)
- Iterates until you're satisfied

## Triggers

This skill activates when you say things like:
- "Write a PRD for..."
- "Generate a technical design document for..."
- "Create an architecture doc for..."
- "Document this feature..."
- "Write a spec for..."

## Install

```bash
npx skills add <owner/repo> --skill fit-docs
```

## Output structure

```
docs/
├── requirements/     # PRDs
├── technical/        # TDDs
└── architecture/     # Architecture docs
```
