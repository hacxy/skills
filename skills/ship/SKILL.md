---
name: ship
description: >
  以项目总监视角交付产品——调度 8 个专业角色 Agent，确保产品逻辑闭环，在每个关键节点主动判断并干预。
  支持两种模式：（1）新项目——从零交付高质量 MVP 初版；（2）现有项目迭代——高质量交付迭代版本，已有功能不退化。
  内置工具链：状态看板、阶段回滚、生产回滚。
  当用户说"ship"、"ship it"、"交付"、"发布产品"、"做一个新功能"、"端到端开发"、"全流程"、
  "一键开发上线"、"发一个版本"、"start ship"，或者想完整走一遍从需求到上线的开发流程时，务必使用此 skill。
---

## 前置检查：自动安装 Agents

```bash
bash "$SKILL_DIR/scripts/check-agents.sh"
```

脚本检查 `~/.claude/agents/` 中是否存在全部 8 个 agent 文件。缺失时自动从 `hacxy/agents` 克隆安装，完成后**必须重启 Claude Code**，然后重新运行 `/ship`。

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

**subagent_type 的值必须与 `~/.claude/agents/*.md` 文件中 `name` 字段完全一致（含大小写和空格）。**

阶段间通信通过文件完成：
```
Stage 1 → docs/prd-*.md    Stage 4 → design/*.html
Stage 2 → docs/tdd-*.md    Stage 5 → tests/
Stage 3 → apps/ 项目结构   Stage 6 → apps/server/src/
                            Stage 7 → apps/web/src/
```

---

## 总监铁律

**总监只做三件事：启动 agent、读产出、评估质量。**

发现问题 → 描述清楚 → spawn 对应角色 agent → 等修复 → 验证。

❌ 总监不直接编辑代码文件、测试文件、运行修复命令。发现自己要用 Edit/Write/Bash 修改 `apps/` 或 `tests/`——立即停止。

---

## 两种交付模式

| 模式 | 触发条件 |
|------|---------|
| **新项目 MVP** | 无代码库 / 全新立项 |
| **现有项目迭代** | 已有代码库 / 新功能需求 |

---

## 第一步：读懂需求，确定起点

```bash
bash "$SKILL_DIR/scripts/detect-stage.sh"
bash "$SKILL_DIR/scripts/update-status.sh" init <project-name> <new-project|iteration>
```

---

## 第二步：按阶段推进

---

### Stage 1 — 产品经理：写 PRD

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 1 <project-name>
```

```
Agent(subagent_type="Product Manager", prompt="""
需求描述：<user-requirement>
项目目录：<project-dir>
任务：输出 PRD 到 <project-dir>/docs/prd-<name>-<date>.md

如需额外交付物可同时要求：
  - Roadmap (Now/Next/Later)：路线图规划
  - Go-to-Market Brief：发布计划与 checklist
  - Sprint Health Snapshot：Sprint 交付状态跟踪
""")
```

**评估：** 痛点真实？MVP ≤ 5 个功能？逻辑闭环？有 Web 前端？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 1 <project-name>
```

---

### Stage 2+3 — 技术架构师：TDD + 初始化

**迭代模式只执行 Phase 1（TDD），跳过 Phase 2（初始化）。**

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

Phase 2（仅新项目）— 初始化骨架：
  使用模板 ~/.claude/agents/fullstack-template/，参考 agent 定义中的初始化步骤
