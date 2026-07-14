# 技能仓库

[English](./README.md)

AI 代理技能集合。

## 可用技能

| 技能 | 描述 |
|------|------|
| [create-cli](skills/create-cli/) | CLI 用户体验/规范：参数、标志、帮助、输出、错误、配置、试运行。 |
| [grilling](skills/grilling/) | 对计划或设计进行深入质询和压力测试。当用户想要在构建前对计划进行压力测试，或使用任何'质询'触发短语时使用。 |
| [skill-forge](skills/skill-forge/) | 创建新技能、修改和改进现有技能，并衡量技能性能。当用户想要从头创建技能、编辑或优化现有技能、运行评估测试技能、通过方差分析基准测试技能性能，或优化技能描述以提高触发准确性时使用。 |
| [tdd](skills/tdd/) | 测试驱动开发。当用户想要先测试再构建功能或修复错误、提到'红-绿-重构'，或需要集成测试时使用。 |

## 使用

```bash
# 安装技能
npx skills add <owner>/<repo> --skill <skill-name>

# 列出可用技能
npx skills list
```

## 贡献

请参阅 [AGENTS.md](AGENTS.md) 了解创建和贡献技能的指南。

## 许可证

MIT
