# Skills Repository

[中文](./README.zh.md)

A collection of AI agent skills.

## Skills

| Skill | Description |
| ------- | ------------- |
| [create-cli](skills/create-cli/) | CLI UX/spec: args, flags, help, output, errors, config, dry-run. |
| [frontend-design](skills/frontend-design/) | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults. |
| [kick-list](skills/kick-list/) | List all available project templates for scaffolding new applications. |
| [kick-new](skills/kick-new/) | Create a new project when user wants to start, scaffold, or initialize a new application from a template. |
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
npx skills add hacxy/skills --skill frontend-design
npx skills add hacxy/skills --skill kick-list
npx skills add hacxy/skills --skill kick-new
```

## Pi Package Usage

This repository is also a pi package. You can install it as a pi extension:

```bash
# Install from local path
pi install /path/to/skills

# Install from npm (after publishing)
pi install npm:@hacxy/skills

# Install from git
pi install git:github.com/hacxy/skills
```

After installation, all skills will be available in your pi environment.

## License

MIT
