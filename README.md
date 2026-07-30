# Skills

[![npm version](https://img.shields.io/npm/v/@hacxy/skills)](https://www.npmjs.com/package/@hacxy/skills)
[![license](https://img.shields.io/npm/l/@hacxy/skills)](LICENSE)

> 中文友好的，可复用的 AI agent 技能集合。

## 快速开始

```bash
# 使用 npx skills 安装
npx skills add hacxy/skills

# 或从 npm 安装
pi install npm:@hacxy/skills

# 或从 git 安装
pi install git:github.com/hacxy/skills
```

安装后所有技能自动可用。触发匹配时 agent 会加载对应的 `SKILL.md`。

## 技能列表

| 技能                                           | 描述                                                |
| ---------------------------------------------- | --------------------------------------------------- |
| [`brainstorm`](skills/brainstorm/)             | 头脑风暴与决策辅助，基于真实调研逐步引导            |
| [`create-agentsmd`](skills/create-agentsmd/)   | 为仓库生成 AGENTS.md 文件                           |
| [`frontend-design`](skills/frontend-design/)   | 前端视觉设计指导：美学风格、排版、设计决策          |
| [`git-commit`](skills/git-commit/)             | 扫描变更、拟定 conventional commit 信息、提交并推送 |
| [`grilling`](skills/grilling/)                 | 对计划或设计进行压力测试，开发前验证方案            |
| [`readme-gen`](skills/readme-gen/)             | 生成和更新双语 README 文件，遵循快速开始优先结构    |
| [`tech-blog-writer`](skills/tech-blog-writer/) | 中文技术博客写作与更新，支持自动评审和迭代修改      |

## 项目结构

```
skills/
  <skill-name>/
    SKILL.md          # 必需 — 技能定义与指令
    (其他文件)         # 可选 — 脚本、模板、配置
```

- 一个 skill 一个目录
- `SKILL.md` 是入口，包含 YAML frontmatter（`name` + `description`）和正文
- skill 命名使用小写加连字符（如 `git-commit`、`lark-doc`）

## 许可证

[MIT](LICENSE)
