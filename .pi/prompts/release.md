---
description: Release npm package with version bump
argument-hint: "[patch|minor|major]"
---

Run the release script to publish a new version of @hacxy/skills:

```bash
./scripts/release.js ${1:-patch}
```

## What this does

1. Checks git status (ensures clean working directory)
2. Bumps version in package.json (${1:-patch})
3. Commits with message: `chore(release): vX.Y.Z`
4. Creates git tag: `vX.Y.Z`
5. Pushes commit and tag to remote
6. Publishes to npm (with confirmation)

## Options

- `patch` — bug fixes (0.1.0 → 0.1.1)
- `minor` — new features (0.1.0 → 0.2.0)
- `major` — breaking changes (0.1.0 → 1.0.0)
- Add `--yes` to skip all confirmations

## Examples

```
/release patch          # Patch version bump
/release minor          # Minor version bump
/release major --yes    # Major bump, skip confirmations
```
