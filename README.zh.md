# 技能仓库

[English](./README.md)

AI 代理技能集合。

## 可用技能

| 技能 | 描述 |
| ------ | ------ |
| [create-cli](skills/create-cli/) | CLI 体验与规格：参数、标志、帮助信息、输出、错误处理、配置、dry-run。 |
| [frontend-design](skills/frontend-design/) | 前端视觉设计指导：为新 UI 或现有界面提供独特的设计方向，涵盖美学风格、排版和非模板化的设计决策。 |
| [kick-list](skills/kick-list/) | 列出所有可用的项目模板，用于快速搭建新应用。 |
| [kick-new](skills/kick-new/) | 从模板创建新项目，适用于启动、搭建或初始化新应用。 |
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
npx skills add hacxy/skills --skill frontend-design
npx skills add hacxy/skills --skill kick-list
npx skills add hacxy/skills --skill kick-new
```

## Pi 包使用

此仓库也是一个 pi 包，可以作为 pi 扩展安装：

```bash
# 从本地路径安装
pi install /path/to/skills

# 从 npm 安装（发布后）
pi install npm:@hacxy/skills

# 从 git 安装
pi install git:github.com/hacxy/skills
```

安装后，所有技能将在你的 pi 环境中可用。

## 许可证

MIT
