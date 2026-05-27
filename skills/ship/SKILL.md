---
name: ship
description: >
  以项目总监视角交付产品——调度 8 个专业角色 Agent，确保产品逻辑闭环，在每个关键节点主动判断并干预。
  支持两种模式：（1）新项目——从零交付高质量 MVP 初版；（2）现有项目迭代——高质量交付迭代版本，已有功能不退化。
  内置工具链：状态看板、自动验证、阶段回滚、生产回滚。
  当用户说"ship"、"ship it"、"交付"、"发布产品"、"做一个新功能"、"端到端开发"、"全流程"、
  "一键开发上线"、"发一个版本"、"start ship"，或者想完整走一遍从需求到上线的开发流程时，务必使用此 skill。
---

## Harness 架构

ship workflow 的 harness 层由以下脚本组成。**脚本能做的事不交给 LLM 判断**。

| 脚本 | 职责 |
|---|---|
| `check-agents.sh` | 前置：确保 8 个角色 agent 已安装 |
| `detect-stage.sh` | 前置：检测项目当前阶段（新项目 vs 迭代）|
| `update-status.sh` | 全程：状态看板读写、git checkpoint |
| `validate-stage.sh` | **每阶段完成前自动验证产出**（0/1 退出码）|
| `gen-claude-md.sh` | Stage 3 后：生成项目 CLAUDE.md，统一所有 agent 的上下文 |
| `check-ports.sh` | Stage 9 前：确保 3000/5173 端口可用 |
| `verify-browser.ts` | Stage 7/9/10：headless 浏览器验证，不再手写脚本 |

**validate-stage.sh 是关键 harness 组件：** 每个 Stage 的 `done` 命令必须先通过验证才能执行。如果脚本失败，说明 agent 的产出不合格，不能 mark done。

---

## 前置检查

```bash
bash "$SKILL_DIR/scripts/check-agents.sh"
bash "$SKILL_DIR/scripts/detect-stage.sh"
bash "$SKILL_DIR/scripts/update-status.sh" init <project-name> <new-project|iteration>
```

---

## 角色分工

| 角色 | subagent_type | 职责 |
|---|---|---|
| 产品经理 | `Product Manager` | PRD 编写（Stage 1）|
| 技术架构师 | `Tech Architect` | TDD + 项目初始化（Stage 2-3）|
| UI 设计师 | `UI Designer` | 页面原型（Stage 4）|
| 测试工程师 | `Test Engineer` | 测试骨架 + QA 验收（Stage 5 + 9）|
| 后端工程师 | `Backend Engineer` | API 实现（Stage 6）|
| 前端工程师 | `Frontend Engineer` | 界面实现（Stage 7）|
| 技术评审 | `Code Reviewer` | 代码审查（Stage 8）|
| DevOps 工程师 | `DevOps Engineer` | 部署上线（Stage 10）|

**subagent_type 必须与 `~/.claude/agents/*.md` 中 `name` 字段完全一致（含大小写空格）。**

---

## 总监铁律

**总监只做三件事：启动 agent、读产出、评估质量。**

❌ 总监不直接编辑代码文件、测试文件、运行修复命令。  
发现问题 → 描述清楚 → spawn 对应角色 agent → 等修复 → 重新验证。

---

## 阶段间文件通信

```
Stage 1 → docs/prd-*.md
Stage 2 → docs/tdd-*.md
Stage 3 → apps/ 项目结构 + CLAUDE.md（harness 生成，所有 agent 共享上下文）
Stage 4 → design/*.html
Stage 5 → tests/
Stage 6 → apps/server/src/
Stage 7 → apps/web/src/
```

---

## Stage 1 — 产品经理：写 PRD

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 1 <project-name>
```

```
Agent(subagent_type="Product Manager", prompt="""
需求描述：<user-requirement>
项目目录：<project-dir>
任务：输出 PRD 到 <project-dir>/docs/prd-<name>-<date>.md

[迭代模式] 在现有产品基础上追加功能。先读现有 docs/prd-*.md 了解已有范围，
新 PRD 只描述增量需求，不重复已有内容。

如需额外交付物可同时要求：Roadmap、Go-to-Market Brief、Sprint Health Snapshot
""")
```

**评估：** 痛点真实？MVP ≤ 5 个功能？逻辑闭环？有 Web 前端？

```bash
# harness 自动验证：PRD 文件存在且有内容
bash "$SKILL_DIR/scripts/validate-stage.sh" 1 <project-dir> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 1 <project-name>
```

---

## Stage 2+3 — 技术架构师：TDD + 初始化

**迭代模式只执行 Phase 1（TDD），跳过 Phase 2（模板复制）。**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 2 <project-name>
```

