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

If the user specified files, directories, or a code snippet → **targeted review** (go to Step 2A).

If not specified → **project-wide review** (go to Step 2B):
- List all tracked files via `git ls-files`
- Exclude `node_modules/`, `dist/`, `build/`, `.git/`, `coverage/`, `*.lock`, `*.min.*`

---

### Step 2A — Targeted review (specific files)

Launch a **single** `Agent` tool call (general-purpose) with:

```
You are a senior software engineer. Perform a professional code quality evaluation.

Scope: <file list or code content>

Evaluate each dimension in references/evaluation-criteria.md and output the report strictly following references/report-template.md.
```

Skip to Step 4.

---

### Step 2B — Project-wide review (parallel strategy)

Group the file list by **top-level directory** (e.g., `src/`, `lib/`, `tests/`, root-level files as one group). Aim for 3–8 groups; merge small directories together if there are too many.

Launch **one Agent per group in a single message** (all calls sent simultaneously so they run in parallel). Each agent receives:

```
You are a senior software engineer. Perform a professional code quality evaluation.

Scope: <files in this group only>

Evaluate each dimension in references/evaluation-criteria.md. Output findings using the same structure as references/report-template.md — include dimension scores and all issues found. Do NOT summarize; include every finding.
```

### Step 3 — Merge parallel results

After all agents complete, aggregate their outputs into one unified report:

- **Scores:** average each dimension score across groups, weighted by file count
- **Issues:** combine all Critical / Warning / Info lists; remove exact duplicates
- **Highlights:** collect all highlights, keep the most representative ones
- **Action plan:** re-prioritize across all findings, pick the top 3–5

Produce the final merged report following `references/report-template.md`.

---

### Step 4 — Render report

Output the report to the user in Markdown format.

### Step 5 — Guide decision

After the report, ask the user:

> Above is the complete code quality report. Would you like me to help fix and improve the identified issues?
> You can specify which issues to prioritize, or just say "fix all".

### Step 6 — Fix issues (parallel strategy)

When the user confirms fixes, group the issues by file. Then apply the same parallel strategy used for review:

**If issues span only 1–2 files** → fix in a single Agent call.

**If issues span 3+ files** → group by top-level directory (matching the review grouping). Launch **one Agent per group in a single message** (all calls sent simultaneously). Each agent receives:

```
You are a senior software engineer. Fix the following code issues in-place by editing the files directly.

Issues to fix:
<issue list for this group, with file paths and descriptions>

Rules:
- Fix only the listed issues; do not refactor unrelated code
- Preserve existing code style and formatting
- If a fix requires changes in another file outside your scope, note it but do not modify that file
```

After all agents complete, summarize what was fixed across all groups and flag any cross-group dependencies that need a follow-up pass.

## References

- `references/evaluation-criteria.md` — Evaluation dimensions and scoring criteria
- `references/report-template.md` — Report output template
