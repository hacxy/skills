# Skills Repository

[中文](./README.zh.md)

A collection of AI agent skills.

## Skills

| Skill | Description |
|-------|-------------|
| [create-cli](skills/create-cli/) | CLI UX/spec: args, flags, help, output, errors, config, dry-run. |
| [grilling](skills/grilling/) | Grill the user relentlessly about a plan or design. Use when the user wants to stress-test a plan... |
| [skill-forge](skills/skill-forge/) | Create new skills, modify and improve existing skills, and measure skill performance. Use when us... |
| [tdd](skills/tdd/) | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentio... |

## Usage

```bash
# Install a skill
npx skills add <owner>/<repo> --skill <skill-name>

# List available skills
npx skills list
```

## Contributing

See [AGENTS.md](AGENTS.md) for guidelines on creating and contributing skills.

## License

MIT
