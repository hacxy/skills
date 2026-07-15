---
name: readme-sync
description: Create or update bilingual README files (README.md and README.zh.md) with cross-language references. Use when adding/removing skills or updating repository documentation.
---

# README Sync

Maintains bilingual README files (English and Chinese) for the skills repository.

## When to Use

- After adding or removing a skill from `skills/`
- When updating repository documentation
- When README structure needs changes

## Workflow

1. Read current `skills/` directory to inventory all skills
2. Update both `README.md` and `README.zh.md` with:
   - Consistent skill tables (name, description, link)
   - Cross-language references at the top:
     - English: `[中文](./README.zh.md)`
     - Chinese: `[English](./README.md)`
3. Keep both files structurally identical (same sections, same order)

## File Structure

Both READMEs should follow this structure:

```markdown
# Title

[Other language link]

## Skills

| Skill | Description |
|-------|-------------|
| [name](skills/name/) | description |

## Usage

(install/list commands)

## License

MIT
```

## Rules

- Never remove skills from README without removing the skill directory
- Keep descriptions concise (one sentence)
- Link to skill directory: `[name](skills/name/)`
