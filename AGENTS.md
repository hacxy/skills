# Skills Repository

This repo holds OpenCode skills. All skills live under `skills/`.

## Structure

```
skills/
  <skill-name>/
    SKILL.md          # required — skill definition and instructions
    (other files)     # optional — scripts, templates, configs referenced by SKILL.md
```

- One directory per skill under `skills/`.
- `SKILL.md` is the entry point. OpenCode loads it when the skill is triggered.
- Keep skill names lowercase, hyphen-separated (e.g. `commit`, `lark-doc`, `ship`).
- Do not put skills outside `skills/`.

## Creating a new skill

1. Create `skills/<name>/SKILL.md`.
2. Start with a short description paragraph — this is what the trigger matcher uses.
3. Add workflow steps, tool references, and constraints below the description.
4. If the skill needs helper scripts or templates, place them in the same directory.

## Conventions

- No build step, no package manager, no tests — skills are plain Markdown (plus optional scripts).
- No root-level code files. Everything skill-related goes in `skills/<name>/`.
- `LICENSE` (MIT) applies to the whole repo.
- Commit messages follow Conventional Commits (e.g. `feat:`, `fix:`, `chore:`).
