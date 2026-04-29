# CLAUDE.md 模板

## 写作铁律

- 每一行内容必须能在 `package.json`、配置文件或源码中找到直接依据
- 无法确认的信息一律省略，不写"待补充"、"暂无"、"可能是"等占位语
- 版本号从 `package.json` 直接读取，不估算
- 章节若无内容可填，整个章节删除，不保留空标题
- 注释行（`<!-- ... -->`）在最终写入文件时全部删除

---

## 模板正文

```markdown
# Project Conventions

## Commands

| 命令 | 说明 |
|------|------|
| `<pm> run dev` | 启动开发服务器 |
| `<pm> run build` | 生产构建 |
| `<pm> run test` | 运行测试 |
| `<pm> run lint` | 代码检查 |

<!-- 替换 <pm> 为实际包管理器（npm / yarn / pnpm / bun） -->
<!-- 只列 package.json scripts 中实际存在的命令 -->
<!-- 若有其他重要命令（codegen、db:migrate、typecheck 等）一并列出 -->

## Stack

<!-- 只填从 package.json dependencies / devDependencies 中确认存在的项，未识别的行删除 -->

- **框架**：React 19 / Vue 3.5 / ...（含版本号）
- **元框架**：Next.js 15 / Nuxt 3 / Remix / ...（若有）
- **路由**：TanStack Router v1 / React Router v7 / ...（若非元框架内置路由）
- **状态管理**：Zustand 5 / Jotai 2 / Pinia 2 / ...
- **数据获取**：TanStack Query v5 / SWR 2 / openapi-fetch / ...
- **表单**：React Hook Form v7 / @tanstack/react-form / ...（若有）
- **样式**：TailwindCSS v4 / CSS Modules / styled-components / ...
- **组件库**：shadcn/ui / Ant Design 5 / Mantine 7 / ...（若有）
- **Schema 验证**：Zod v3 / valibot / ...（若有）
- **测试**：Vitest / Jest / @testing-library/react / Playwright / ...
- **构建**：Vite 6 / Rsbuild / Next.js Turbopack / ...
- **包管理器**：pnpm 9 / bun 1.x / npm / yarn（含版本号）
- **运行时要求**：Node.js >= 20 / Bun >= 1.x（仅在 engines 字段或 .nvmrc 有声明时填写）

## Architecture

<!-- 基于 src/ 目录扫描结果，2–4 句话描述项目的分层方式和目录组织逻辑 -->
<!-- 说明采用功能内聚还是类型内聚，以及各主要目录的职责 -->
<!-- 例如：
  项目采用功能内聚结构，每个业务模块在 src/features/ 下独立维护组件、hooks 和 service。
  公共 UI 组件在 src/components/ui/，全局状态在 src/store/，类型定义在 src/types/。
-->

## Path Aliases

<!-- 从 tsconfig.json paths 字段读取，只列实际存在的别名 -->
<!-- 若无路径别名配置，删除本章节 -->

| 别名 | 指向 |
|------|------|
| `@/*` | `src/*` |

## Environment Variables

<!-- 从 .env.example 读取，只列实际存在的变量，不列值，不猜测用途 -->
<!-- 若无 .env.example，删除本章节 -->

| 变量名 | 用途 |
|--------|------|
| `VITE_API_BASE_URL` | API 基础地址 |

## Key Conventions

<!-- 3–5 条项目特有的重要约定，必须有代码/配置依据 -->
<!-- 通用最佳实践（"写好测试"、"保持代码整洁"）不列在此处 -->
<!-- 重点列：特殊工具的使用规范、代码生成文件的更新方式、项目特有的禁忌 -->
<!-- 若无项目特有约定，删除本章节 -->
<!-- 示例（根据项目实际情况替换）：
- 使用 `cn()` 工具函数（来自 `src/lib/utils.ts`）合并 Tailwind 类名，禁止直接调用 `clsx`
- API 类型从 `src/services/schema.gen.ts` 自动生成，运行 `pnpm codegen:api` 更新，禁止手动修改
- 路由路径常量统一定义在 `src/routes/paths.ts`，组件内不硬编码路径字符串
-->
```
