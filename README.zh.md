# 技能仓库

[English](./README.md)

AI 代理技能集合。

## 可用技能

| 技能 | 描述 |
|------|------|
| [create-cli](skills/create-cli/) | CLI 体验与规格：参数、标志、帮助信息、输出、错误处理、配置、dry-run。 |
| [grilling](skills/grilling/) | 对用户的计划或设计进行压力测试。当用户想要在开发前验证方案、或使用任何「拷问」相关表述时触发。 |
| [research](skills/research/) | 针对可信一手资料研究问题，并将结论记录为 Markdown 文件。当用户需要研究主题、收集文档/API 信息、或将资料查阅工作委托给后台代理时使用。 |
| [tdd](skills/tdd/) | 测试驱动开发。当用户想要以测试优先的方式开发功能或修复缺陷、提到"红-绿-重构"、或需要集成测试时使用。 |

## 使用

```bash
# 安装技能
npx skills add hacxy/skills --skill <skill-name>

# 列出可用技能
npx skills list

# 示例
npx skills add hacxy/skills --skill grilling
npx skills add hacxy/skills --skill tdd
npx skills add hacxy/skills --skill research
npx skills add hacxy/skills --skill create-cli
```

## 许可证

MIT