```
Agent(subagent_type="Tech Architect", prompt="""
PRD：<project-dir>/docs/prd-*.md
项目目录：<project-dir>

Phase 1 — 写 TDD 到 <project-dir>/docs/tdd-<name>-<date>.md
技术栈固定：Elysia.js 1.x + Drizzle ORM + bun:sqlite（后端）
           React 18 + Vite + TanStack Query + React Router + Tailwind CSS 4（前端）
           bun workspaces monorepo，测试：bun:test + Playwright

[迭代模式 Phase 1] 先读现有 docs/tdd-*.md 了解已有 API 和 Schema，
新 TDD 只描述增量变更，明确标注「新增」vs「已有」，不修改已有接口签名。

Phase 2（仅新项目）— 初始化骨架：
  使用模板 ~/.claude/agents/fullstack-template/，参考 agent 定义中的初始化步骤
""")
```

**评估 TDD：** 每条用户故事有对应 API？Schema 完整？前后端连接方案？  
**评估骨架：** 目录结构与 TDD 一致？

```bash
# harness 自动验证 + 生成项目 CLAUDE.md（统一所有 agent 的上下文）
bash "$SKILL_DIR/scripts/validate-stage.sh" 2 <project-dir> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 2 <project-name>

bash "$SKILL_DIR/scripts/validate-stage.sh" 3 <project-dir> \
  && bash "$SKILL_DIR/scripts/gen-claude-md.sh" <project-dir> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 3 <project-name>
```

---

## Stage 4+5 — UI 设计师 + 测试工程师：并行

**两者都只依赖 TDD，并发启动节省约 800 秒。**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 4 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" start 5 <project-name>
```

```
# 同时 spawn，不等待彼此
Agent(subagent_type="UI Designer", prompt="""
输入：<project-dir>/docs/prd-*.md 和 tdd-*.md，以及 CLAUDE.md
输出：<project-dir>/design/（每个路由一个 HTML 文件）

[迭代模式] 只为新增页面/功能创建原型。不修改 design/ 中已有文件。
新原型的视觉风格必须与现有 design/*.html 保持一致（颜色、字体、组件样式）。
""")

Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 5 第一轮（unit + api，暂不写 E2E）
输入：<project-dir>/docs/prd-*.md、tdd-*.md、CLAUDE.md、apps/server/src/
输出：tests/unit/（全通）、tests/api/（全红）、playwright.config.ts

[迭代模式] 在现有 tests/ 基础上追加，不覆盖已有文件。
追加前先运行 bun test tests/unit/ tests/api/ 确认现有测试基线全通。
""")
```

**两者完成后补写 E2E：**

```
Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 5 第二轮（补写 E2E）
design/ 已完成：<project-dir>/design/
PRD：<project-dir>/docs/prd-*.md
CLAUDE.md：<project-dir>/CLAUDE.md
输出：tests/e2e/（每条用户故事一个 spec）

[迭代模式] 只为新功能添加 spec 文件，不修改已有 spec。
""")
```

**评估：** 每个路由有原型？unit 全通？api 全红？每条用户故事有 E2E？

```bash
bash "$SKILL_DIR/scripts/validate-stage.sh" 4 <project-dir> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 4 <project-name>
bash "$SKILL_DIR/scripts/validate-stage.sh" 5 <project-dir> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 5 <project-name>
```

---

## Stage 6 — 后端工程师：实现 API

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 6 <project-name>
```

```
Agent(subagent_type="Backend Engineer", prompt="""
输入：<project-dir>/docs/tdd-*.md、CLAUDE.md、tests/unit/、tests/api/、apps/server/src/
任务：实现 apps/server/src/ 下所有 API
完成标准：bun test tests/unit/ tests/api/ 全部 0 fail

[迭代模式] 先运行 bun test tests/unit/ tests/api/ 确认基线全通（不能有预存失败）。
只新增路由和逻辑，不修改已有路由的请求/响应格式。
完成后确认：原有测试仍然全通。
""")
```

**harness 自动运行测试——不信任 agent 的自我报告：**

```bash
bash "$SKILL_DIR/scripts/validate-stage.sh" 6 <project-dir> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 6 <project-name>
```

---

