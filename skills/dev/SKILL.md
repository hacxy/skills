---
name: dev
description: >
  根据 TDD 技术设计文档结构化实现功能代码，按「数据库 → 后端 API → 前端」顺序推进，
  每层完成后自检再进入下一层。是 write-tdd 和 scaffold-project 的下游、code-review 的上游。
  当用户说"开始开发"、"开始实现"、"按 TDD 写代码"、"实现功能"、"开始写代码"、
  "帮我实现"、"start dev"、"implement"、"开发这个功能"、"按设计文档开发"，
  或者已有 TDD 和项目结构想开始编码时，务必使用此 skill。
---

## 定位

```
write-prd → write-tdd → scaffold-project → write-tests → [dev] → code-review → test → deploy
```

dev 的职责是把 TDD 里的设计翻译成可运行的代码，同时让 write-tests 生成的测试从红变绿。
实现顺序固定：**数据库 Schema → 后端 API → 前端组件**，每层完成后自检，确保基础稳固再往上建。

## 第一步：获取上下文

按优先级读取以下文件，任意来源能提供足够信息即可继续：

1. `docs/tdd-*.md` — 最新 TDD，提取：技术栈、数据库表结构、API 接口列表、模块划分
2. `docs/prd-*.md` — 对应 PRD，提取：MVP 功能范围
3. 项目根目录的 `package.json` / 目录结构 — 了解已有脚手架和依赖
4. 用户在对话中提供的需求描述

**回退策略（不强制要求前序步骤）：**
- 无 TDD → 直接向用户询问：技术栈、需要实现哪些接口和页面
- 无脚手架（无 `package.json`）→ 询问用户是否需要先初始化项目，或直接在当前目录开始
- 无 PRD → 向用户确认 MVP 功能范围后继续

明确当前要实现的功能范围后，进入第二步。

## 第二步：制定实现计划

在开始写代码前，列出本次要实现的任务清单，按三层顺序排列：

```
### 实现计划

**第一层：数据库**
- [ ] 创建 [表名] 表 migration
- [ ] 验证 Schema 和 TDD 一致

**第二层：后端 API**
- [ ] [METHOD] /api/[path] — [说明]
- [ ] 错误处理和参数校验

**第三层：前端**
- [ ] [页面/组件名] — [说明]
- [ ] 与 API 联调
```

列出计划后，直接开始执行，不需要用户确认。

## 第三步：逐层实现

### 层一：数据库

- 根据 TDD 中的表结构定义，写 Drizzle schema（`src/db/schema.ts`）
- 在 `src/db/index.ts` 中用 `CREATE TABLE IF NOT EXISTS` 在连接时建表，**不依赖外部 migration 命令**
- 测试环境使用内存数据库（`new Database(':memory:')`），避免文件状态干扰测试

**完成后必须运行（不跳过）：**
```bash
bun test tests/unit/
```
若有失败，当层修复直到 0 fail 再继续。

### 层二：后端 API

按 TDD 中的接口列表逐一实现，每个接口包括：
- 路由定义（Elysia.js route，挂载到 `src/app.ts`）
- 参数校验（Elysia 类型系统或手动校验）
- 业务逻辑（调用 Model 层）
- 数据库操作（Model 层，Drizzle ORM，无裸 SQL）
- 错误处理（统一格式：`{ error: string, code: string }`，对应 4xx 状态码）
- 成功响应：**直接返回资源对象或数组，不要包一层 `{ data: T }`**。使用 Eden treaty 测试时，外层再加 `data` 会导致 `response.data.id` 变成 `undefined`，测试永远红

**完成后必须运行（不跳过）：**
```bash
bun test tests/api/
```
若有失败，**逐条阅读错误信息，修复对应路由或模型，再次运行**，循环直到 0 fail。
不允许在 API 测试仍有红灯的情况下声称"完成"。

### 层三：前端

按 TDD 中的模块划分实现页面和组件：
- 页面组件放 `src/pages/`，通用组件放 `src/components/`
- API 调用统一封装到 `src/services/`，不在组件内直接 fetch
- 状态管理使用 Zustand（全局状态）或 React useState（局部状态）
- 样式使用项目已有方案（Tailwind CSS 优先）

**自检标准：**
- 页面可正常渲染，无控制台报错
- API 联调通过，数据正常展示
- 表单校验和错误提示正常工作

## 第四步：完成报告

实现完成后输出：

```
### 实现完成

**已完成：**
- ✅ [功能1]
- ✅ [功能2]

**未实现（非 MVP 范围）：**
- ⏭ [功能3] — 计划 v1.1

**待处理：**
- ⚠️ [问题或待确认事项]

**下一步：** 运行 code-review 对本次改动进行代码审查
```

## 实现原则

- **测试通过才算完成**：`bun test tests/unit/ tests/api/` 必须 0 fail，这是唯一的完成标准，不是"我觉得实现完了"
- **测试-修复循环**：实现 → 运行测试 → 看错误信息 → 修复 → 再运行，不断循环直到全绿，不允许停在中途
- **MVP 优先**：只实现 PRD 中 MVP 标记为 ✅ 的功能，其余跳过并在完成报告中注明
- **参考最新文档**：遇到 API 用法不确定时，使用 `find-docs` skill 查询官方最新文档，不猜测
- **不过度设计**：按 TDD 实现，不自行添加 TDD 未定义的功能或抽象
- **数据库初始化**：测试环境用内存 SQLite，在 db/index.ts 建立连接时同步建表，不依赖外部迁移命令
- **服务器绑定**：`app.listen` 必须指定 `hostname: '0.0.0.0'`，否则容器/服务器内只绑 127.0.0.1，外部无法访问
  ```ts
  app.listen({ hostname: '0.0.0.0', port: Number(process.env.PORT) || 3000 }, ...)
  ```
