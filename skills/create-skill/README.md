# create-skill

[中文](./README.zh.md)

A skill for creating new skills, modifying and improving existing skills, and measuring skill performance through iterative evaluation.

## What it does

Guides you through the full skill development lifecycle: capturing intent, writing a draft SKILL.md, running test cases with baselines, reviewing results in an interactive viewer, iterating on feedback, optimizing the description for better triggering accuracy, and packaging the final skill. Supports blind A/B comparison and quantitative benchmarking for rigorous evaluation.

**Triggers:** "create a skill", "build a skill", "how to structure a skill", "improve existing skill", "optimize skill description", "run skill evals", "benchmark skill performance"

## Install

```bash
npx skills add hacxy/skills --skill create-skill
```

## Skill structure

```
create-skill/
├── SKILL.md              # Main instructions
├── agents/               # Subagent prompts (grader, comparator, analyzer)
├── scripts/              # Eval runner, benchmark aggregator, description optimizer
├── eval-viewer/          # Interactive HTML review viewer
├── assets/               # Eval review HTML template
├── references/           # JSON schemas for evals, grading, benchmarks
└── LICENSE.txt
```

## References

- [`references/schemas.md`](references/schemas.md) — JSON structures for evals.json, grading.json, benchmark.json, etc.
- [`agents/grader.md`](agents/grader.md) — How to evaluate assertions against outputs
- [`agents/comparator.md`](agents/comparator.md) — Blind A/B comparison between two outputs
- [`agents/analyzer.md`](agents/analyzer.md) — Post-hoc analysis of comparison results
