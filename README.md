# Skills Repository

[中文](./README.zh.md)

A collection of AI agent skills.

## Skills

| Skill | Description |
| ------- | ------------- |
| [`brainstorm`](skills/brainstorm/) | 头脑风暴与决策辅助。当用户纠结于某个问题、需要深入讨论、收集信息、分析利弊、做出决策时使用。基于真实调研、实事求是、提供依据、逐步引导。 |
| [`create-agentsmd`](skills/create-agentsmd/) | Prompt for generating an AGENTS.md file for a repository. |
| [`create-cli`](skills/create-cli/) | CLI UX/spec: args, flags, help, output, errors, config, dry-run. |
| [`frontend-design`](skills/frontend-design/) | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults. |
| [`git-commit`](skills/git-commit/) | Scan changes, draft conventional commit message, commit and push. Use when the user wants to commit staged or unstaged changes, or mentions git commit, push, or submit. |
| [`grilling`](skills/grilling/) | Grill the user relentlessly about a plan or design. Use when the user wants to stress-test a plan... |
| [`kick-list`](skills/kick-list/) | List all available project templates for scaffolding new applications. |
| [`kick-new`](skills/kick-new/) | Create a new project when user wants to start, scaffold, or initialize a new application from a template. |
| [`researcher`](skills/researcher/) | Investigate a question against high-trust primary sources and capture the findings as a Markdown file. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent. |
| [`tdd`](skills/tdd/) | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests. |
| [`tech-blog-writer`](skills/tech-blog-writer/) | 技术博客写作与更新。当用户需要撰写或更新中文技术博客文章、技术教程、开发笔记、源码分析、实践总结时使用。支持自动评审和迭代修改。 |

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
