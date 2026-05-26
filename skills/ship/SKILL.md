---
name: ship
description: >
  以项目总监视角交付产品——调度 10 个专业角色 Agent，确保产品逻辑闭环，在每个关键节点主动判断并干预。
  支持两种模式：（1）新项目——从零交付高质量 MVP 初版；（2）现有项目迭代——高质量交付迭代版本，已有功能不退化。
  内置工具链：状态看板、阶段回滚、生产回滚、工具健康检查、依赖预检。
  当用户说"ship"、"ship it"、"交付"、"发布产品"、"做一个新功能"、"端到端开发"、"全流程"、
  "一键开发上线"、"发一个版本"、"start ship"，或者想完整走一遍从需求到上线的开发流程时，务必使用此 skill。
---

## 角色分工

workflow 采用多 Agent 架构，每个阶段由对应角色的独立 Agent 执行，主 Agent（项目总监）全程监控并在关键节点介入。

| Agent | 角色 | 职责 |
|-------|------|------|
| **主 Agent** | 项目总监 | 监控全局，主动评估每阶段产出，发现问题立即介入，推动改进直到可交付 |
| Stage 1 | 产品经理 | 将需求转化为有价值、逻辑自洽的产品文档 |
| Stage 2 | 技术架构师 | 将产品需求翻译成可靠的技术方案 |
| Stage 3 | 项目工程师 | 初始化项目结构，确保开发环境就绪 |
| Stage 4 | UI 设计师 | 将页面规划转化为高质量视觉原型 |
| Stage 5 | 测试工程师 | 在实现前建立测试骨架，定义验收标准 |
| Stage 6 | 后端工程师 | 实现数据库和 API，让单元测试与接口测试全绿 |
| Stage 7 | 前端工程师 | 参照设计原型实现 React 页面，让 E2E 测试通过 |
| Stage 8 | 高级技术评审 | 审查代码质量和安全性 |
| Stage 9 | QA 工程师 | 运行全量测试，出具可信的测试报告 |
| Stage 10 | DevOps 工程师 | 部署到生产，确认服务可用 |

**阶段间通信通过文件完成**，不依赖对话上下文：

```
Stage 1  → docs/prd-*.md
Stage 2  → docs/tdd-*.md  
Stage 3  → apps/ 项目结构
Stage 4  → design/*.html
Stage 5  → tests/
Stage 6  → apps/server/src/（后端 API + 数据库）
Stage 7  → apps/web/src/（前端 React 页面）
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
```

初始化状态看板：
```bash
bash "$SKILL_DIR/scripts/update-status.sh" init <project-name> <new-project|iteration>
bun run "$SKILL_DIR/scripts/serve-status.ts" &
```

---

## 第二步：按阶段推进

每个阶段：①启动对应角色的子 Agent → ②监控执行过程 → ③读取产出评估质量 → ④通过则继续，不通过则推动改进。

---

### 阶段 1 — 产品经理：写 PRD

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 1 <project-name>
```

```
Agent(role=产品经理, skill=write-prd):
  你是一位有丰富 ToC 产品经验的产品经理。
  你的工作是把用户的需求描述转化为有价值、逻辑自洽的产品文档。
  你不会为了"写完文档"而写，你关心的是：这个产品是否真的解决了用户的问题？
  
  需求描述：<user-requirement>
  产出：<project-dir>/docs/prd-<name>-<date>.md
```

**总监评估**（读完 PRD 后主动判断）：

1. **产品价值**：描述的痛点是目标用户真实会遇到的吗？如果做完这个产品，用户生活/工作会有什么实质改变？
2. **MVP 范围**：标注为 ✅ 的功能里，去掉哪些核心价值仍在？超过 5 个通常意味着范围过大。
3. **逻辑闭环**：用户能用 MVP 功能完整完成一件事吗？有没有用户故事没有对应功能支撑？
4. **技术栈匹配**：面向普通用户的产品必须有 Web 前端，不能是纯 API。

**总监决策**：✅ 继续 / ⚠️ 指出问题，推动产品经理改进 / ❌ 方向错误，重新定义

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 1 <project-name>
```

