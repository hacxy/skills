---
name: git-commit
description: "Scan changes, draft conventional commit message, commit and push. Use when the user wants to commit staged or unstaged changes, or mentions git commit, push, or submit."
---

# Git Commit

A workflow skill that scans the working tree, drafts a commit message following Conventional Commits, and optionally pushes to the remote. Every step requires user confirmation — never commit or push silently.

## Step 1: Check Git Repository

Run `git rev-parse --is-inside-work-tree` to verify the current directory is a Git repository.

- **Not a repo** → ask the user: "The current directory is not a Git repository. Would you like to run `git init` to initialize one?" Wait for confirmation before proceeding.
- **Is a repo** → continue.

## Step 2: Scan Changes

Run the following commands to build a complete picture of the working tree:

| Command | Purpose |
|---------|---------|
| `git status` | File states — new, modified, deleted, untracked |
| `git diff` | Detailed changes of tracked (unstaged) files |
| `git diff --cached` | Staged changes (if any) |

For untracked new files, use `read` to quickly scan their contents and understand their purpose.

## Step 3: Draft Commit Message

Based on the scan results, draft a message following [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[body]
```

### Type Reference

| Type | When to use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Code restructuring (not feat or fix) |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build, tooling, dependencies |
| `ci` | CI/CD related changes |

### Requirements

- Write the subject in **English**, concise and descriptive (imperative mood, e.g. "add" not "added")
- If multiple files belong to the same logical change, combine into one commit
- `scope` is optional — use it to indicate the affected module or area
- For complex changes, add key details in the `body`

### Present to User

Show the user:

1. **Change summary** — which files changed and how
2. **Drafted commit message**
3. Ask: "Would you like to commit with this message? Let me know if you'd like to make any changes."

Wait for confirmation. If the user wants changes, revise and re-present.

## Step 4: Execute Commit

After the user confirms:

1. If there are unstaged changes, run `git add .` (or specific files as the user directs)
2. Run `git commit` with the confirmed message

## Step 5: Ask About Push

After a successful commit, ask: "Commit complete. Would you like to run `git push` to push to the remote?"

- **Yes** → run `git push` and show the result
- **No** → end the workflow
