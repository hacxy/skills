---
name: scriptify
description: "Evaluate a skill for scriptability and convert scriptable parts into executable scripts. Also audit already-scriptified skills — check script quality, find coverage gaps, and fix issues. Use this skill when the user says 'scriptify', 'script this skill', 'can this be scripted', 'extract scripts from skill', 'automate this skill', 'make this a script', 'which parts can be scripted', 'evaluate scriptability', 'audit scripts', 'check scriptification', 'review scripts', 'are my scripts good', or asks whether a skill's steps could be replaced by scripts. Also use when the user wants to optimize a skill by moving deterministic logic out of the LLM and into scripts, or wants to verify that an already-scriptified skill's scripts are rigorous and well-structured. Core principle: if a script can do it, the LLM shouldn't."
---

# Scriptify

Evaluate a skill's steps for scriptability, then extract all scriptable parts into executable scripts. For skills that have already been scriptified, audit existing scripts for quality and coverage gaps.

**Core principle:** If a script can solve it, don't use a skill for it. The LLM should only handle tasks that require judgment, creativity, or error recovery.

## Mode Detection

Before starting, check whether the target skill already has a `scripts/` directory with executable scripts:

- **Has scripts → Audit Mode** (Phase A): review existing scripts for rigor, then check for new scriptification opportunities
- **No scripts → Scriptify Mode** (Phase 1–4): the original assess-and-convert workflow

The user can also explicitly request audit mode ("audit scripts", "check scriptification", "review my scripts").

## Report Language

All reports and user-facing output should match the user's language. Detect the language from the user's message — if they write in Chinese, output the report in Chinese; if in English, output in English; and so on for other languages. The report templates below are shown in English as examples, but translate all headings, labels, severity names, and summary text to match the user's language when presenting.

## Script Language Priority

Detect the user's OS and choose the script language accordingly:

| OS | Priority |
|----|----------|
| macOS / Linux | shell > js > python |
| Windows | PowerShell > js > python |

Check OS:
```bash
uname -s 2>/dev/null || echo "Windows"
```

Use shell (bash) by default. Only fall back to js/python when:
- The logic requires complex data structures that shell handles poorly (deep JSON manipulation, HTTP APIs with complex auth flows)
- A specific runtime is already a project dependency

## Workflow

### Phase 1: Assess

Read the target skill's `SKILL.md` and analyze every step/section. For each step, classify it:

| Category | Scriptable? | Examples |
|----------|-------------|---------|
| **Deterministic logic** | Yes | File detection, string transforms, template generation, CLI commands, config file creation |
| **Conditional branching on fixed rules** | Yes | "if lockfile exists → use pnpm", "if port taken → next port" |
| **Calling external APIs with fixed params** | Yes | `gh secret set`, `ssh server "command"`, `curl` |
| **Template filling** | Yes | nginx configs, systemd units, CI/CD workflows with variable substitution |
| **Reading/parsing structured data** | Yes | package.json fields, lockfile detection, grep for patterns |
| **Understanding arbitrary code** | No | "Read the project and determine the architecture" |
| **Diagnosing failures** | No | "Check logs and fix the issue" |
| **Making judgment calls** | No | "Determine if the output is correct", "Choose the best approach" |
| **Adapting to unexpected situations** | No | Non-standard project structures, edge cases not covered by rules |
| **Interactive clarification** | No | "Ask the user what they want" (unless defaults can replace it) |

### Phase 1 Output: Assessment Report

Present a table to the user:

```
## Scriptability Assessment: {skill-name}

| Step | Description | Scriptable | Reason | Script Language |
|------|-------------|------------|--------|-----------------|
| 1    | ...         | Yes        | ...    | shell           |
| 2    | ...         | Partial    | ...    | shell           |
| 3    | ...         | No         | ...    | —               |

**Summary:** X of Y steps fully scriptable, Z partially scriptable.
**Estimated scriptability: N%**
```

For "Partial" steps, explain exactly which sub-steps are scriptable and which require LLM judgment.

Wait for user confirmation before proceeding to Phase 2. If the user disagrees with any classification, adjust.

### Phase 2: Script

