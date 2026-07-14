---
name: readme-sync
description: Initialize and update README.md for a skills repository. Use when the user wants to generate or sync README content based on the skills directory, keep README in sync with skill changes, or create documentation for a skill library.
---

# Readme Sync

A skill for initializing and keeping README.md in sync with a skills repository.

## When to Use

- Initialize a new README.md for a skills repository
- Update README when skills are added, removed, or modified
- Generate consistent documentation across all skills
- Keep skill descriptions synchronized between SKILL.md and README.md

## Overview

This skill helps maintain a single source of truth for your skills documentation. It reads skill metadata from `skills/*/SKILL.md` and generates a consistent README.md that lists all available skills with their descriptions.

---

## Initialize README

When creating a README.md for the first time:

### Step 1: Scan Skills Directory

Read all `skills/*/SKILL.md` files and extract:
- Skill name (from frontmatter `name` field)
- Description (from frontmatter `description` field)
- Directory name (folder name)

### Step 2: Generate README Structure

Create a README.md with this structure:

```markdown
# [Repository Name]

[Optional introduction paragraph]

## Skills

| Skill | Description |
|-------|-------------|
| [skill-name](skills/skill-name/) | Skill description from SKILL.md |

## Usage

[How to install/use skills]

## Contributing

[How to contribute]
```

### Step 3: Present to User

Show the generated README to the user for review before writing.

---

## Update README

When skills directory changes:

### Step 1: Detect Changes

Compare current skills directory with README content:
- New skills not in README
- Removed skills still in README
- Changed descriptions

### Step 2: Generate Updates

For each change type:

**New skills:**
- Add row to skills table
- Use description from SKILL.md frontmatter

**Removed skills:**
- Remove row from skills table

**Changed descriptions:**
- Update description in skills table
- Keep in sync with SKILL.md frontmatter

### Step 3: Apply Changes

Update README.md while preserving:
- Existing structure
- Custom sections
- User-added content

---

## Skill Table Format

Use this format for the skills table:

```markdown
| Skill | Description |
|-------|-------------|
| [grilling](skills/grilling/) | Grill the user relentlessly about a plan or design |
| [skill-forge](skills/skill-forge/) | Create new skills with eval-driven development |
| [tdd](skills/tdd/) | Test-driven development workflow |
```

**Rules:**
- One row per skill
- Link to skill directory
- Use description from SKILL.md frontmatter (first paragraph only)
- Keep descriptions concise (under 100 characters)

---

## Automation

### Git Hook Integration

For automatic updates, create a git hook:

```bash
#!/bin/bash
# .git/hooks/post-commit

# Check if skills directory changed
if git diff --name-only HEAD~1 HEAD | grep -q "^skills/"; then
  # Update README
  python -m scripts.update_readme
fi
```

### Manual Update

Run manually when needed:

```bash
# From project root
python -m scripts.update_readme --skills-dir skills/
```

---

## Scripts

The `scripts/` directory contains:

- `scan_skills.py` - Scan skills directory and extract metadata
- `generate_readme.py` - Generate README from skill metadata
- `update_readme.py` - Update existing README with changes
- `sync_descriptions.py` - Sync descriptions between SKILL.md and README.md

---

## Output Format

### README.md Structure

```markdown
# Skills Repository

A collection of AI agent skills.

## Available Skills

| Skill | Description |
|-------|-------------|
| [skill-name](skills/skill-name/) | Description from SKILL.md |

## Installation

```bash
npx skills add <owner>/<repo>
```

## Usage

Instructions for using skills.

## Contributing

Guidelines for contributing.

## License

[License information]
```

### README.zh.md Structure

Generate a Chinese version of README with the same structure:

```markdown
# 技能仓库

AI 代理技能集合。

## 可用技能

| 技能 | 描述 |
|------|------|
| [skill-name](skills/skill-name/) | 中文描述 |

## 安装

```bash
npx skills add <owner>/<repo>
```

## 使用

使用说明。

## 贡献

贡献指南。

## 许可证

MIT
```

### Cross-Reference

Both README files should link to each other:
- README.md: `[中文](./README.zh.md)`
- README.zh.md: `[English](./README.md)`

### Metadata Format

Extract from SKILL.md frontmatter:

```yaml
---
name: skill-name
description: Short description for README
---
```

### Chinese Description Translation

When generating `README.zh.md`, translate the English `description` to Chinese. The translation should:

1. Preserve technical terms (e.g., "CLI", "API", "JSON" remain in English)
2. Be concise and natural in Chinese
3. Maintain the same meaning as the English description
4. Keep under 100 characters if possible

Example translations:
- "Grill the user relentlessly about a plan or design" → "对计划或设计进行深入质询和压力测试"
- "Test-driven development workflow" → "测试驱动开发工作流"
- "Create new skills with eval-driven development" → "通过评估驱动开发创建新技能"

---

## Edge Cases

### No Skills Found

If skills directory is empty or missing:
- Create README with placeholder
- Add note about adding skills

### Missing Frontmatter

If SKILL.md lacks frontmatter:
- Skip skill in README
- Log warning for user

### Long Descriptions

If description exceeds 100 characters:
- Truncate with "..."
- Link to full description in SKILL.md

---

## Best Practices

1. **Single Source of Truth**: SKILL.md is authoritative; README reflects it
2. **Concise Descriptions**: Keep README descriptions short
3. **Consistent Format**: Use the same table format across all entries
4. **Regular Updates**: Update README when skills change
5. **Review Before Write**: Always show changes to user first