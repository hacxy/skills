# Skills

> 中文友好的，且可复用的 AI agent 技能集合，提供专项能力。

## 技能列表

| 技能                                           | 描述                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`brainstorm`](skills/brainstorm/)             | 头脑风暴与决策辅助。基于真实调研、逐步引导，适用于技术选型、方案对比等需要深入思考的场景 |
| [`code-review`](skills/code-review/)           | 严谨的代码评审，聚焦意图、正确性与风险                                                   |
| [`create-agentsmd`](skills/create-agentsmd/)   | 为仓库生成 AGENTS.md 文件                                                                |
| [`create-cli`](skills/create-cli/)             | CLI 体验与规格设计：参数、帮助信息、错误处理、dry-run 等                                 |
| [`frontend-design`](skills/frontend-design/)   | 前端视觉设计指导：美学风格、排版、非模板化的设计决策                                     |
| [`git-commit`](skills/git-commit/)             | 扫描变更、拟定 conventional commit 信息、提交并推送                                      |
| [`grilling`](skills/grilling/)                 | 对计划或设计进行压力测试，开发前验证方案                                                 |
| [`researcher`](skills/researcher/)             | 针对可信一手资料研究问题，将结论记录为 Markdown                                          |
| [`tech-blog-writer`](skills/tech-blog-writer/) | 中文技术博客写作与更新，支持自动评审和迭代修改                                           |

## 安装

### skills.sh

```bash
npx skills add hacxy/skills
```

### pi 扩展

```bash
# 从 npm
pi install npm:@hacxy/skills

# 从 git
pi install git:github.com/hacxy/skills
```

安装后所有技能自动可用。触发匹配时 agent 会加载对应的 `SKILL.md`。

## 项目结构

```
skills/
  <skill-name>/
    SKILL.md          # 必需 — 技能定义与指令
    (其他文件)         # 可选 — 脚本、模板、配置
```

## 许可证

[MIT](LICENSE)
