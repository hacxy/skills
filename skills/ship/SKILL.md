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

在启动任何阶段之前，先检查必要的 agents 是否已安装：

```bash
bash "$SKILL_DIR/scripts/check-agents.sh"
```

脚本检查 `~/.claude/agents/` 中是否存在全部 8 个 agent 文件。缺失时自动从 `hacxy/agents` 克隆安装，
完成后**必须重启 Claude Code**，agents 才会生效，然后重新运行 `/ship`。

---

## 角色分工

每个角色对应 `~/.claude/agents/` 下的一个具名 agent 定义文件，通过 `subagent_type` 调用。
**角色身份由 agent 文件保证**，每次 spawn 同类型 agent 都加载相同的 system prompt。

| 角色 | subagent_type | 职责 |
|---|---|---|
| 产品经理 | `Product Manager` | PRD 编写（Stage 1）|
| 技术架构师 | `Tech Architect` | TDD + 项目初始化（Stage 2-3）|
| UI 设计师 | `UI Designer` | 页面原型（Stage 4）|
| 测试工程师 | `Test Engineer` | 测试骨架（Stage 5）+ QA 验收（Stage 9）|
| 后端工程师 | `Backend Engineer` | API 实现（Stage 6）|
| 前端工程师 | `Frontend Engineer` | 界面实现（Stage 7）|
| 技术评审 | `Code Reviewer` | 代码审查（Stage 8）|
| DevOps 工程师 | `DevOps Engineer` | 部署上线（Stage 10）|

**subagent_type 的值必须与 `~/.claude/agents/*.md` 文件中 `name` 字段完全一致（含大小写和空格）。**

阶段间通信通过文件完成，不依赖对话上下文：
```
Stage 1  → docs/prd-*.md
Stage 2  → docs/tdd-*.md
Stage 3  → apps/ 项目结构
Stage 4  → design/*.html
Stage 5  → tests/
Stage 6  → apps/server/src/
Stage 7  → apps/web/src/
```

---

## 总监铁律（开始之前必须内化）

**总监只做三件事：启动 agent、读产出、评估质量。**

发现问题时的唯一动作：描述清楚问题 → 再次 spawn 对应角色的 agent → 等它修复 → 验证结果。

**总监绝对不做：**
- ❌ 直接编辑任何代码文件
- ❌ 直接修改测试文件
- ❌ 直接运行修复命令

如果你发现自己正要使用 Edit / Write / Bash 去修改 `apps/` 或 `tests/` 下的文件——**立即停止**，改为描述问题并 spawn 对应 agent。"只改一行很快"不是理由。总监亲自动手会让角色分工崩溃，也让 agent 失去学习修复的机会。

---

## 两种交付模式

| 模式 | 触发条件 | 目标 |
|------|---------|------|
| **新项目 MVP** | 无代码库 / 全新立项 | 高质量、逻辑自洽的第一个可用版本 |
| **现有项目迭代** | 已有代码库 / 新功能需求 | 高质量迭代，已有功能不退化 |

---

## 第一步：读懂需求，确定起点

```bash
bash "$SKILL_DIR/scripts/detect-stage.sh"
bash "$SKILL_DIR/scripts/update-status.sh" init <project-name> <new-project|iteration>
```

---

## 第二步：按阶段推进

每个阶段模式：spawn agent → 读产出评估 → 通过则继续 → 不通过则描述问题再 spawn 同角色修复。

发现需要修复时，**在 prompt 里说清楚背景（你刚完成了什么）+ 具体问题 + 期望结果**，让 agent 有足够上下文。

---

### 阶段 1 — 产品经理：写 PRD

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 1 <project-name>
```

```
Agent(subagent_type="Product Manager", prompt="""
需求描述：<user-requirement>
项目目录：<project-dir>
任务：将需求转化为有价值、逻辑自洽的 PRD，保存到 <project-dir>/docs/prd-<name>-<date>.md
要求：MVP 功能不超过 5 个，每条用户故事有明确 acceptance criteria，页面规划含路由
""")
```

**总监评估：**
1. 痛点是目标用户真实会遇到的吗？
2. MVP 不超过 5 个核心功能？
3. 用户能完整走完一件事吗？
4. 必须是 Web 前端应用？

**不通过时：** 描述具体问题，再 spawn `Product Manager` agent 修改。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 1 <project-name>
```

---

### 阶段 2+3 — 技术架构师：写 TDD + 初始化项目

**迭代模式只执行 TDD，跳过初始化。**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 2 <project-name>
```

```
Agent(subagent_type="Tech Architect", prompt="""
PRD 路径：<project-dir>/docs/prd-*.md
项目目录：<project-dir>

Phase 1 — 写 TDD，保存到 <project-dir>/docs/tdd-<name>-<date>.md
技术栈固定：React 18 + Vite + TanStack Query + React Router + Tailwind CSS 4（前端）
           Elysia.js 1.x + Drizzle ORM + bun:sqlite（后端）
           bun workspaces monorepo（apps/web + apps/server）
           测试：bun:test + Playwright

Phase 2（仅新项目）— 初始化项目骨架：
  - 整体复制 fullstack 模板到 <project-dir>，只更新 package.json name
  - bun install && bunx drizzle-kit generate
  - 验证 bun run dev:server 无报错启动
  - 骨架路由只返回空响应，禁止实现任何业务逻辑
""")
```

**总监评估 TDD：** PRD 每条用户故事都有对应 API？Schema 支撑所有功能？前后端连接方案完整？

**总监评估骨架：** 服务器能启动？目录结构与 TDD 一致？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 2 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" done 3 <project-name>
```