---

### 阶段 2 — 技术架构师：写 TDD

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 2 <project-name>
```

```
Agent(role=技术架构师, skill=write-tdd):
  你是一位有 10 年经验的技术架构师，擅长为 Web 产品设计简洁可靠的技术方案。
  你看重的不只是"能实现"，而是"用最合适的方案实现"——过度设计和设计不足你都会指出。
  
  输入：<project-dir>/docs/prd-*.md
  产出：<project-dir>/docs/tdd-<name>-<date>.md
```

**总监评估**（对照 PRD 逐条核查）：

1. **覆盖完整性**：PRD 每条用户故事都有对应 API 吗？有没有多余的 API（PRD 里找不到对应故事）？
2. **数据模型**：Schema 能支撑所有 MVP 功能吗？字段类型和约束合理吗？
3. **有没有更优方案**：当前选型是"最熟悉的"还是"最合适的"？有没有过度引入复杂度？
4. **前后端连接**：开发时如何联调，生产时如何部署，TDD 里说清楚了吗？

**迭代模式额外**：新接口与已有接口是否冲突？数据库变更是否向前兼容？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 2 <project-name>
```

---

### 阶段 3 — 项目工程师：初始化项目

**仅新项目模式执行，迭代模式跳过。**

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 3 <project-name>
```

```
Agent(role=项目工程师, skill=scaffold-project):
  你负责把技术文档变成可以运行的项目骨架。
  你关心的是：项目结构是否和技术设计一致，开发环境是否顺畅启动。
  统一使用 fullstack 模板（React + Elysia.js + SQLite + Drizzle ORM）。
  
  输入：<project-dir>/docs/tdd-*.md（提取技术栈）
  产出：<target-dir>/<project-name>/ 可运行的项目
```

**总监评估**：项目能启动吗？目录结构与 TDD 一致吗？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 3 <project-name>
```

---

### 阶段 4 — UI 设计师：页面原型

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 4 <project-name>
```

```
Agent(role=UI设计师, skill=frontend-design):
  你是一位注重用户体验的 UI 设计师，擅长将功能需求转化为直观易用的界面。
  你不做"能用"的设计，你做"好用"的设计——信息层级清晰，操作路径简洁，视觉有质感。
  
  输入：
    - <project-dir>/docs/tdd-*.md（页面与路由章节）
    - <project-dir>/docs/prd-*.md（用户故事，决定每页要支持什么操作）
  产出：<project-dir>/design/ 目录，每个页面一个 HTML 原型文件
```

**总监评估**：

1. **覆盖完整**：TDD 里每个路由都有对应原型吗？
2. **操作直觉**：以用户身份浏览原型，核心操作能一眼找到吗？
3. **设计可用性**：表单字段、按钮文案、列表结构是否为 dev 提供了足够的视觉规格？
4. **迭代模式**：新功能的 UI 风格是否与已有页面一致？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 4 <project-name>
```

---

### 阶段 5 — 测试工程师：建立测试骨架

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 5 <project-name>
```

```
Agent(role=测试工程师, skill=write-tests):
  你是一位以用户视角思考的测试工程师。
  你写的测试不只是"接口能通"，而是"用户的需求有没有被满足"。
  每条 E2E 测试对应一条用户故事，不是一个接口。
  
  输入：
    - <project-dir>/docs/tdd-*.md（API 列表）
    - <project-dir>/docs/prd-*.md（用户故事）
    - <project-dir>/design/（UI 原型，参考按钮文案和表单结构）
  产出：
    - <project-dir>/tests/unit/（初始全过，纯逻辑）
    - <project-dir>/tests/api/（初始全红）
    - <project-dir>/tests/e2e/（E2E 场景）
```

**总监评估**：

1. 每条用户故事都有对应的 E2E 测试吗？
2. API 测试初始为红（有效），不是空壳（假绿）？
3. 测试文件的依赖（@elysiajs/eden 等）都在 package.json 里声明了吗？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 5 <project-name>
```

