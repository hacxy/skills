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

## Core Principles

1. **Never assume. Always ask.** When any detail is uncertain or ambiguous, ask the user before writing. The goal is a document that completely matches user intent — not a generic template filled with placeholders.

2. **Think like a product manager.** Don't just record what the user says — dig into *why* this requirement exists, what value it creates, and whether the product experience is coherent end-to-end. A great document reveals insights the user hadn't explicitly articulated.

## Workflow

### Step 1 — Identify document type

Determine which document(s) to produce:
- **PRD** (Product Requirements Document) — feature overview, user stories, acceptance criteria, scope
- **TDD** (Technical Design Document) — system design, data flow, interface design, implementation plan
- **Architecture Doc** — system architecture, module breakdown, technology selection, deployment topology

If the user has not specified, ask which type(s) they need.

### Step 2 — Product-minded requirement analysis

Before jumping into clarification questions, first analyze the requirement from a product manager's perspective. Think through these dimensions and share your analysis with the user:

**Purpose & motivation** — Why does this requirement exist? What user pain or business opportunity is it addressing? If the user only described *what* to build, probe for the *why*. The purpose shapes every downstream decision.

**Value assessment** — What concrete value does this deliver? Consider:
- User value: does it save time, reduce friction, enable something previously impossible?
- Business value: does it drive growth, retention, revenue, or operational efficiency?
- If the value proposition is weak or unclear, flag it honestly — "this feature might not be worth the investment because..." is more helpful than silent compliance.

**User experience lens** — Walk through the experience from the user's perspective:
- What is the user doing *before* they encounter this feature? What triggers them to use it?
- What does the ideal interaction feel like? Where could frustration or confusion arise?
- What happens *after* the user completes the task — is the outcome satisfying and clear?
- Are there moments of delight that could be designed in, or moments of friction that must be eliminated?

**Product closure check** — Verify the product loop is complete:
- Does every user journey have a clear entry point, a smooth flow, and a satisfying conclusion?
- Are there dead ends where the user is left hanging (e.g., an error with no recovery path, a success with no next step)?
- Does the feature connect back to the broader product (e.g., notifications lead to actions, actions produce visible results)?
- Is there a feedback mechanism so the user knows their action succeeded?

Share this analysis with the user as a brief summary before moving to Step 3. This surfaces misalignments early and often reveals requirements the user hadn't considered.

### Step 3 — Active clarification

Based on your analysis, ask targeted questions to fill remaining gaps. Use the language the user wrote in (Chinese → Chinese questions, English → English questions).

For **PRD**, clarify if unknown:
- Target users / personas
- Core problem being solved
- Key features and scope boundaries (what's in, what's out)
- Success metrics / acceptance criteria
- Dependencies, constraints, or timeline
- How this feature fits into the overall product vision

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

### Step 4 — Confirm scope and outline

Present a brief outline to the user and ask for approval before writing the full document:

> Here's the outline I'll use for [document type]. Does this match what you need, or should I adjust anything?

Only proceed to Step 5 after the user confirms.

### Step 5 — Write the document

Write the full document following the corresponding template in `references/`.

Language rule: **match the language the user used when describing their requirements.**

For PRDs, integrate the product analysis from Step 2 into the relevant sections — the value proposition should be woven throughout, not bolted on as an afterthought.

### Step 6 — Save to file

Determine output path:
- If the user specified a path, use it
- Otherwise, use the default structure:
  - PRD → `docs/requirements/<feature-name>.md`
  - TDD → `docs/technical/<feature-name>-design.md`
  - Architecture → `docs/architecture/<system-name>.md`

Create the file and confirm the path to the user.

### Step 7 — Review and iterate

After saving, ask:

> The document has been saved to `<path>`. Does it fully meet your needs? Let me know if you'd like to revise any section or add more detail.

Apply any requested changes immediately.

## References

- `references/prd-template.md` — PRD structure and section guide
- `references/tdd-template.md` — TDD structure and section guide
- `references/arch-template.md` — Architecture doc structure and section guide
