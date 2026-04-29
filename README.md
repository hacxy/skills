# Skills Toolkit

A monorepo for managing, searching, previewing, and distributing local skills.

## Tech Stack (Latest Stable)

- Node.js 20+
- TypeScript
- Vite + React
- Commander CLI

## Workspace Structure

- `skills/`: all skill content (each skill has `SKILL.md`)
- `packages/core`: shared parser/search/doctor logic
- `packages/cli`: `skills` CLI
- `apps/web`: search and preview web app

## Development

```bash
npm install
npm run build
npm run dev:web
```

## CLI Usage

```bash
# list/search/show
node packages/cli/dist/index.js list --skills-dir .
node packages/cli/dist/index.js search commit --skills-dir .
node packages/cli/dist/index.js show find-docs --skills-dir .

# install to platforms
node packages/cli/dist/index.js install --platform cursor --skills-dir .
node packages/cli/dist/index.js install --all-platforms --skills-dir .
node packages/cli/dist/index.js where codex
```

## Owner-only Upload (2FA)

Upload is restricted to owner only with both checks:

1. GitHub login matches `SKILLS_OWNER_GITHUB`
2. local token hash file matches `SKILLS_OWNER_TOKEN`

```bash
# initialize token hash file
node packages/cli/dist/index.js auth init --token your-secret-token

# export upload token
export SKILLS_OWNER_TOKEN=your-secret-token
export SKILLS_OWNER_GITHUB=hacxy

# check auth status
node packages/cli/dist/index.js auth status

# upload skill
node packages/cli/dist/index.js upload --source ./path/to/skill --skills-dir . --on-conflict rename
```

## Web App Features

- Search and preview skill content
- Direct route support: `/skill/:name`
- Owner-only upload UI (hidden when 2FA fails)
- Conflict strategy on upload: `rename`, `overwrite`, `error`

## Publish Notes (CLI)

Before npm publish:

1. Update `packages/cli/package.json` (`name`, `version`, `description`)
2. Build once: `npm run build`
3. Publish from `packages/cli`: `npm publish --access public`

---

Chinese version: `README.zh.md`