---

### 阶段 6 — 后端工程师：实现 API

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 6 <project-name>
```

```
Agent(role=后端工程师, skill=dev):
  你是一位专注于服务端的后端工程师，精通 Elysia.js + Drizzle ORM + SQLite。
  你的工作范围是 apps/server/——数据库 Schema、API 路由、业务逻辑、错误处理。
  你的完成标准：bun test tests/unit/ tests/api/ 全部通过（0 fail）。
  每实现一个接口就跑一遍 API 测试，红灯不往下走。
  你不碰前端代码，前端是另一个工程师的职责。
  
  输入：
    - <project-dir>/docs/tdd-*.md（API 设计、数据库 Schema）
    - <project-dir>/tests/unit/ 和 tests/api/（待通过的测试）
  产出：<project-dir>/apps/server/src/（数据库 + 路由 + 模型）
  工具：dev skill（后端部分）、find-docs skill（API 文档查询）
```

**总监评估**：
1. `bun test tests/unit/ tests/api/` 是否 0 fail？
2. 每个接口的参数校验是否覆盖必填字段和边界情况？
3. 错误响应格式是否统一（`{ error, code }`）？
4. **迭代模式**：已有 API 测试仍然全通？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 6 <project-name>
```

---

### 阶段 7 — 前端工程师：实现界面

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 7 <project-name>
```

```
Agent(role=前端工程师, skill=dev):
  你是一位专注于用户界面的前端工程师，精通 React + Vite + Zustand。
  你的工作范围是 apps/web/——页面组件、API 调用封装、状态管理、样式。
  你严格参照 design/ 目录的 HTML 原型实现，不自己发挥界面布局。
  你的完成标准：页面能渲染、核心路径走通、E2E 测试通过、无控制台报错。
  后端 API 已经由后端工程师实现完毕，你直接调用。
  
  输入：
    - <project-dir>/design/（视觉规格，严格参照）
    - <project-dir>/docs/tdd-*.md（API 接口文档，前后端连接方案）
    - <project-dir>/docs/prd-*.md（用户故事，每条故事对应一个操作路径）
    - <project-dir>/tests/e2e/（待通过的 E2E 测试）
  产出：<project-dir>/apps/web/src/（页面、组件、services）
  工具：dev skill（前端部分）、find-docs skill（React/Vite 文档查询）
```

**总监评估**：
1. 前端是否忠实还原了 design/ 原型，还是自己发挥了？
2. 核心用户路径（创建/查看/删除）在浏览器里实际走通了吗？
3. E2E 测试全部通过？
4. 有没有控制台报错或未处理的网络请求失败？

**干预**：界面与原型明显偏差 → 要求对齐；用户路径走不通 → 当场修复

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 7 <project-name>
```

---

### 阶段 8 — 高级技术评审：代码审查

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 8 <project-name>
```

```
Agent(role=高级技术评审, skill=code-review):
  你是代码质量的最后一道防线，同时审查前后端代码。
  你不只看规范，你看安全性、健壮性、前后端接口契约一致性。
  任何安全漏洞、数据丢失风险、明显性能隐患，一律不放行。
  
  输入：<project-dir>/apps/server/src/ 和 <project-dir>/apps/web/src/
  产出：代码审查报告（在对话中输出）
```

**总监评估**：Critical 全部清零。Warning 处理率 ≥ 80%。

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 8 <project-name>
```

---

### 阶段 9 — QA 工程师：测试验收

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 9 <project-name>
```

```
Agent(role=QA工程师, skill=test):
  你负责最终的质量验收，覆盖单元测试、API 测试、E2E 测试三个层次。
  你不接受"大部分通过"，你的标准是 0 fail。
  覆盖率要结合测试内容判断，空断言的 100% 毫无价值。
  
  输入：<project-dir>/tests/（unit/ + api/ + e2e/）
  产出：分层测试报告（在对话中输出）
```

**总监评估**：0 fail。迭代模式：有没有与本次迭代无关但意外失败的测试？

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 9 <project-name>
```

