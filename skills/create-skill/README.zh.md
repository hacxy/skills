# create-skill

[English](./README.md)

用于创建新 skill、修改和优化现有 skill，以及通过迭代评估衡量 skill 性能的工具。

## 功能说明

引导你完成 skill 开发的完整生命周期：捕获意图、编写 SKILL.md 草稿、运行带基线对比的测试用例、在交互式查看器中审阅结果、基于反馈迭代改进、优化 description 以提升触发准确率，以及打包最终 skill。支持盲测 A/B 对比和定量基准测试，实现严格评估。

**触发词：** "创建 skill"、"新建 skill"、"如何构建 skill"、"优化现有 skill"、"优化 skill 描述"、"运行 skill 评估"、"skill 性能基准测试"

## 安装

```bash
npx skills add hacxy/skills --skill create-skill
```

## Skill 结构

```
create-skill/
├── SKILL.md              # 主要指令
├── agents/               # 子代理提示词（评分器、比较器、分析器）
├── scripts/              # 评估运行器、基准聚合器、描述优化器
├── eval-viewer/          # 交互式 HTML 审阅查看器
├── assets/               # 评估审阅 HTML 模板
├── references/           # 评估、评分、基准的 JSON schema
└── LICENSE.txt
```

## 参考文档

- [`references/schemas.md`](references/schemas.md) — evals.json、grading.json、benchmark.json 等 JSON 结构
- [`agents/grader.md`](agents/grader.md) — 如何根据输出评估断言
- [`agents/comparator.md`](agents/comparator.md) — 两个输出之间的盲测 A/B 对比
- [`agents/analyzer.md`](agents/analyzer.md) — 对比结果的事后分析