---

### 阶段 4+5 — UI 设计师 + 测试工程师：并行执行

**Stage 4 和 Stage 5 的 unit/API 测试都只依赖 TDD，两者并发启动节省约 800 秒。**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 4 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" start 5 <project-name>
```

**同时 spawn 两个 agent（不等待彼此）：**

```
# 并发 — 两个 Agent 同时运行
Agent(subagent_type="UI Designer", prompt="""
输入：
  - <project-dir>/docs/prd-*.md（用户故事）
  - <project-dir>/docs/tdd-*.md（页面与路由规划）
任务：为每个页面创建 HTML 原型，保存到 <project-dir>/design/，每个路由一个文件
要求：移动端优先（375px），使用真实中文内容和数字，包含底部导航栏
""")

Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 5 — 写测试骨架（第一轮：unit + api，暂不写 E2E）
输入：
  - <project-dir>/docs/prd-*.md（用户故事）
  - <project-dir>/docs/tdd-*.md（API 设计）
  - <project-dir>/apps/server/src/（现有骨架代码）
产出（本轮）：
  - tests/unit/（纯逻辑，初始全通）
  - tests/api/（初始全红）
  - playwright.config.ts（先建好框架）
E2E 测试等 UI 设计师完成后单独补写。
运行 bun test tests/unit/ 确认全通后结束。
""")
```

**等两者都完成后，补写 E2E（需要 design/ 作为 selector 参考）：**

```
Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 5 — 补写 E2E 测试
UI 原型已完成，路径：<project-dir>/design/
PRD 用户故事：<project-dir>/docs/prd-*.md
补写 tests/e2e/，每条用户故事一个 spec。
注意：selector 要精准，toHaveURL 不加 ^ 锚点，seeding 用 page.request.post API
""")
```

**总监评估：** UI 覆盖所有路由？unit 全通？api 测试初始为红？每条用户故事有 E2E？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 4 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" done 5 <project-name>
```

---

### 阶段 5（原始提示，仅顺序执行时使用）

```
Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 5 — 写测试骨架
输入：
  - <project-dir>/docs/prd-*.md（用户故事）
  - <project-dir>/docs/tdd-*.md（API 设计）
  - <project-dir>/design/（UI 原型，参考按钮文案和表单结构）
  - <project-dir>/apps/server/src/（现有骨架代码，了解 API 实际结构）
产出：
  - tests/unit/（纯逻辑，初始全通）
  - tests/api/（初始全红，后端未实现时失败）
  - tests/e2e/（每条用户故事一个 spec）
  - playwright.config.ts（配置 reuseExistingServer: true，baseURL: http://localhost:5173）
注意：
  - 表单有 type="number" + min 属性时，加 noValidate 到 form 元素以禁用浏览器原生校验
  - 测试 selector 要精准，避免 strict mode 违规（不要用 getByText 匹配可能出现在多处的短字符串）
  - E2E 测试 seeding 优先用 page.request.post API，不要用 UI 表单创建数据（不可靠）
  - toHaveURL 使用的 regex 会匹配完整 URL（含 http://localhost:5173），不要加 ^ 锚点
  - 运行 bun test tests/unit/ 确认全通后结束
""")
```

**总监评估：** 每条用户故事有对应 E2E？API 测试初始为红？单元测试全通？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 5 <project-name>
```

---

### 阶段 6 — 后端工程师：实现 API

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 6 <project-name>
```

```
Agent(subagent_type="Backend Engineer", prompt="""
输入：
  - <project-dir>/docs/tdd-*.md（API 设计、数据库 Schema）
  - <project-dir>/tests/unit/ 和 tests/api/（待通过的测试）
  - <project-dir>/apps/server/src/（现有骨架）
任务：实现 apps/server/src/ 下所有 API 路由和数据库逻辑
先读测试文件了解期望行为，再实现。
完成标准：bun test tests/unit/ tests/api/ 全部 0 fail
每实现一组接口就跑一遍测试，红灯不往下走。
""")
```

**总监评估：** `bun test tests/unit/ tests/api/` 0 fail？错误响应格式统一？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 6 <project-name>
```

---

### 阶段 7 — 前端工程师：实现界面

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 7 <project-name>
```