## Stage 7 — 前端工程师：实现界面

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 7 <project-name>
```

```
Agent(subagent_type="Frontend Engineer", prompt="""
输入：<project-dir>/design/、CLAUDE.md、docs/tdd-*.md、tests/e2e/、apps/server/src/routes/
任务：实现 apps/web/src/ 下所有页面和组件
完成标准：bun run build 0 错误 + 所有路由 headless 验证通过

[迭代模式] 只实现新增页面和组件，不修改已有 apps/web/src/ 文件（除非 TDD 明确要求）。
新组件风格必须与现有页面一致。
""")
```

**harness 验证（脚本代替手写 Playwright）：**

```bash
# 先验证构建
bash "$SKILL_DIR/scripts/validate-stage.sh" 7 <project-dir>

# 再启动 dev server 做浏览器验证（从 TDD 或 design/ 提取所有路由）
cd <project-dir>/apps/server && bun run src/index.ts &
cd <project-dir>/apps/web && bun run dev &
sleep 4

bun run "$SKILL_DIR/scripts/verify-browser.ts" \
  http://localhost:5173 \
  / /dashboard /transactions /reports /accounts  # ← 替换为实际路由

bash "$SKILL_DIR/scripts/update-status.sh" done 7 <project-name>
```

---

## Stage 8 — 技术评审：代码审查

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 8 <project-name>
```

```
Agent(subagent_type="Code Reviewer", prompt="""
输入：<project-dir>/apps/server/src/ 和 apps/web/src/，以及 CLAUDE.md
任务：审查前后端代码，输出结构化报告（🔴 Blocker / 🟡 Suggestion / 💭 Nit）

[迭代模式] 重点检查：新代码是否破坏了已有接口契约？新接口的错误格式是否与 CLAUDE.md 约定一致？
""")
```

**评估：** 🔴 Blocker 全部清零。不通过则 spawn 对应工程师修复，再 spawn Code Reviewer 复验。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 8 <project-name>
```

---

## Stage 9 — 测试工程师：全量验收

```bash
# harness：先检查端口，再启动服务
bash "$SKILL_DIR/scripts/check-ports.sh" || bash "$SKILL_DIR/scripts/check-ports.sh" --kill

bash "$SKILL_DIR/scripts/update-status.sh" start 9 <project-name>
```

```
Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 9 — QA 验收
项目目录：<project-dir>
后端在 localhost:3000，前端 dev server 在 localhost:5173（已运行）

任务：
  1. bun test tests/unit/ tests/api/ — 必须 0 fail
  2. bunx playwright test — 目标 0 fail
     测试 bug（selector 过宽、toHaveURL 含 ^ 锚点）：自行修复
     实现 bug：整理清单报给总监
  3. 调用 bun run "$SKILL_DIR/scripts/verify-browser.ts" 验证所有路由

[迭代模式] 所有测试（新功能 + 已有功能）必须全部 0 fail。
输出：分层测试报告 + SHIP IT ✅ / NEEDS WORK ❌
""")
```

**harness 自动验证单元/API 测试（不依赖 agent 自报）：**

```bash
bash "$SKILL_DIR/scripts/validate-stage.sh" 9 <project-dir> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 9 <project-name>
```

---

## Stage 10 — DevOps：部署上线

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 10 <project-name>
```

```
Agent(subagent_type="DevOps Engineer", prompt="""
项目目录：<project-dir>
任务：构建前端、配置后端静态文件服务、启动生产服务器、headless 浏览器验证
验证命令：bun run "$SKILL_DIR/scripts/verify-browser.ts" http://localhost:3000 <routes...>
输出：可访问的生产地址
""")
```

**harness 验证：**

```bash
bash "$SKILL_DIR/scripts/validate-stage.sh" 10 <project-dir> \
  && bun run "$SKILL_DIR/scripts/verify-browser.ts" http://localhost:3000 / <其他路由> \
  && bash "$SKILL_DIR/scripts/update-status.sh" done 10 <project-name>
```

---

## 交付验收

```
### 交付完成 🎉
产品：<name> | 版本：v1.0.0-mvp
- [用户故事 1] → ✅ 生产环境验证可用
- [用户故事 2] → ✅ 生产环境验证可用
访问地址：http://localhost:3000
```

---

## 回滚

```bash
bash "$SKILL_DIR/scripts/update-status.sh" rollback <stage_id> <project-name>
bash "$SKILL_DIR/scripts/rollback-deploy.sh" <project-name>
```

---

## 总监原则

- **脚本验证优先**：validate-stage.sh 说不通过就是不通过，不接受 agent 的解释
- **总监只评估不执行**：spawn agent，等结果，自己不动代码
- **一次说清楚**：fix 任务包含完整背景和所有已知问题
- **迭代不等于重来**：迭代模式每个阶段都要保护现有功能，不退化
- **生产验证是终点**：verify-browser.ts 全通才算交付
