# Skills Repository

[中文](./README.zh.md)

A collection of AI agent skills.

## Skills

| Skill | Description |
|-------|-------------|
| [create-cli](skills/create-cli/) | CLI UX/spec: args, flags, help, output, errors, config, dry-run. |
| [grilling](skills/grilling/) | Grill the user relentlessly about a plan or design. Use when the user wants to stress-test a plan... |
| [research](skills/research/) | Investigate a question against high-trust primary sources and capture the findings as a Markdown file. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent. |
| [tdd](skills/tdd/) | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests. |

## Usage

```bash
# Install a skill
npx skills add hacxy/skills --skill <skill-name>

# List available skills
npx skills list

# Examples
npx skills add hacxy/skills --skill grilling
npx skills add hacxy/skills --skill tdd
npx skills add hacxy/skills --skill research
npx skills add hacxy/skills --skill create-cli
```

## License

MIT
