# Writing Documentation

Guidelines for writing and maintaining documentation in this repository.

## Skill Documentation

Each skill should have:
- `SKILL.md` - Main skill file with YAML frontmatter
- `README.md` - Optional human-readable documentation

## Documentation Structure

```
skill-name/
├── SKILL.md        # Required - skill definition
├── README.md       # Optional - human docs
├── scripts/        # Optional - executable code
├── references/     # Optional - reference docs
└── assets/         # Optional - static files
```

## Frontmatter Format

```yaml
---
name: skill-name
description: What this skill does and when to use it
---
```

## Best Practices

1. Keep SKILL.md under 500 lines
2. Use progressive disclosure for large docs
3. Include examples for complex concepts
4. Link to reference files when needed