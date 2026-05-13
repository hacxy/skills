# code-review

[中文](./README.zh.md)

A skill for evaluating code quality in a sub-agent and generating a professional report.

## What it does

Runs a comprehensive code quality evaluation in an isolated sub-agent. In a git repository, defaults to reviewing only unstaged/staged changes (not the entire project) for faster, more focused feedback. Analyzes across 6 dimensions, outputs a structured Markdown report, and asks whether you'd like help fixing the issues found.

**Triggers:** "review code", "code review", "analyze code", "check code quality", "evaluate code"

## Install

```bash
npx skills add hacxy/skills --skill code-review
```

## Evaluation dimensions

| Dimension | Description |
|-----------|-------------|
| Readability | Naming clarity, function length, comments |
| Robustness | Boundary handling, error handling, type safety |
| Maintainability | SRP, DRY, coupling, test coverage |
| Performance | Algorithm complexity, memory leaks, N+1 queries |
| Security | XSS/SQLi/CSRF, hardcoded secrets, missing auth |
| Style Consistency | Formatting, naming conventions |

## Report structure

Each run produces:
- Overall score table (each dimension scored 1–10)
- Issue list grouped by severity: 🔴 Critical / 🟡 Warning / 🔵 Info
- Highlighted good practices
- Prioritized action plan

## References

- [`references/evaluation-criteria.md`](references/evaluation-criteria.md) — Scoring criteria for each dimension
- [`references/report-template.md`](references/report-template.md) — Report output template
