---
name: fe-project-init
description: 此 skill 应在用户说"初始化前端规范"、"为前端项目生成规范"、"生成前端 CLAUDE.md"、"帮我配置前端项目规范"、"分析前端项目"时使用。深度分析当前前端项目的实际代码，生成 CLAUDE.md 项目理解文档，并创建基于真实代码风格的 fe-best-practices skill（含分域 rules 文件）。
argument-hint: "（可选）额外约定说明，如：统一用 `cn()` 合并类名、禁止 barrel exports 等"
---

# fe-project-init

深度分析当前前端项目，生成两份文档：

1. `.claude/CLAUDE.md` — 项目理解文档（命令、架构、约定）
2. `.claude/skills/fe-best-practices/` — 基于项目真实代码风格的规范 skill，含分域 rules 文件

若 `$ARGUMENTS` 非空，将其作为额外约定补充写入对应章节。

---

## 阶段一：探索项目

### 1.1 并行读取配置文件

- `package.json`（依赖、脚本命令、项目名、描述）
- `tsconfig.json` / `tsconfig.app.json`（路径别名、严格模式配置）
- `vite.config.*` / `next.config.*` / `rsbuild.config.*`（构建工具、别名）
- `eslint.config.*` / `.eslintrc.*`（代码规范）
- `.env.example`（环境变量，若存在）
- 已有的 `.claude/CLAUDE.md`（若存在则备份并更新，不覆盖）

### 1.2 从 package.json 识别技术栈

读取 `dependencies` 和 `devDependencies`，对照以下表格识别各类技术：

| 类别 | 识别依赖（匹配到即确认） |
|------|--------------------------|
| **框架** | `react` / `vue` / `svelte` / `solid-js` / `@angular/core` |
| **框架版本** | 从版本号字段直接读取，如 `"react": "^19.0.0"` |
| **元框架** | `next` / `nuxt` / `@remix-run/react` / `gatsby` / `astro` |
| **路由** | `react-router-dom` / `@tanstack/react-router` / `wouter`（Vue/Nuxt 路由通常内置） |
| **状态管理** | `zustand` / `jotai` / `recoil` / `pinia` / `@reduxjs/toolkit` / `valtio` / `nanostores` |
| **数据获取** | `@tanstack/react-query` / `swr` / `apollo-client` / `@apollo/client` / `openapi-fetch` / `axios` |
| **表单** | `react-hook-form` / `formik` / `@tanstack/react-form` |
| **样式** | `tailwindcss` / `@tailwindcss/vite` / `styled-components` / `@emotion/react` / `unocss` |
| **CSS 工具** | `clsx` / `classnames` / `class-variance-authority` / `tailwind-merge` |
| **组件库** | `@radix-ui/react-*` / `shadcn` / `antd` / `@mui/material` / `@mantine/core` / `@chakra-ui/react` |
| **Schema 验证** | `zod` / `valibot` / `yup` / `@effect/schema` |
| **测试** | `vitest` / `jest` / `@testing-library/react` / `playwright` / `cypress` |
| **构建工具** | `vite` / `webpack` / `rspack` / `@rsbuild/core` / `turbopack`（Next.js 内置） |
| **包管理器** | 检查 `package-lock.json` / `yarn.lock` / `bun.lockb` / `pnpm-lock.yaml` 确认 |
| **运行时** | 检查 `engines` 字段，或 `.nvmrc` / `.node-version` / `bunfig.toml` |

**识别规则**：
- 只记录在 `dependencies` 或 `devDependencies` 中实际存在的依赖，不推测
- 版本号从字段值中提取（去掉 `^` `~` 前缀）
- 若某类别无匹配项，该类别在 CLAUDE.md 中省略，不写"无"或占位符

### 1.2 读取真实源码——每个域找 2–3 个代表性文件

使用 Glob 搜索并读取，目的是从实际代码中提取惯例，而非靠模板猜测：

| 域 | 搜索路径 |
|----|----------|
| 组件 | `src/components/**/*.tsx`, `src/app/**/*.tsx`, `src/pages/**/*.tsx` |
| 状态管理 | `src/store/**/*.ts`, `src/stores/**/*.ts`, `src/atoms/**/*.ts` |
| 网络请求 | `src/services/**/*.ts`, `src/api/**/*.ts`, `src/lib/**/*.ts` |
| 路由 | `src/router.*`, `src/routes/**`, `app/**/layout.tsx`, `app/**/page.tsx` |
| 错误处理 | `src/**/ErrorBoundary.*`, `src/**/error.*`, axios/fetch 拦截器文件 |
| 样式 | 有 className 的组件文件；若有 CSS Modules 则读 `*.module.css` |
| 类型定义 | `src/types/**/*.ts`, `src/interfaces/**/*.ts` |
| 测试 | `src/**/*.test.tsx`, `src/**/*.spec.ts`, `e2e/**`, `src/test-utils/**` |
| 目录结构 | 用 Glob 列出 `src/` 一级和二级目录 |