For each scriptable step, create a script in the skill's `scripts/` directory.

#### Script Design Rules

1. **One script per logical step** — don't cram everything into one mega-script, but don't create a script for every single command either. Group by deployment stage or logical unit.

2. **JSON output to stdout, logs to stderr** — all scripts output structured JSON results to stdout so the LLM (or other scripts) can parse them. Human-readable logs go to stderr with a prefix:
   ```bash
   log() { echo "[$SCRIPT_NAME] $*" >&2; }
   ```

3. **Accept parameters, don't hardcode** — values that vary between invocations should be script parameters. Values that are truly constant for the user's setup can be hardcoded.

4. **Fail fast and loud** — use `set -euo pipefail` (shell) or equivalent. When something fails, exit with a non-zero code and a clear error message. The LLM will handle recovery.

5. **Idempotent** — running a script twice should not break anything. Check before creating, skip if already exists, etc.

#### Script Template (shell)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Parameters
PARAM1="${1:?Usage: script-name.sh <param1> [param2]}"
PARAM2="${2:-default}"

log() { echo "[script-name] $*" >&2; }

# ... logic ...

# Output
cat << EOF
{
  "status": "ok",
  "result": "value"
}
EOF
```

#### Script Template (js — Node.js/Bun)

```js
#!/usr/bin/env node
const args = process.argv.slice(2);
if (!args[0]) { console.error('Usage: script-name.js <param1>'); process.exit(1); }

const log = (msg) => process.stderr.write(`[script-name] ${msg}\n`);

// ... logic ...

console.log(JSON.stringify({ status: 'ok', result: 'value' }));
```

#### Script Template (python)

```python
#!/usr/bin/env python3
import sys, json

if len(sys.argv) < 2:
    print('Usage: script-name.py <param1>', file=sys.stderr)
    sys.exit(1)

def log(msg): print(f'[script-name] {msg}', file=sys.stderr)

# ... logic ...

