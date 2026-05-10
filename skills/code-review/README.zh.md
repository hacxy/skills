# code-review

[English](./README.md)

在 sub-agent 中对代码进行质量评估并生成专业报告的 skill。

## 功能说明

在隔离的 sub-agent 中执行全面代码质量评估。针对指定文件或整个项目，从 6 个维度进行分析，输出结构化 Markdown 报告，并询问是否需要帮助修复发现的问题。

**触发词：** "评估代码质量"、"code review"、"审查代码"、"检查代码质量"、"分析代码"

## 安装

```bash
npx skills add hacxy/skills --skill code-review
```

## 评估维度

| 维度 | 说明 |
|------|------|
| 可读性 | 命名清晰度、函数长度、注释质量 |
| 健壮性 | 边界处理、错误处理、类型安全 |
| 可维护性 | 单一职责、DRY、耦合度、测试覆盖 |
| 性能 | 算法复杂度、内存泄漏、N+1 查询 |
| 安全性 | XSS/SQL注入/CSRF、敏感信息硬编码、权限缺失 |
| 风格一致性 | 格式化、命名规范 |

## 报告结构

每次评估输出：
- 总体评分表（每个维度 1–10 分）
- 按严重级别分组的问题清单：🔴 Critical / 🟡 Warning / 🔵 Info
- 值得保留的良好实践
- 优先优化路径

## 参考文档

- [`references/evaluation-criteria.md`](references/evaluation-criteria.md) — 各维度评分标准
- [`references/report-template.md`](references/report-template.md) — 报告输出模板
