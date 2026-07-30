---
name: git-commit
description: "提交代码并推送。当用户提到 git commit、push、submit 或要求提交更改时使用。"
---

# Git Commit

**Leading word: confirm** — 每一步都停下来等用户确认。绝不静默提交或推送。

## 步骤

1. **确认仓库。** `git rev-parse --is-inside-work-tree`。非仓库 → 询问是否 `git init`，等待回复。
2. **扫描变更。** 跑 `git status` + `git diff` + `git diff --cached`。新文件用 `read` 扫一眼理解用途。
3. **呈现变更摘要。** 哪些文件变了、变了什么，一句话概括每个文件。
4. **拟定提交信息。** Conventional Commits 格式，祈使语气，语言与用户一致。多个文件属同一逻辑变更时合并为一次提交。
5. **等待用户确认提交信息。** 展示拟定信息，问「是否用这条信息提交？」。用户要改就改，改完再展示。
6. **执行提交。** 用户确认后 `git add` + `git commit`。
7. **询问是否推送。** 提交成功后问「是否 push？」。是 → `git push`。否 → 结束。

## 完成标准

- 步骤 6 执行前，对话中必须存在用户对提交信息的明确确认回复
- 提交信息遵循 Conventional Commits，祈使语气，语言与用户一致
- 变更摘要覆盖所有变更文件，无遗漏

## 反模式

- **静默提交（Silent commit）** — 不等确认就跑 `git commit`。必须等用户说「可以」。
- **静默推送（Silent push）** — 提交完直接 push。必须单独询问。
- **一次性全做（Batch everything）** — 扫描、拟定信息、提交、push 一口气跑完。每一步都要停。
