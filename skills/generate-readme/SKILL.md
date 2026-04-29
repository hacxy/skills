---
name: generate-readme
description: 此 skill 应在用户说"生成 README"、"创建 README"、"写 README"、"generate readme"、"create readme"、"帮我写 README"、"为项目生成文档"时使用。同时生成英文 README.md 和中文 README.zh.md，两个文件相互引用，默认语言为英文。
argument-hint: "（可选）项目简介或额外说明"
---

# Generate README

生成双语 README 文件：英文 `README.md`（默认）和中文 `README.zh.md`，两个文件末尾互相引用对方。

## 准备阶段

读取以下信息来了解项目：

1. 读取 `package.json` / `pyproject.toml` / `Cargo.toml` / `go.mod` 等包配置文件，提取项目名称、版本、描述、脚本命令、依赖
2. 检查项目结构：`src/`、`apps/`、`packages/` 等目录布局
3. 读取 `.env.example`（若存在）了解环境变量
4. 若 `$ARGUMENTS` 非空，将其作为补充说明优先参考

**若 `README.md` 或 `README.zh.md` 已存在：**

读取现有文件，分析其结构和内容，然后执行**更新**而非重写：
- 保留已有的准确内容（项目描述、特性说明等）
- 用当前代码/配置中的实际信息修正过时内容（版本号、命令、环境变量等）
- 补充现有文件缺少但项目中实际存在的章节
- 删除现有文件中与当前项目不符的内容（已移除的功能、不存在的命令等）
- 保持原有的写作风格和章节顺序（除非明显不合理）

## README.md（英文，默认）

在项目根目录创建或更新 `README.md`，包含以下章节（按需取舍，缺少信息的章节可省略）：

```markdown
# Project Name

One-line description.

[中文](./README.zh.md)

## Features

- Feature 1
- Feature 2

## Prerequisites

- Node.js >= x.x / Bun >= x.x / Python >= x.x / etc.

## Installation

\`\`\`bash

# clone

git clone <repo-url>
cd <project>

# install dependencies

<install command>
\`\`\`

## Usage / Quick Start

\`\`\`bash
<run command>
\`\`\`

## Configuration

| Variable | Default | Description |
| -------- | ------- | ----------- |
| PORT     | 3000    | Server port |

## Project Structure

\`\`\`
<simplified directory tree>
\`\`\`

## Scripts

| Command | Description      |
| ------- | ---------------- |
| `dev`   | Start dev server |
| `build` | Build for prod   |
| `test`  | Run tests        |

## Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Commit changes: `git commit -m "feat: add feature"`
4. Push: `git push origin feat/your-feature`
5. Open a Pull Request

## License

[MIT](LICENSE)
```

末尾必须加上中文版引用：

```markdown
---

> 中文文档请见 [README.zh.md](./README.zh.md)
```

## README.zh.md（中文）

在项目根目录创建或更新 `README.zh.md`，内容与英文版对应，章节顺序和覆盖范围保持一致，但全部用中文撰写。

末尾必须加上英文版引用：

```markdown
---

> English documentation: [README.md](./README.md)
```

## 写作规范

- 语言简洁，避免废话
- 代码块指定语言标识符（`bash`、`ts`、`json` 等）
- 命令示例可直接复制运行
- 章节标题使用动词或名词短语，不用问句
- 不虚构功能或配置项——只写能从代码/配置中证实的内容
- 若项目信息不足以填写某章节，省略该章节，不写占位符

## 完成后报告

输出以下内容：

1. 已生成/更新的文件路径
2. 英文版章节列表（一行一个）
3. 若有信息无法确认而跳过的章节，注明原因
