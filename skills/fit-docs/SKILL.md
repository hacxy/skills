---
name: fit-docs
description: Generate requirement documents (PRD), technical design documents (TDD), and architecture design documents that fully satisfy user needs. Use when the user asks to "write a PRD", "generate requirements doc", "create technical design", "write architecture doc", "generate documentation", "write a spec", or describes a feature/system and wants documentation produced.
---

# Fit Docs

Generate documentation that precisely satisfies user needs — through active clarification, never guesswork.

## Triggers

- User asks to write/generate/create a PRD, requirements doc, technical doc, TDD, or architecture doc
- User describes a feature or system and wants documentation
- User says "write a spec", "document this", or similar

## Core Principle

**Never assume. Always ask.** When any detail is uncertain or ambiguous, ask the user before writing. The goal is a document that completely matches user intent — not a generic template filled with placeholders.

## Workflow

### Step 1 — Identify document type

Determine which document(s) to produce:
- **PRD** (Product Requirements Document) — feature overview, user stories, acceptance criteria, scope
- **TDD** (Technical Design Document) — system design, data flow, interface design, implementation plan
- **Architecture Doc** — system architecture, module breakdown, technology selection, deployment topology

If the user has not specified, ask which type(s) they need.

### Step 2 — Active clarification

Before writing, ask targeted questions to fill gaps. Use the language the user wrote in (Chinese → Chinese questions, English → English questions).

For **PRD**, clarify if unknown:
- Target users / personas
- Core problem being solved
- Key features and scope boundaries (what's in, what's out)
- Success metrics / acceptance criteria
- Dependencies, constraints, or timeline

For **TDD**, clarify if unknown:
- Tech stack and existing system context
- Core modules and their responsibilities
- Data models and storage requirements
- API/interface contracts (internal and external)
- Non-functional requirements (performance, security, scalability)

For **Architecture Doc**, clarify if unknown:
- System scale and expected load
- Deployment environment (cloud, on-prem, hybrid)
- Integration points with other systems
- Technology choices already decided vs. open for recommendation
- Team constraints (size, expertise)

**Do not write any document section until critical unknowns are resolved.**

### Step 3 — Confirm scope and outline

Present a brief outline to the user and ask for approval before writing the full document:

> Here's the outline I'll use for [document type]. Does this match what you need, or should I adjust anything?

Only proceed to Step 4 after the user confirms.

### Step 4 — Write the document

Write the full document following the corresponding template in `references/`.

Language rule: **match the language the user used when describing their requirements.**

### Step 5 — Save to file

Determine output path:
- If the user specified a path, use it
- Otherwise, use the default structure:
  - PRD → `docs/requirements/<feature-name>.md`
  - TDD → `docs/technical/<feature-name>-design.md`
  - Architecture → `docs/architecture/<system-name>.md`

Create the file and confirm the path to the user.

### Step 6 — Review and iterate

After saving, ask:

> The document has been saved to `<path>`. Does it fully meet your needs? Let me know if you'd like to revise any section or add more detail.

Apply any requested changes immediately.

## References

- `references/prd-template.md` — PRD structure and section guide
- `references/tdd-template.md` — TDD structure and section guide
- `references/arch-template.md` — Architecture doc structure and section guide
