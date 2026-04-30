# skills

My personal skill collection for AI coding assistants — opinionated, maintained for my own workflow, and open for anyone to use.

Skills are stored in this repo and synced to a central registry at [hacxy/skills](https://github.com/hacxy/skills). They can be installed into Claude Code, Cursor, or Codex via the CLI.

[中文](./README.zh.md)

## Installation

```bash
npm install -g @hacxy/skills
```

## CLI Usage

### Browse

```bash
# list all skills
skills list

# search by keyword
skills search commit

# view a skill's content
skills show commit
```

### Install

```bash
# install to Claude Code (default)
skills install commit

# install to Cursor or Codex
skills install commit --platform cursor
skills install commit --platform codex

# install multiple skills at once
skills install commit review find-docs

# install all skills from the registry
skills install

# install to all platforms at once
skills install --all-platforms

# preview install paths without writing
skills install commit --dry-run
```

Supported platforms: `claude-code`, `cursor`, `codex`

### Check install paths

```bash
skills where claude-code
skills where cursor
skills where codex
```

## Owner Commands

These commands require owner authentication and are only useful if you've forked this repo to manage your own registry.

```bash
# initialize owner token
skills auth init --token your-secret-token

# check auth status
skills auth status

# upload a skill to the registry
skills upload --source ./my-skill
skills upload --source ./my-skill --force        # overwrite if exists
skills upload --source ./my-skill --dry-run      # preview only
```

Upload writes the skill to the local `skills/` directory and pushes it to GitHub via the Contents API — immediately visible to all users.

Required environment variables for upload:

| Variable | Description |
|---|---|
| `SKILLS_OWNER_TOKEN` | Owner token for upload auth |
| `GITHUB_TOKEN` / `GH_TOKEN` | GitHub token with repo write access |

## Development

```bash
npm install
npm run build
npm run dev:web    # start web app
npm run dev:cli    # run CLI in dev mode
```

---

> 中文文档请见 [README.zh.md](./README.zh.md)
