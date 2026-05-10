# Project Rules

## Creating a New Skill

When the user asks to create a new skill in this project, follow these steps in order:

### Step 1 — Create in global skills directory

Create the skill under `~/.claude/skills/<skill-name>/`, not under the project directory directly.

Structure:
```
~/.claude/skills/<skill-name>/
├── SKILL.md
└── references/        (if needed)
    └── *.md
```

### Step 2 — Copy to project skills directory

After creating in the global directory, copy the skill to the project's `skills/` directory:

```
/Users/hacxy/Projects/skills/skills/<skill-name>/
```

The two copies must be identical.

### Step 3 — Sync README files

Add an entry for the new skill to **both** README files in the project root:

**`/Users/hacxy/Projects/skills/README.md`** — English entry:
```markdown
### <skill-name>

<one-line English description from SKILL.md>

**Triggers:** "<trigger phrase 1>", "<trigger phrase 2>", ...

\`\`\`bash
npx skills add hacxy/skills --skill <skill-name>
\`\`\`
```

**`/Users/hacxy/Projects/skills/README.zh.md`** — Chinese entry:
```markdown
### <skill-name>

<one-line Chinese description>

**触发词：** "触发短语1"、"触发短语2"、...

\`\`\`bash
npx skills add hacxy/skills --skill <skill-name>
\`\`\`
```

Insert the new entry **before** the `## License` / `## 开源协议` section, in alphabetical order among existing skills.

## Updating an Existing Skill

When the user asks to update or modify any skill content (SKILL.md or any file under `references/`), after saving changes to the project directory, mirror the same changes to the global directory:

```bash
cp -r /Users/hacxy/Projects/skills/skills/<skill-name>/ /Users/hacxy/.claude/skills/<skill-name>/
```

This ensures the globally loaded skill stays in sync with the project source.
