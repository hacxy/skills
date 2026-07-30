---
name: readme-gen
description: 生成和更新双语 README 文件（README.md 英文 + README_ZH.md 中文），遵循快速开始优先结构，支持多语言扩展
---

# README Generator

两个入口：**创建（Create）** 和 **更新（Update）**。

**入口决策：** 如果项目根目录已存在 README 且用户未明确说「从头开始」或「重新生成」，使用 **更新**。否则使用 **创建**。

## 流程（Process）

1. **收集信息（Gather）。** 检查项目结构：`package.json`、源代码目录、现有文档、许可证文件。识别项目类型（库/应用/工具/CLI）。

2. **确定配置（Configure）。** 根据用户指示设置语言组合。无指示则使用默认配置。

   **默认配置：**
   - Primary: 英文 → `README.md`
   - Secondary: 中文 → `README_ZH.md`

   **用户可覆盖：**
   - 「只生成中文」→ `README.md`（中文）
   - 「只生成英文」→ `README.md`（英文）
   - 「加一个日文」→ 新增 `README_JA.md`，主文件保持 `README.md`
   - 「以中文为默认」→ `README.md` 改为中文，`README_EN.md` 为英文

   **单文件规则：** 只生成一个语言版本时，文件名固定为 `README.md`，不添加语言后缀。

3. **生成内容（Generate）。** 按以下结构生成每个语言版本：

   ```
   # 项目名
   > 一句话描述 + 徽章行（3-5个）
   
   ## Quick Start / 快速开始
   安装命令 + 最简可运行示例
   
   ## Features / 特性
   3-5 个核心特性（bullet points）
   
   ## Installation / 安装
   详细的安装选项（npm/yarn/pnpm/brew/docker）
   
   ## Usage / 用法
   代码示例 + 截图/GIF（如有）
   
   ## Contributing / 贡献
   链接到 CONTRIBUTING.md 或内联简要说明
   
   ## License / 许可证
   许可证类型 + 链接
   ```

4. **写入文件（Write）。** 创建文件，确保 Markdown 语法正确。

### 更新（Update）

1. **读取现有（Read）。** 加载目标 README，识别结构：章节标题、徽章、代码块、自定义内容。

2. **对比差异（Diff）。** 检查 `package.json` 版本、依赖变更、`CHANGELOG.md`、git diff（如有）。识别需要更新的部分。

3. **保留自定义（Preserve）。** 非标准章节（不在 Generate 模板中的章节）视为自定义内容，更新时保留原样。

4. **增量更新（Patch）。** 只修改变化的部分：更新版本号、添加新特性、修正过时链接。避免全量重写。

5. **验证一致性（Verify）。** 确保双语版本同步更新，章节结构保持一致，徽章数量 ≤ 5 且链接有效。

## 规则（Rules）

1. **快速开始优先（Quick-start first）。** 前 5 行必须包含可运行的安装命令或代码示例。
2. **徽章限制（Badge limit）。** 最多 5 个：版本、CI、许可证、下载量、一个领域特定徽章。
3. **代码可复制（Copy-pasteable）。** 所有代码块必须能直接复制运行，不含占位符。
4. **暗/亮模式支持（Dark/light mode）。** Logo 使用 `<picture>` 标签支持两种主题。
5. **链接有效（Valid links）。** 所有外部链接必须指向真实存在的资源。使用项目已知的 URL（npm 包页面、GitHub 仓库）而非假设链接。
6. **增量优先（Patch first）。** 更新时优先修改局部，而非全量重写。保留用户自定义内容。
7. **自定义保护（Custom protection）。** 非标准章节（如项目特定说明、团队规范）视为自定义内容，更新时保留原样。

## 反模式（Anti-patterns）

- **全面膨胀（Comprehensive bloat）** — 记录每个边缘情况和配置选项。砍到核心用法，链接到详细文档。
- **重复显而易见（Restating the obvious）** — 「首先安装 Node.js」对于 Node 项目是 no-op。测试：这行对目标用户有新信息吗？
- **实现耦合（Implementation coupling）** — 嵌入特定版本号、文件路径或会过时的配置。使用变量或链接到版本化文档。
- **破坏性重写（Destructive rewrite）** — 全量重写现有 README 而非增量更新。丢失用户自定义内容和项目特定信息。检测：如果替换内容超过 50%，停止并询问用户。

## 完成标准（Completion Criterion）

### 创建

- [ ] 所有请求的语言版本文件已创建
- [ ] 每个文件包含 Quick Start 章节且有可运行代码
- [ ] 徽章数量 ≤ 5 且链接有效
- [ ] 代码示例可直接复制运行
- [ ] 双语版本包含相同章节结构
- [ ] 双语版本包含相同徽章和链接

### 更新

- [ ] 现有自定义内容已保留（非标准章节原样保留）
- [ ] 过时信息已更新（版本、依赖、API）
- [ ] 双语版本同步更新
- [ ] 章节结构保持一致
- [ ] 新增内容符合项目当前状态
- [ ] 徽章数量 ≤ 5 且链接有效

## 输出示例（Output Example）

见 [references/readme-template.md](references/readme-template.md) 获取完整模板。