print(json.dumps({'status': 'ok', 'result': 'value'}))
```

### Phase 3: Update SKILL.md

Rewrite the skill's `SKILL.md` to reference the new scripts:

1. **Replace scriptable steps** with a script invocation:
   ```markdown
   ### Step N: Do the thing
   ```bash
   bash "$SKILL_DIR/scripts/do-thing.sh" <params>
   ```
   ```

2. **Keep LLM-only steps** as natural language instructions, clearly marked:
   ```markdown
   ### Step N: Handle failures (LLM handles)
   This step requires judgment and cannot be scripted.
   ...
   ```

3. **Mark review points** where the LLM should check script output:
   ```markdown
   **LLM review required:** Check the output. If X, override Y.
   ```

4. Add a note at the top that most steps are automated via scripts.

### Phase 4: Verify

1. Make all scripts executable: `chmod +x scripts/*.sh`
2. Run each script with test inputs to verify correct output
3. Confirm the JSON output is valid
4. If the skill has a sync rule (e.g., CLAUDE.md says to sync to a global directory), execute the sync

---

## Audit Mode (Phase A): Review Already-Scriptified Skills

When a skill already has scripts, the goal shifts from "extract scripts" to "are these scripts solid?" This matters because a poorly written script is worse than no script — it silently produces wrong results, breaks on edge cases, or forces the LLM to work around it.

### Phase A1: Script Inventory

List all scripts in the skill's `scripts/` directory and map them to the SKILL.md steps that reference them. Flag:

- **Orphan scripts**: files in `scripts/` that SKILL.md never references
- **Broken references**: SKILL.md references scripts that don't exist or have wrong paths/filenames
- **Permission issues**: scripts missing the executable bit

### Phase A2: Per-Script Quality Audit

Read each script and evaluate it against these dimensions. Each finding gets a severity level:

| Severity | Meaning | Action |
|----------|---------|--------|
| **Critical** | Script will fail or produce wrong results in common cases | Must fix |
| **Warning** | Script works but has fragility or maintenance issues | Should fix |
| **Suggestion** | Could be better but works fine as-is | Optional |

#### Checklist

**1. Error Handling**
- Shell scripts use `set -euo pipefail` (Critical if missing — silent failures are the #1 source of bugs in scriptified skills)
- Required parameters are validated with clear usage messages, not just silently defaulting to empty
- External commands that can fail (curl, ssh, git) have error handling or at least meaningful error messages on failure
- Exit codes are non-zero on failure

**2. Output Contract**
- Structured results go to stdout as valid JSON (run the script mentally — does every code path produce valid JSON, or can a partial failure result in broken JSON?)
- Logs and progress messages go to stderr, not mixed into stdout
- The JSON structure is consistent across success and error paths (ideally always has a `status` field)

**3. Idempotency**
- Running the script twice with the same inputs produces the same result without side effects
- File creation uses checks ("if not exists") rather than blindly overwriting
- Appending operations don't duplicate content on re-run

**4. Parameterization**
- Values that change between invocations are parameters, not hardcoded (server IPs, project names, paths, ports, domains)
- Values that are truly constant (like a config file format or template structure) can stay hardcoded — don't over-parameterize
- Defaults make sense and are documented in the usage message

**5. Security**
- No secrets (tokens, passwords, API keys) hardcoded in scripts
- Variables used in commands are properly quoted to prevent word splitting and globbing (`"$VAR"` not `$VAR`)
- User-provided values used in commands are not vulnerable to injection (especially in `eval`, `ssh`, or template substitution)
- Temporary files use `mktemp`, not predictable paths in `/tmp`

**6. Portability**
- Shell scripts use `#!/usr/bin/env bash`, not `#!/bin/bash`
- No reliance on GNU-specific flags without checking (e.g., `sed -i` behaves differently on macOS vs Linux)
- Required external tools are checked before use or documented as prerequisites

**7. Script Organization**
- Each script handles one logical step — not too many responsibilities in a single file
- Scripts aren't overly granular either (a 5-line script that just wraps a single command is usually better inlined)
- Shared logic between scripts is either duplicated (if small) or extracted into a common helper

### Phase A3: Coverage Gap Analysis

Re-read the SKILL.md and look for steps still written as LLM natural-language instructions that could now be scripted. This happens when:

- The original scriptification was conservative and left borderline cases to the LLM
- The skill was updated after scriptification, adding new steps that weren't evaluated
- Advances in the task (new CLI tools, new APIs) make previously-unscriptable steps scriptable

Present any new scriptification opportunities using the same table format as Phase 1.

### Phase A4: Audit Report

Present a consolidated report:

```
## Script Audit: {skill-name}

### Inventory
- Scripts found: N
- SKILL.md references: M
- Orphan scripts: [list]
- Broken references: [list]

### Findings

| # | Script | Severity | Issue | Recommended Fix |
|---|--------|----------|-------|-----------------|
| 1 | deploy.sh | Critical | Missing `set -euo pipefail` | Add to line 2 |
| 2 | setup.sh | Warning | Server IP hardcoded | Move to parameter |
| 3 | build.sh | Suggestion | Could combine with test.sh | Optional merge |

### Coverage Gaps
| Step | Description | Scriptable? | Reason |
|------|-------------|-------------|--------|
| ...  | ...         | Yes         | ...    |

### Summary
- Critical: X | Warning: Y | Suggestion: Z
- Coverage: current N% → potential M% with gap fixes
```

Wait for user confirmation before applying fixes.

### Phase A5: Apply Fixes

After user approval:

1. Fix all Critical and Warning issues in the scripts
2. If the user approved coverage gap items, create new scripts for them and update SKILL.md
3. Re-verify: run `chmod +x scripts/*.sh` and do a quick sanity check on modified scripts
4. If sync rules exist (per CLAUDE.md), execute the sync

---

## Edge Cases

- **Skill is 100% scriptable:** Recommend replacing the skill entirely with a single orchestrator script. The skill becomes a thin wrapper that just calls the script, or gets removed in favor of a shell alias/function.
- **Skill is 0% scriptable:** Report this honestly. Some skills are pure LLM judgment (code review, architecture decisions). Don't force scripting where it doesn't belong.
- **Existing scripts in the skill:** Evaluate them too. Can they be improved? Are they doing things that could be simpler? But don't rewrite working scripts just for style.
