# Skills

[![skills.sh](https://skills.sh/b/hacxy/skills)](https://skills.sh/hacxy/skills)

[English](./README.md)

Agent Skill 合集，包括 Claude Code、Cursor、Codex、GitHub Copilot、Windsurf、Gemini、Cline 等。

## Skills 列表

### code-review

在 sub-agent 中对指定代码或整个项目进行专业代码质量评估，输出结构化评估报告，并提供优化建议。

**触发词：** "评估代码质量"、"code review"、"审查代码"、"检查代码质量"、"分析代码"

```bash
npx skills add hacxy/skills --skill code-review
```

### create-skill

创建新 skill、修改和优化现有 skill，并通过盲测 A/B 对比和定量基准测试进行迭代评估，衡量 skill 性能。

**触发词：** "创建 skill"、"新建 skill"、"如何构建 skill"、"优化现有 skill"、"优化 skill 描述"、"运行 skill 评估"、"skill 性能基准测试"

```bash
npx skills add hacxy/skills --skill create-skill
```

### find-docs

使用 Context7 CLI 获取任意开发技术的最新文档、API 参考和代码示例，覆盖库、框架、SDK、CLI 工具和云服务。

**触发词：** "查一下文档"、"XX 怎么用"、"最新 API 语法"、"看看文档"、"找文档"

```bash
npx skills add hacxy/skills --skill find-docs
```

### fit-docs

生成完全满足用户需求的需求文档（PRD）、技术设计文档（TDD）和架构设计文档。以产品经理视角分析需求——深入挖掘目的、价值、用户体验和产品闭环。在动笔前主动澄清所有模糊点，从不用通用假设填补信息空白。

**触发词：** "写 PRD"、"生成需求文档"、"写技术设计文档"、"写架构设计文档"、"帮我写文档"、"写功能规格说明"

```bash
npx skills add hacxy/skills --skill fit-docs
```

### scaffold-project

基于内置模板快速创建新项目。提供三种模板：全栈（Elysia + React monorepo）、前端（React + Vite）、后端（Bun + Elysia）。自动选择合适模板、复制文件、修改项目名称、安装依赖并初始化 git。自动检测用户对话语言，将其作为项目默认语言（影响代码注释、错误信息和文档）。

**触发词：** "创建新项目"、"新建项目"、"初始化项目"、"scaffold"、"开一个新项目"、"我要做一个 XX 系统"

```bash
npx skills add hacxy/skills --skill scaffold-project
```

## 开源协议

[MIT](./LICENSE)
