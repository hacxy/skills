---
name: commit
description: 生成 git 提交信息并创建提交。当你想暂存更改并使用自动生成的 Conventional Commits 格式提交时使用。可选传入提示，例如 /commit fix auth bug。支持通过 --lang=<code> 指定提交信息语言，例如 /commit --lang=en fix auth bug。
---

按照以下步骤创建 git 提交：

1. 运行 `git status` 和 `git diff`（已暂存和未暂存）以了解所有变更
   - 若变更文件较多且范围不同（例如功能、修复、重构、文档混杂），先按变更目的分组，准备分多次提交
2. 运行 `git log --oneline -5` 以了解该仓库使用的提交信息风格
3. 使用 `git add` 暂存所有相关的已修改文件（优先指定具体文件而非 `git add .`，且不要暂存 .env 文件或密钥）
4. 解析 `$ARGUMENTS`：
   - 若包含 `--lang=<code>`，提取语言设置（支持 `zh`/`zh-CN` 为中文，`en`/`en-US` 为英文），其余部分作为提交内容的提示
   - 若未指定 `--lang`，默认使用**中文**
5. 按照 Conventional Commits 格式编写简洁的提交信息：`type: description`
   - 常见类型：`feat`、`fix`、`refactor`、`chore`、`docs`、`test`、`ci`
   - 主题行保持在 72 个字符以内
   - 用步骤 4 确定的语言撰写 description 部分
6. 使用以下命令创建提交：
   ```
   git commit -m "..."
   ```
   不要在提交信息中添加任何 `Co-Authored-By` 行。
   - 当需要分组提交时，按分组重复执行“暂存 -> 生成提交信息 -> 提交”，直到该组完成
7. 每次提交后重新运行 `git status` 检查剩余变更：
   - 若仍有未提交变更，继续下一组提交
   - 目标是确保本次要处理的所有变更最终都已提交（`git status` 不再显示相关未提交改动）
8. 所有提交完成后，先列出并告知用户本次新产生的提交信息（至少包含每条提交的哈希短 ID 与主题行，可使用 `git log --oneline` 按本次提交数量展示）。
9. 在告知提交信息后，必须通过交互按钮询问用户是否执行 `push`（提供“是/否”选项）：
   - 若用户选择“是”，先检查当前分支是否已有上游分支：
     - 有上游分支：执行 `git push`
     - 无上游分支：执行 `git push -u origin HEAD`
   - 若用户选择“否”，则结束流程，不执行任何推送操作。

如果没有可提交的内容，说明情况并停止。
