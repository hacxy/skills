---
name: ship
description: >
  以项目总监视角交付产品——调度 8 个持久专业角色 Agent，确保产品逻辑闭环，在每个关键节点主动判断并干预。
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

脚本会检查 `~/.claude/agents/` 中是否存在以下 8 个 agent 文件：
`product-manager.md`, `tech-architect.md`, `ui-designer.md`, `test-engineer.md`,
`backend-engineer.md`, `frontend-engineer.md`, `code-reviewer.md`, `devops-engineer.md`

**如果缺少任何一个，脚本自动执行安装：**
```bash
gh repo clone hacxy/agents /tmp/hacxy-agents 2>/dev/null || \
  git clone https://github.com/hacxy/agents /tmp/hacxy-agents
bash /tmp/hacxy-agents/scripts/install.sh
```

安装完成后提示用户**重启 Claude Code** 使 agents 生效，然后重新运行 `/ship`。

---

## 角色分工

workflow 采用持久 Agent 架构——每个角色 Agent 在整个项目周期内保持活跃，总监通过 SendMessage 与其持续协作。

| agentId 变量 | 角色 | subagent_type | 职责 |
|---|---|---|---|
| `$pm` | 产品经理 | `product-manager` | PRD 编写（Stage 1）|
| `$arch` | 技术架构师 | `tech-architect` | TDD + 项目初始化（Stage 2-3）|
| `$ui` | UI 设计师 | `ui-designer` | 页面原型（Stage 4）|
| `$test` | 测试工程师 | `test-engineer` | 测试骨架 + QA 验收（Stage 5 + 9）|
| `$be` | 后端工程师 | `backend-engineer` | API 实现（Stage 6）|
| `$fe` | 前端工程师 | `frontend-engineer` | 界面实现（Stage 7）|
| `$cr` | 技术评审 | `code-reviewer` | 代码审查（Stage 8）|
| `$devops` | DevOps 工程师 | `devops-engineer` | 部署上线（Stage 10）|

**关键原则：**
- 每个 Agent 启动后保存其 agentId，后续所有沟通通过 `SendMessage` 进行
- 发现问题时，总监通过 SendMessage 发回对应 Agent 修复，不自行改代码
- 阶段间通信通过文件完成，不依赖对话上下文：
  ```
  Stage 1  → docs/prd-*.md
  Stage 2  → docs/tdd-*.md
  Stage 3  → apps/ 项目结构（含骨架代码）
  Stage 4  → design/*.html
  Stage 5  → tests/
  Stage 6  → apps/server/src/
  Stage 7  → apps/web/src/
  ```

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

每个阶段：① 启动 Agent（首次）或 SendMessage（后续）→ ② 读取产出评估质量 → ③ 通过则继续，不通过则 SendMessage 发回改进。

---

### 阶段 1 — 产品经理：写 PRD

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 1 <project-name>
```

启动产品经理 Agent，保存 agentId：

```
$pm = Agent(subagent_type="product-manager", prompt="""
需求描述：<user-requirement>
项目目录：<project-dir>
任务：将需求转化为有价值、逻辑自洽的 PRD，保存到 <project-dir>/docs/prd-<name>-<date>.md
""")
```

**总监评估（读完 PRD 后主动判断）：**
1. **产品价值**：痛点是目标用户真实会遇到的吗？
2. **MVP 范围**：核心功能不超过 5 个
3. **逻辑闭环**：用户能完整走完一件事吗？
4. **技术栈**：面向普通用户必须有 Web 前端

**不通过时：** `SendMessage($pm, "发现问题：<具体问题>，请修改...")`

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 1 <project-name>
```

---

### 阶段 2+3 — 技术架构师：写 TDD + 初始化项目

**迭代模式只执行 TDD（跳过项目初始化）。**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 2 <project-name>
```

启动技术架构师 Agent，保存 agentId：

```
$arch = Agent(subagent_type="tech-architect", prompt="""
PRD 路径：<project-dir>/docs/prd-*.md
项目目录：<project-dir>
任务：
  Phase 1 — 写 TDD，保存到 <project-dir>/docs/tdd-<name>-<date>.md
  Phase 2（仅新项目）— 初始化项目骨架：
    cp -r <fullstack-template> <project-dir>
    更新 package.json name
    bun install && bunx drizzle-kit generate
    验证服务器能启动
    骨架路由只返回空响应，禁止实现任何业务逻辑
""")
```

**总监评估 TDD：**
1. PRD 每条用户故事都有对应 API？
2. Schema 能支撑所有 MVP 功能？
3. 前后端连接方案说清楚了吗？

**总监评估骨架（新项目）：**
1. `bun run dev:server` 无报错启动？
2. 目录结构与 TDD 一致？

**不通过时：** `SendMessage($arch, "<具体问题>，请修改...")`

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 2 <project-name>
bash "$SKILL_DIR/scripts/update-status.sh" done 3 <project-name>
```

---

### 阶段 4 — UI 设计师：页面原型

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 4 <project-name>
```

```
$ui = Agent(subagent_type="ui-designer", prompt="""
输入：
  - <project-dir>/docs/prd-*.md（用户故事）
  - <project-dir>/docs/tdd-*.md（页面与路由规划）
任务：为每个页面创建 HTML 原型，保存到 <project-dir>/design/，每个路由一个文件
要求：移动端优先，使用真实内容填充，不使用占位文本
""")
```

**总监评估：**
1. TDD 每个路由都有对应原型？
2. 核心操作能一眼找到？

**不通过时：** `SendMessage($ui, "<具体问题>...")`

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 4 <project-name>
```

---

