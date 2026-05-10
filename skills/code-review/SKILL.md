---
name: code-review
description: Evaluate code quality in a sub-agent for specified files or the entire project. Outputs a structured report with findings and optimization suggestions. Use when the user says "review code", "code review", "analyze code", "check code quality", or "evaluate code".
---

# Code Review Skill

Run a comprehensive code quality evaluation in an isolated sub-agent, generate a professional report, and guide the user on next steps.

## Triggers

- User explicitly asks to review, analyze, or evaluate code quality
- User wants to know what problems exist in their code
- User requests a code review or code check

## Workflow

### Step 1 — Determine scope

If the user specified files, directories, or a code snippet, proceed to Step 2.

If not specified, evaluate the entire project:
- List all tracked files via `git ls-files`
- Exclude `node_modules/`, `dist/`, `build/`, `.git/`, `coverage/`, `*.lock`, `*.min.*`

### Step 2 — Launch sub-agent

Use the `Agent` tool (general-purpose) with the following prompt:

```
You are a senior software engineer. Perform a professional code quality evaluation on the following code.

Scope: <file list or code content>

Evaluate each dimension defined in references/evaluation-criteria.md and output the report strictly following the format in references/report-template.md.
```

### Step 3 — Render report

Output the sub-agent's report directly to the user in Markdown format.

### Step 4 — Guide decision

After the report, ask the user:

> Above is the complete code quality report. Would you like me to help fix and improve the identified issues?
> You can specify which issues to prioritize, or just say "fix all".

Execute the corresponding fixes or refactoring based on the user's reply.

## References

- `references/evaluation-criteria.md` — Evaluation dimensions and scoring criteria
- `references/report-template.md` — Report output template