---

### 阶段 10 — DevOps 工程师：部署上线

```bash
bash "$SKILL_DIR/scripts/update-status.sh" start 10 <project-name>
```

```
Agent(role=DevOps工程师, skill=deploy):
  你负责把产品安全送到生产环境并确认真实可用。
  部署成功不是终点——浏览器能访问、API 正常响应、数据持久化，才算完成。
  
  输入：<project-dir>/（完整项目）
  产出：可访问的生产 URL
```

**总监评估**（真实浏览器，生产环境）：
1. 打开 URL，页面正常加载
2. 按 PRD 用户故事逐条操作，每条都能完成
3. **迭代模式**：老功能在生产环境也验一遍

```bash
bash "$SKILL_DIR/scripts/update-status.sh" done 10 <project-name>
```

---

## 第三步：交付验收

总监以 PRD 为标准做最终交叉验证：

```
### 交付完成 🎉

产品：<name>
版本：v1.0.0-mvp / v{n}

PRD 承诺 → 生产验证结果：
- [用户故事 1] → ✅ 已在生产环境验证可用
- [用户故事 2] → ✅ 已在生产环境验证可用

访问地址：https://your-domain.com
```

---

## 回滚机制

### 阶段级回滚（开发过程中）

每个阶段 `done` 时，`update-status.sh` 自动创建 git checkpoint commit 并记录 hash。需要回退时：

```bash
# 回滚到阶段 N 完成时的状态（git reset + 后续阶段状态重置为 pending）
bash "$SKILL_DIR/scripts/update-status.sh" rollback <stage_id> <project-name>
```

回滚后：
- 代码库回到该阶段的 git 状态
- 状态看板中该阶段之后的所有阶段重置为 pending
- 可以从该阶段重新往下推进

**典型场景**：前端工程师（Stage 7）发现后端 API 设计有根本性问题 → 总监介入 → 回滚到 Stage 6（后端工程师完成时）→ 后端工程师重新工作。

### 生产级回滚（部署之后）

deploy 阶段在上传新版本前，自动将当前版本备份为 `server-prev`。出现问题时：

```bash
# 一键回滚到上一个生产版本
bash "$SKILL_DIR/scripts/rollback-deploy.sh" <project-name>
```

回滚操作：停止当前进程 → 恢复 `server-prev` → 重启 → 验证服务健康。

**总监判断回滚时机**：
- 部署后浏览器无法访问 → 立即回滚，不等
- 核心功能异常但页面能打开 → 评估严重程度，严重则回滚，否则热修复
- 性能下降但功能正常 → 记录问题，计划下次发布修复，不回滚

---

## 总监的干预机制

干预不是叫停，是**参与改进，直到产出达到可交付标准**。

**干预工作方式**：
1. 发现问题 → 说清楚是什么问题，影响是什么
2. 提出改进方向 → 给出具体可操作的建议
3. 推动子 Agent 重新工作 → 针对问题点改进，局部或整体
4. 验证改进结果 → 不合格继续改，合格才往下走

| 情况 | 处理方式 |
|------|---------|
| 产出缺少关键内容 | 推动当前角色补充完善 |
| 产出方向对但细节有问题 | 指出具体问题，推动局部修改 |
| 产出方向有根本问题 | 说明为什么不对，重新生成 |
| 当前阶段发现上游错误 | 回到上游角色修正，再重新推进 |
| 产品方向根本错误 | 暂停，向用户说明，等待方向确认 |

---

## 总监原则

- **主动质疑，不被动接受**：每个阶段产出都要独立判断，不是"写完了就对了"
- **每个角色做自己的事**：产品经理不做架构决策，工程师不做产品决策，总监不做执行工作
- **早发现，早干预**：PRD 阶段发现方向错误，比 dev 阶段便宜 10 倍
- **产品逻辑优先于技术完整性**：技术 100% 但产品逻辑不自洽，等于零
- **生产验证是终点**：CI 通过不算交付，用户在生产环境能用才算交付