---

## 阶段二：分析代码惯例

从读取到的真实代码中，提取每个域的实际惯例。

**组件**：
- 函数声明方式（`function` vs 箭头函数）
- Props 类型定义位置（inline / 单独 interface / `type`）
- 导出方式（默认导出 / 具名导出）
- 文件内结构顺序（import → type → component → helper）

**状态管理**：
- 使用哪个库及版本
- store 文件的组织方式（单文件 / 按功能拆分）
- action 定义位置（store 内 / 组件内）
- selector 使用模式

**网络请求**：
- client 的创建和导出方式
- 请求函数的封装层（service 层 / hook 层 / 直接在组件）
- 错误处理模式（try/catch / `.catch()` / 结构化解构 `{ data, error }`）
- 响应类型来源（手写 / 生成 / 推断）

**样式**：
- 样式方案（Tailwind / CSS Modules / CSS-in-JS / 混合）
- className 合并工具（`cn` / `clsx` / `classnames` / 字符串拼接）
- 响应式断点写法
- 是否有设计系统组件库（shadcn/ui / Ant Design / etc.）

**TypeScript**：
- `interface` vs `type` 的使用偏好
- 泛型命名惯例（`T` / `TData` / 描述性名称）
- 是否使用 Zod / valibot 等 schema 验证
- 类型文件组织方式

**目录结构**：
- 目录命名规范（kebab-case / camelCase / PascalCase）
- 功能内聚 vs 类型内聚（`features/user/` vs `components/` + `hooks/` + `services/`）
- 公共导出是否使用 barrel (`index.ts`)

---

## 阶段三：生成 CLAUDE.md

**若 `.claude/CLAUDE.md` 已存在：**

1. 先备份原文件：
   ```bash
   cp .claude/CLAUDE.md .claude/CLAUDE.md.bak
   ```
2. 读取原文件全文，以其为基础进行更新：
   - 保留原有的准确内容和章节结构
   - 用阶段二分析结果修正过时信息（版本号、已变更的命令、不再使用的依赖）
   - 补充原文件缺少的章节（如原来没有 Architecture 或 Key Conventions）
   - 删除与当前代码/配置不符的内容
   - 保持原有的写作风格

**若 `.claude/CLAUDE.md` 不存在：**

读取 `references/claudemd-template.md`，按其模板结构和写作铁律从零创建。

---

## 阶段四：生成 fe-best-practices skill

创建 `.claude/skills/fe-best-practices/` 目录结构：

```
.claude/skills/fe-best-practices/
├── SKILL.md
└── rules/
    ├── component-patterns.md
    ├── state-management.md
    ├── api-calls.md
    ├── routing.md
    ├── error-handling.md
    ├── styling.md
    ├── typescript.md
    ├── directory-structure.md
    └── testing.md
```

读取参考指南：`references/rule-writing-guide.md`，了解每个 rule 文件的内容要求和格式规范。

### SKILL.md 要求

- `description` 中标注项目名称和框架，如：`此 skill 应在 React 开发时使用，提供 <PROJECT_NAME> 项目的代码风格规范。`
- `user-invocable: false`（由 Claude 自动触发，不需要用户手动调用）
- 正文列出技术栈摘要和所有 rules 文件的用途，供 Claude 决定何时读取哪个 rule

### rules/ 文件要求

每个 rule 文件必须基于阶段二提取的真实代码惯例生成，**不允许套用通用模板**。

每条规则包含三部分：
1. **规则描述**：做什么，一句话
2. **来自本项目的代码示例**：直接引用阶段一读到的真实代码
3. **❌ 反例**（若有对立写法）：说明什么是错误的写法

若某个域在项目中没有足够的代码证据，则在对应 rule 文件开头注明"当前项目代码样本不足，以下为推断"，并在完成报告中提示用户补充。

---

## 阶段五：完成报告

输出以下内容：

1. 已生成/更新的文件路径列表（若备份了 CLAUDE.md，注明备份路径 `.claude/CLAUDE.md.bak`）
2. 识别到的技术栈摘要
3. 各 rule 文件的信息来源说明（"基于 `src/store/user.ts` 等 X 个文件"）
4. 若有信息不足的域，注明哪个 rule 文件内容为推断，建议用户提供更多样本

---

## 参考资料

- **`references/claudemd-template.md`** — CLAUDE.md 的完整模板结构和写作铁律。在阶段三从零创建 CLAUDE.md 时读取。
- **`references/rule-writing-guide.md`** — 每个 rule 文件的内容要求、格式规范和示例。在阶段四生成 rules/ 文件前读取。
