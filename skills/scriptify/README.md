# scriptify

[中文](./README.zh.md)

Evaluate a skill for scriptability and convert all scriptable parts into executable scripts. Also audit already-scriptified skills for quality and coverage gaps. Core principle: if a script can do it, the LLM shouldn't.

## What it does

**Scriptify Mode** — Analyzes each step of a skill's SKILL.md, classifies them as scriptable / partially scriptable / LLM-only, presents an assessment report with estimated scriptability percentage, then generates scripts for all scriptable parts and updates the SKILL.md to reference them.

**Audit Mode** — For skills that already have scripts, reviews existing scripts for error handling, output format, idempotency, security, parameterization, and portability. Finds coverage gaps where new steps could be scripted. Presents a severity-graded report (critical / warning / suggestion) and applies fixes after user approval.

Mode is auto-detected based on whether the target skill has a `scripts/` directory.

Script language priority: shell > js > python (Windows: PowerShell > js > python).

**Triggers:** "scriptify", "script this skill", "can this be scripted", "extract scripts", "automate this skill", "evaluate scriptability", "which parts can be scripted", "audit scripts", "check scriptification", "review scripts"

## Install

```bash
npx skills add hacxy/private-skills --skill scriptify
```
