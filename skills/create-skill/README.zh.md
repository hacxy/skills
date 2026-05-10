# create-skill

[English](./README.md)

用于按照最佳实践创建和更新 Agent Skill 的 skill。

## 功能说明

引导 Agent 创建高质量的 skill —— 包括编写不超过 200 行的精简 `SKILL.md`、用 `references/` 实现渐进式加载，以及编写能可靠触发的 description。

**触发词：** "创建 skill"、"新建 skill"、"如何构建 skill"、"优化现有 skill"、"更新 skill"

## 安装

```bash
npx skills add hacxy/skills --skill create-skill
```

## 生成的 Skill 结构

```
skill-name/
├── SKILL.md              # 必须，<200 行
└── references/           # 可选，按需加载
    └── *.md
```

## 参考文档

- [`references/skill-structure.md`](references/skill-structure.md) — SKILL.md 格式与 frontmatter 说明
- [`references/best-practices.md`](references/best-practices.md) — 完整编写指南
- [`references/examples.md`](references/examples.md) — 好与坏的 skill 示例
- [`references/progressive-disclosure.md`](references/progressive-disclosure.md) — 200 行规则详解
