# scriptify

[English](./README.md)

评估 skill 的可脚本化程度，并将所有可脚本化的部分转为可执行脚本。同时支持审计已脚本化的 skill——检查脚本质量、发现覆盖缺口并修复问题。核心原则：能用脚本解决的就不用 LLM。

## 功能说明

**脚本化模式** — 分析目标 skill 的 SKILL.md 中的每一步，分类为可脚本化/部分可脚本化/仅 LLM 处理，输出评估报告和可脚本化比例，然后为所有可脚本化部分生成脚本，并更新 SKILL.md 引用这些脚本。

**审计模式** — 对已有脚本的 skill，审查现有脚本的错误处理、输出格式、幂等性、安全性、参数化和可移植性。查找新增步骤可脚本化的覆盖缺口。输出按严重程度分级的报告（严重/警告/建议），经用户确认后自动修复。

根据目标 skill 是否已有 `scripts/` 目录自动选择模式。

脚本语言优先级：shell > js > python（Windows 系统：PowerShell > js > python）。

**触发词：** "脚本化"、"scriptify"、"这个能脚本化吗"、"提取脚本"、"自动化这个 skill"、"评估可脚本化程度"、"审计脚本"、"检查脚本化"、"审查脚本"

## 安装

```bash
npx skills add hacxy/private-skills --skill scriptify
```