```
Agent(subagent_type="Frontend Engineer", prompt="""
输入：
  - <project-dir>/design/（视觉规格，严格参照，不自行发挥布局）
  - <project-dir>/docs/tdd-*.md（API 接口和连接方案）
  - <project-dir>/tests/e2e/（待通过的 E2E 测试）
  - <project-dir>/apps/server/src/routes/（了解 API 实际返回格式）
任务：实现 apps/web/src/ 下所有页面和组件
API 调用：使用 fetch 封装 fetchApi helper，不用 Eden Treaty
注意：
  - 表单必须加 noValidate，依赖 JS 校验而非浏览器原生校验
  - 交易行元素加 data-testid="tx-row"
  - 静态文件服务：后端用显式 /assets/* 路由，不用 staticPlugin 通配符
完成标准：
  1. bun run build 0 TypeScript 错误
  2. headless 浏览器验证所有路由 0 console.error，JS/CSS MIME type 正确
""")
```

**总监评估（必须用 headless 浏览器验证，不接受只 curl）：**
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

### 阶段 8 — 技术评审：代码审查

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 8 <project-name>
```

```
Agent(subagent_type="Code Reviewer", prompt="""
输入：<project-dir>/apps/server/src/ 和 <project-dir>/apps/web/src/
任务：审查前后端代码，输出结构化报告（🔴 Blocker / 🟡 Suggestion / 💭 Nit）
重点检查：SQL 注入、XSS、CORS 配置、未处理异常、数据丢失风险、前后端接口契约
""")
```

**总监评估：** 🔴 Blocker 全部清零。

**不通过时：** 将 Blocker 列表分别发给 `Backend Engineer` 或 `Frontend Engineer` 修复，修复后重新 spawn `Code Reviewer` 验证。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 8 <project-name>
```

---

### 阶段 9 — 测试工程师：全量验收

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 9 <project-name>
```

```
Agent(subagent_type="Test Engineer", prompt="""
模式：Stage 9 — QA 验收
项目目录：<project-dir>
后端在 localhost:3000，前端 dev server 在 localhost:5173（已运行，playwright 设 reuseExistingServer: true）

任务：
  1. bun test tests/unit/ tests/api/ — 必须 0 fail
  2. bunx playwright test — 目标 0 fail
     如有失败：分析根因，判断是实现 bug 还是测试 bug
       - 实现 bug：整理成问题清单报给总监，等总监分配给对应工程师
       - 测试 bug（selector 过宽、toHaveURL 正则含 ^ 锚点等）：自行修复再跑
     迭代直到 0 fail 或确认剩余失败均为已知实现问题
  3. headless 浏览器检查所有路由：0 console.error，JS/CSS MIME type 正确
输出：分层测试报告 + SHIP IT ✅ / NEEDS WORK ❌（含具体实现问题清单）
""")
```

**总监评估：** 0 fail + SHIP IT。

**不通过时：** 拿 test-engineer 给出的实现问题清单，分别 spawn 对应角色的 agent 修复，再重新 spawn `Test Engineer` 全量验收。不要自己改任何文件。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 9 <project-name>
```

---

### 阶段 10 — DevOps：部署上线

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 10 <project-name>
```

```
Agent(subagent_type="DevOps Engineer", prompt="""
项目目录：<project-dir>
任务：
  1. 构建前端：cd apps/web && bun run build
  2. 后端添加静态文件服务（显式路由，不用 staticPlugin 通配符）：
     .get('/assets/*', ({ params }) => Bun.file(join(frontendDist, 'assets', params['*'])))
     .get('/', () => Bun.file(join(frontendDist, 'index.html')))
     .get('/*', ({ request }) => {
       if (/\.[a-zA-Z0-9]+$/.test(new URL(request.url).pathname))
         return new Response('Not Found', { status: 404 })
       return Bun.file(join(frontendDist, 'index.html'))
     })
  3. 启动生产服务器
  4. headless 浏览器验证所有路由：0 console.error，JS=text/javascript，CSS=text/css
  5. 走一遍 PRD 核心用户路径验证功能可用
输出：可访问的生产地址
""")
```

**总监最终验证：** headless 浏览器所有路由 0 console.error + 核心用户路径可操作。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 10 <project-name>
```

---

## 第三步：交付验收

```
### 交付完成 🎉
产品：<name>
版本：v1.0.0-mvp
PRD 承诺 → 生产验证：
- [用户故事 1] → ✅
- [用户故事 2] → ✅
访问地址：http://localhost:3000
```

---

## 回滚机制

```bash
# 阶段级回滚
bash "$SKILL_DIR/scripts/update-status.sh" rollback <stage_id> <project-name>
# 生产级回滚
bash "$SKILL_DIR/scripts/rollback-deploy.sh" <project-name>
```

---

## 总监原则

- **主动质疑，不被动接受**：每个阶段产出都要独立判断
- **总监只评估，不执行**：发现问题描述清楚，spawn 对应角色 agent，等结果
- **一次说清楚**：给 agent 的 fix 任务要包含完整背景和所有已知问题，不要一个问题一个问题地发
- **早发现，早干预**：PRD 阶段发现方向错误，比 dev 阶段便宜 10 倍
- **生产验证是终点**：headless 浏览器验证通过才算交付，不接受只 curl
