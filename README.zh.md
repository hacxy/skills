# Skills

[![skills.sh](https://skills.sh/b/hacxy/skills)](https://skills.sh/hacxy/skills)

[English](./README.md)

Agent Skill 合集，包括 Claude Code、Cursor、Codex、GitHub Copilot、Windsurf、Gemini、Cline 等。

## Skills 列表

### ship

产品交付总监：调度 10 个专业角色 Agent（产品经理、技术架构师、UI 设计师、后端/前端工程师、QA、DevOps 等）完成从需求到上线的完整交付。以项目总监视角主动监控每个阶段，发现问题立即干预，确保产品逻辑闭环。内置阶段回滚、生产回滚和状态看板。

**触发词：** "ship"、"ship it"、"交付"、"发布产品"、"端到端开发"、"全流程"、"一键开发上线"、"发一个版本"

```bash
npx skills add hacxy/skills --skill ship
```

### deploy

通过 GitHub Actions + rsync over SSH 将项目部署到远程 VPS。首次部署引导用户填写服务器信息并持久化本地，后续部署自动读取，无敏感信息写入代码库。

**触发词：** "部署"、"上线"、"发布"、"deploy"、"go live"、"配置部署"、"生成 CI/CD"、"创建 GitHub Actions"

```bash
npx skills add hacxy/skills --skill deploy
```

### competitor-analysis

分析竞品的优劣势与差异化机会，识别直接竞争对手并绘制竞争格局全景图。

**触发词：** "竞品分析"、"竞争调研"、"竞争对手分析"、"差异化机会"、"分析竞争格局"

```bash
npx skills add hacxy/skills --skill competitor-analysis
```

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

### scaffold-project

基于内置模板快速创建新项目。提供三种模板：全栈（Elysia + React monorepo）、前端（React + Vite）、后端（Bun + Elysia）。自动选择合适模板、复制文件、修改项目名称、安装依赖并初始化 git。自动检测用户对话语言，将其作为项目默认语言（影响代码注释、错误信息和文档）。

**触发词：** "创建新项目"、"新建项目"、"初始化项目"、"scaffold"、"开一个新项目"、"我要做一个 XX 系统"

```bash
npx skills add hacxy/skills --skill scaffold-project
```

### dev

根据 TDD 技术设计文档按「数据库 → 后端 API → 前端」顺序结构化实现功能代码，每层完成后自检再进入下一层。是 `write-tdd` 和 `scaffold-project` 的下游、`code-review` 的上游。

**触发词：** "开始开发"、"开始实现"、"按 TDD 写代码"、"实现功能"、"开始写代码"、"帮我实现"

```bash
npx skills add hacxy/skills --skill dev
```

### write-tests

根据 TDD 技术设计文档在功能实现前生成测试用例代码，覆盖单元测试、API 接口测试和 E2E 测试三层，输出初始为红（全部失败）的测试骨架，为 dev 阶段提供明确实现目标。位于 `scaffold-project` 和 `dev` 之间。

**触发词：** "写测试用例"、"生成测试"、"根据 TDD 写测试"、"先写测试"、"测试驱动开发"、"TDD 红阶段"

```bash
npx skills add hacxy/skills --skill write-tests
```

### write-tdd

根据 PRD 生成技术设计文档（TDD），覆盖系统架构、数据库表结构、API 接口设计、模块划分和关键技术决策。是 `write-prd` 的下游、`scaffold-project` 和研发的上游。

**触发词：** "写技术设计"、"出 TDD"、"技术方案"、"接口设计"、"数据库设计"、"系统设计文档"、"技术架构设计"

```bash
npx skills add hacxy/skills --skill write-tdd
```

### test

分三个层次编写并运行测试（后端单元测试 → API 接口测试 → 前端 E2E 测试），输出测试报告。是 `code-review` 的下游、`deploy` 的上游。

**触发词：** "写测试"、"跑测试"、"单元测试"、"接口测试"、"E2E 测试"、"测试覆盖率"、"测试一下"、"帮我测试"

```bash
npx skills add hacxy/skills --skill test
```

### write-prd

根据需求描述生成结构化 PRD（产品需求文档）。自动识别当前是新产品立项还是已有代码库的功能迭代，输出覆盖问题背景、用户故事、功能范围、成功指标、MVP 规划和技术模块的完整 PRD 文档。

**触发词：** "写 PRD"、"出需求文档"、"帮我整理需求"、"产品需求"、"需求评审"、"功能规划"

```bash
npx skills add hacxy/skills --skill write-prd
```

## 开源协议

[MIT](./LICENSE)