""")
```

**评估 TDD：** 每条用户故事有对应 API？Schema 完整？前后端连接方案？
**评估骨架：** 服务器能启动？目录结构与 TDD 一致？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 2 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" done 3 <project-name>
```

---

### Stage 4+5 — UI 设计师 + 测试工程师：并行

**两者都只依赖 TDD，并发启动节省约 800 秒。**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 4 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" start 5 <project-name>
```

```
# 同时 spawn，不等待彼此
Agent(subagent_type="UI Designer", prompt="""
输入：<project-dir>/docs/prd-*.md 和 tdd-*.md
输出：<project-dir>/design/（每个路由一个 HTML 文件）
""")

Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 5 第一轮（unit + api，暂不写 E2E）
输入：<project-dir>/docs/prd-*.md、tdd-*.md、apps/server/src/
输出：tests/unit/（全通）、tests/api/（全红）、playwright.config.ts
""")
```

**两者完成后补写 E2E：**

```
Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 5 第二轮（补写 E2E）
design/ 已完成，路径：<project-dir>/design/
PRD：<project-dir>/docs/prd-*.md
输出：tests/e2e/（每条用户故事一个 spec）
""")
```

**评估：** 每个路由有原型？unit 全通？api 全红？每条用户故事有 E2E？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 4 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" done 5 <project-name>
```

---

### Stage 6 — 后端工程师：实现 API

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 6 <project-name>
```

```
Agent(subagent_type="Backend Engineer", prompt="""
输入：<project-dir>/docs/tdd-*.md、tests/unit/、tests/api/、apps/server/src/
任务：实现 apps/server/src/ 下所有 API
完成标准：bun test tests/unit/ tests/api/ 全部 0 fail
""")
```

**评估：** 0 fail？错误响应格式统一（`{ error, code }`）？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 6 <project-name>
```

---

### Stage 7 — 前端工程师：实现界面

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 7 <project-name>
```

```
Agent(subagent_type="Frontend Engineer", prompt="""
输入：<project-dir>/design/、docs/tdd-*.md、tests/e2e/、apps/server/src/routes/
任务：实现 apps/web/src/ 下所有页面和组件
完成标准：bun run build 0 错误 + headless 浏览器验证所有路由 0 console.error
""")
```

**评估（总监必须运行 headless 验证，不接受只 curl）：**
```typescript
import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
for (const route of allRoutes) {
  const page = await browser.newPage()
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  await page.goto(`http://localhost:5173${route}`, { waitUntil: 'networkidle' })
  console.log(`${route}: ${errors.length} errors`)
  await page.close()
}
```

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 7 <project-name>
```

---

### Stage 8 — 技术评审：代码审查

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 8 <project-name>
```

```
Agent(subagent_type="Code Reviewer", prompt="""
输入：<project-dir>/apps/server/src/ 和 apps/web/src/
任务：审查前后端代码，输出结构化报告（🔴 Blocker / 🟡 Suggestion / 💭 Nit）
""")
```

**评估：** 🔴 Blocker 全部清零。不通过则 spawn 对应工程师修复，再 spawn Code Reviewer 复验。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 8 <project-name>
```

---

### Stage 9 — 测试工程师：全量验收

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 9 <project-name>
```

```
Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 9 — QA 验收
项目目录：<project-dir>
后端在 localhost:3000，前端 dev server 在 localhost:5173（已运行）
输出：分层测试报告 + SHIP IT ✅ / NEEDS WORK ❌
""")
```

**评估：** 0 fail + SHIP IT。不通过则按清单 spawn 对应工程师修复，再重新验收。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 9 <project-name>
```

---

### Stage 10 — DevOps：部署上线

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 10 <project-name>
```

```
Agent(subagent_type="DevOps Engineer", prompt="""
项目目录：<project-dir>
任务：构建前端、配置后端静态文件服务、启动生产服务器、headless 浏览器验证
输出：可访问的生产地址
""")
```

**评估：** headless 所有路由 0 console.error + 核心用户路径可操作。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 10 <project-name>
```

---

## 第三步：交付验收

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

- **主动质疑**：每个阶段产出独立判断，不是"写完了就对了"
- **总监只评估不执行**：spawn agent，等结果，不自己动手
- **一次说清楚**：fix 任务包含完整背景和所有已知问题
- **早发现早干预**：PRD 阶段发现问题比 dev 阶段便宜 10 倍
- **生产验证是终点**：headless 浏览器通过才算交付