### 阶段 5 — 测试工程师：建立测试骨架

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 5 <project-name>
```

```
$test = Agent(subagent_type="test-engineer", prompt="""
模式：Stage 5 — 写测试骨架
输入：
  - <project-dir>/docs/prd-*.md（用户故事）
  - <project-dir>/docs/tdd-*.md（API 列表）
  - <project-dir>/design/（UI 原型，参考按钮文案和表单结构）
产出：
  - tests/unit/（初始全通，纯逻辑）
  - tests/api/（初始全红，后端未实现时应失败）
  - tests/e2e/（每条用户故事一个 Playwright spec）
  - playwright.config.ts
""")
```

**总监评估：**
1. 每条用户故事都有对应 E2E 测试？
2. API 测试初始为红（不是空壳假绿）？
3. `bun test tests/unit/` 通过？

**不通过时：** `SendMessage($test, "<具体问题>...")`

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 5 <project-name>
```

---

### 阶段 6 — 后端工程师：实现 API

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 6 <project-name>
```

```
$be = Agent(subagent_type="backend-engineer", prompt="""
输入：
  - <project-dir>/docs/tdd-*.md（API 设计、数据库 Schema）
  - <project-dir>/tests/unit/ 和 tests/api/（待通过的测试）
任务：实现 apps/server/src/ 下的所有 API 路由和数据库逻辑
完成标准：bun test tests/unit/ tests/api/ 全部通过（0 fail）
每实现一个接口就跑一遍 API 测试，红灯不往下走
""")
```

**总监评估：**
1. `bun test tests/unit/ tests/api/` 0 fail？
2. 错误响应格式统一（`{ error, code }`）？
3. 迭代模式：已有测试仍然全通？

**不通过时：** `SendMessage($be, "测试未通过：<具体用例>，请修复...")`

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 6 <project-name>
```

---

### 阶段 7 — 前端工程师：实现界面

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 7 <project-name>
```

```
$fe = Agent(subagent_type="frontend-engineer", prompt="""
输入：
  - <project-dir>/design/（视觉规格，严格参照，不自行发挥布局）
  - <project-dir>/docs/tdd-*.md（API 接口和连接方案）
  - <project-dir>/tests/e2e/（待通过的 E2E 测试）
任务：实现 apps/web/src/ 下的所有页面和组件
完成标准：
  1. bun run build 0 TypeScript 错误
  2. E2E 测试全部通过
  3. headless 浏览器检查：所有路由 0 console.error，JS/CSS MIME type 正确
""")
```

**总监评估（必须用 headless 浏览器脚本验证，不接受只 curl）：**

```typescript
import { chromium } from 'playwright'
const browser = await chromium.launch({ headless: true })
for (const route of allRoutes) {
  const page = await browser.newPage()
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle' })
  console.log(`${route}: ${errors.length} errors`)
  await page.close()
}
```

**不通过时：** `SendMessage($fe, "发现问题：<具体问题>，请修复...")`

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 7 <project-name>
```

---

### 阶段 8 — 技术评审：代码审查

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 8 <project-name>
```

```
$cr = Agent(subagent_type="code-reviewer", prompt="""
输入：<project-dir>/apps/server/src/ 和 <project-dir>/apps/web/src/
任务：审查前后端代码，输出结构化报告（🔴 Blocker / 🟡 Suggestion / 💭 Nit）
""")
```

**总监评估：** 🔴 Blocker 全部清零。

**不通过时：** `SendMessage($be, "Blocker：<问题>...")` 或 `SendMessage($fe, "...")`

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 8 <project-name>
```

---

### 阶段 9 — 测试工程师：全量验收

**复用 Stage 5 的同一个 Agent（SendMessage，不新建）：**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 9 <project-name>
```

```
SendMessage($test, """
模式：Stage 9 — QA 验收
任务：
  1. bun test tests/unit/ tests/api/ — 必须 0 fail
  2. bunx playwright test — 必须 0 fail
  3. headless 浏览器检查所有路由：0 console.error，JS/CSS MIME type 正确
输出：分层测试报告 + SHIP IT / NEEDS WORK 最终判决
""")
```

**总监评估：** 0 fail + SHIP IT 判决。

**不通过时：** 根据报告 SendMessage 对应 Agent 修复，再 SendMessage($test) 重新验收。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 9 <project-name>
```

---

### 阶段 10 — DevOps：部署上线

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 10 <project-name>
```

```
$devops = Agent(subagent_type="devops-engineer", prompt="""
输入：<project-dir>/（完整项目）
任务：
  1. 构建前端：cd apps/web && bun run build
  2. 启动生产服务器（后端托管前端静态文件，使用显式路由服务 /assets/*）
  3. headless 浏览器验证所有路由：0 console.error，JS/CSS MIME type 正确
  4. 走一遍 PRD 核心用户路径
输出：可访问的生产地址
""")
```

**总监最终验证：**
1. headless 浏览器：所有路由 0 console.error
2. 按 PRD 用户故事逐条操作，每条都能完成
3. 迭代模式：老功能也验一遍

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 10 <project-name>
```

---

## 第三步：交付验收

```
### 交付完成 🎉

产品：<name>
版本：v1.0.0-mvp

PRD 承诺 → 生产验证结果：
- [用户故事 1] → ✅ 已在生产环境验证可用
- [用户故事 2] → ✅ 已在生产环境验证可用

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

- **主动质疑，不被动接受**：每个阶段产出都要独立判断，不是"写完了就对了"
- **总监不动手**：发现问题通过 SendMessage 发回对应 Agent，不自行改代码
- **角色持久复用**：同一阶段 Agent 保持活跃，修复用 SendMessage 不新建
- **早发现，早干预**：PRD 阶段发现方向错误，比 dev 阶段便宜 10 倍
- **生产验证是终点**：headless 浏览器验证通过才算交付，不接受只 curl
