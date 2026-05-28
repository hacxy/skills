# Ship Workflow — 通用问题积累

每次 ship 运行复盘后自动更新。每条记录格式：
- **触发场景**：Stage X + 具体情境
- **建议改进**：针对 prompt / 脚本 / 阶段设计的具体改动方向
- **出现次数**：N 次（跨项目累计）

---

## Prompt 质量

<!-- agent 指令描述不清导致产出偏差 -->

---

## Harness/脚本

<!-- validate 逻辑有漏洞、脚本超时、误判 -->

---

## 阶段设计

<!-- Stage 间接口定义歧义、并行策略不合理、阶段职责边界模糊 -->

---

## Agent 能力边界

<!-- 某类 agent 在某类任务的固有局限，需要在 prompt 中补充约束或拆分任务 -->

---

## 技术栈

<!-- 固定技术栈（Elysia.js / Drizzle / bun / React / TanStack Query）的已知坑 -->
