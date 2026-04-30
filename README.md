# skills

My personal skill collection for AI coding assistants — opinionated, maintained for my own workflow, and open for anyone to use.

Skills are stored in this repo and synced to a central registry at [hacxy/skills](https://github.com/hacxy/skills). They can be installed into Claude Code, Cursor, or Codex via the CLI.

[中文](./README.zh.md)

## Usage

No installation required — run directly with npx:

```bash
npx @hacxy/skills install commit
```

Or install globally for repeated use:

```bash
npm install -g @hacxy/skills
skills install commit
```

## CLI Commands

### Browse

```bash
# list all skills
npx @hacxy/skills list

# search by keyword
npx @hacxy/skills search commit

# view a skill's content
npx @hacxy/skills show commit
```

### Install

```bash
# install to Claude Code (default)
npx @hacxy/skills install commit

# install to Cursor, Codex or Trae
npx @hacxy/skills install commit --platform cursor
npx @hacxy/skills install commit --platform codex
npx @hacxy/skills install commit --platform trae

# install to a custom directory
npx @hacxy/skills install commit --dir ./path/to/dir

# install to the current directory
npx @hacxy/skills install commit --dir .

# install multiple skills at once
npx @hacxy/skills install commit review find-docs

# install all skills from the registry
npx @hacxy/skills install

# install to all platforms at once
npx @hacxy/skills install --all-platforms

# preview install paths without writing
npx @hacxy/skills install commit --dry-run
```

Supported platforms: `claude-code`, `cursor`, `codex`, `trae`

### Check install paths

```bash
npx @hacxy/skills where claude-code
npx @hacxy/skills where cursor
npx @hacxy/skills where codex
```

## Owner Commands

These commands require owner authentication and are only useful if you've forked this repo to manage your own registry.

```bash
# check auth status
skills auth status

# upload a skill to the registry
skills upload --source ./my-skill
skills upload --source ./my-skill --force        # overwrite if exists
skills upload --source ./my-skill --dry-run      # preview only
```

Upload writes the skill to the local `skills/` directory and pushes it to GitHub via the Contents API — immediately visible to all users.

Required environment variable for upload:

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` / `GH_TOKEN` | GitHub token with repo write access (`contents: write`) |

## Development

```bash
npm install
npm run build
npm run dev:web    # start web app
npm run dev:cli    # run CLI in dev mode
```

## License

[MIT](LICENSE)

---

> 中文文档请见 [README.zh.md](./README.zh.md)
