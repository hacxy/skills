# Rule 文件编写指南

每个 rule 文件的目标：让 Claude 在该项目中开发时，能做出和项目已有代码**完全一致**的决策。

规则必须来自真实代码分析，不套用通用最佳实践模板。

---

## 文件格式规范

每个 rule 文件的结构：

```markdown
# [域名] 规范

> 基于 `src/path/to/file.ts` 等 N 个文件分析得出。

## 概述

一句话描述本项目在该域的核心方案选择。

## 规则

### [规则名称]

[规则描述，一句话，祈使句形式]

**✅ 本项目的写法：**
​```ts
// 示例 1：来自 src/actual/file.ts 的真实代码
​```
​```ts
// 示例 2：另一个真实用例
​```
​```ts
// 示例 3：边界情况或变体写法
​```

**❌ 不要这样写：**
​```ts
// 反例 1：最常见的错误写法
​```
​```ts
// 反例 2：另一种错误写法（不同场景）
​```
​```ts
// 反例 3：容易混淆的错误写法
​```
```

**每条规则的正反例数量要求**：
- 正例（✅）：至少 3 条，覆盖典型用法、变体和边界情况
- 反例（❌）：至少 3 条，覆盖最常见错误、不同场景的错误写法、容易混淆的写法
- 示例代码必须来自项目真实代码（可适当简化），不允许伪造

---

## 各 Rule 文件的内容要求

### component-patterns.md

从组件文件中提取并描述：

- **函数声明方式**：项目用 `function Comp()` 还是 `const Comp = () =>`？引用真实组件代码
- **Props 类型定义**：inline / 单独 interface / `type`？定义在哪里（组件上方 / 同文件末尾 / 单独文件）？
- **导出方式**：默认导出还是具名导出？两者混用时的规则是什么？
- **文件内结构顺序**：import、类型、组件函数、子组件、工具函数的顺序
- **条件渲染**：`&&` 还是三元？有无 `0 &&` 的保护写法？
- **组件拆分粒度**：从实际组件大小推断项目的拆分习惯

### state-management.md

从 store/atoms 文件中提取并描述：

- **store 文件组织**：单一 store 还是按功能拆分？文件命名规律？
- **action 定义位置**：store 内部还是组件内直接操作？
- **selector 使用模式**：细粒度选择器还是整体订阅？有无封装的 selector hooks？
- **store 访问方式**：直接 `useStore()` 还是封装后的自定义 hook？
- **异步 action 处理**：在 store 内 async 还是在组件/hook 内处理后再写入 store？

引用真实的 store 文件片段作为示例。

### api-calls.md

从 services/api/hooks 文件中提取并描述：

- **client 创建方式**：如何初始化（axios instance / openapi-fetch / fetch wrapper）？从哪个路径导入？
- **请求封装层**：是否有 service 层？service 函数的签名格式（参数、返回类型）？
- **错误处理模式**：try/catch / `.catch()` / 解构 `{ data, error }` / 统一错误拦截？
- **响应类型**：手写类型 / 从生成文件导入 / 推断？类型命名规律？
- **loading/error 状态管理**：在 hook 内 / TanStack Query / SWR / 手动 useState？
- **请求取消**：是否有 AbortController 或 cleanup 模式？

引用真实的 API 调用代码作为示例。

### styling.md

从有样式的组件文件中提取并描述：

- **主要样式方案**：Tailwind / CSS Modules / styled-components / 混合？
- **className 合并工具**：`cn()` / `clsx()` / `classnames()` / 字符串拼接？从哪里导入？
- **Tailwind 使用惯例**（若有）：
  - className 的书写顺序（有无 prettier-plugin-tailwindcss？）
  - 变体类名的组织方式（对象字面量 / `cva` / 直接内联？）
  - 响应式写法（mobile-first 还是 desktop-first？）
- **CSS Modules 惯例**（若有）：类名命名风格、文件与组件的对应关系
- **设计系统组件库**（若有）：shadcn/ui / Radix / Ant Design 的使用方式和覆盖样式的方法
- **动态样式**：根据 prop 变化样式的模式（三元 / 对象映射 / `data-*` 属性）

### typescript.md

从类型文件和源码中提取并描述：

- **`interface` vs `type`**：项目偏好哪种？各用在什么场景？
- **泛型命名**：单字母 `T` 还是描述性名称（`TData`、`TResponse`）？
- **类型文件组织**：集中在 `src/types/` 还是与模块并置？barrel export 还是直接导入？
- **工具类型使用**：常用哪些内置工具类型（`Pick`、`Omit`、`Partial`）？有无自定义工具类型？
- **Schema 验证**：是否使用 Zod / valibot / yup？schema 文件位置和命名？
- **`as` 类型断言**：是否有使用？在什么场景下被接受？
- **严格模式**：`strict: true` 是否开启？有无 `noUncheckedIndexedAccess` 等额外配置？

### directory-structure.md

从目录扫描结果中提取并描述：

- **目录命名规范**：kebab-case / camelCase / PascalCase（不同层级可能不同）
- **组织方式**：
  - 功能内聚（`features/user/components/UserCard.tsx`）
  - 类型内聚（`components/UserCard.tsx` + `hooks/useUser.ts` + `services/user.ts`）
  - 或混合
- **组件目录结构**：单文件 (`UserCard.tsx`) 还是目录 (`UserCard/index.tsx` + `UserCard.test.tsx`)?
- **Barrel exports**：是否使用 `index.ts` 聚合导出？哪些层级使用？
- **路径别名**：`tsconfig.json` 中的别名配置（`@/` 指向哪里？有无其他别名？）
- **测试文件位置**：与源码并置 (`*.test.tsx`) 还是集中在 `__tests__/` 或 `test/`？
- **特殊目录约定**：`_components/`（内部组件）、`(group)/`（Next.js 路由分组）等项目特有规则

### routing.md

搜索路由配置文件和路由相关代码（`src/router.*`, `src/routes/**`, `app/` 目录、`pages/` 目录），提取并描述：

- **路由方案**：文件系统路由（Next.js App Router / Pages Router / Remix）还是配置式路由（TanStack Router / React Router）？
- **路由文件组织**：路由配置集中在哪里？路由常量是否单独管理（`src/routes/paths.ts`）？
- **懒加载方式**：路由级代码分割用 `React.lazy` / `import()` / 框架内置？统一在路由配置处还是分散在各模块？
- **路由守卫/鉴权**：受保护路由的实现模式（HOC 包裹 / Layout 组件 / loader 函数 / middleware）？
- **导航方式**：`useNavigate` / `router.push` / `<Link>` 的使用场景区分？编程式导航是否有封装？
- **动态参数处理**：路由参数的类型定义和获取方式（`useParams` / `useSearch` / `loader` 参数）？
- **面包屑 / 标题**：路由元信息（meta）的定义和使用方式？

引用真实的路由配置代码作为示例。若为 Next.js App Router，重点描述 `layout.tsx` / `page.tsx` / `loading.tsx` / `error.tsx` 的约定。

### error-handling.md

搜索错误处理相关代码（Error Boundary 组件、toast/notification 调用、全局错误拦截、`try/catch` 模式），提取并描述：

- **Error Boundary 使用**：是否使用 Error Boundary？粒度如何（全局 / 路由级 / 组件级）？用自定义实现还是 `react-error-boundary`？
- **Toast/通知方案**：用哪个库（`sonner` / `react-hot-toast` / `antd message` / 自定义）？从哪里导入和调用？不同类型（success / error / loading）的调用方式？
- **API 错误的统一处理**：是否有全局拦截器（axios interceptor / fetch wrapper）？拦截器做了什么（token 刷新 / 统一 toast / 跳转登录页）？
- **组件内错误状态**：loading / error / empty 三态的 UI 模式（条件渲染 / 独立组件 / hooks 返回值解构）？
- **表单校验错误**：校验错误的展示位置和方式（字段下方 / 汇总 / tooltip）？
- **错误日志**：是否有错误上报（Sentry / 自定义 logger）？在什么层级捕获并上报？
- **404 / 500 页面**：错误页的路由和渲染方式？

引用真实的错误处理代码（拦截器、Error Boundary、toast 调用）作为示例。

### testing.md

搜索测试文件（`*.test.ts`, `*.test.tsx`, `*.spec.ts`, `e2e/**`），提取并描述：

- **测试分层**：有哪些测试类型（单元 / 组件 / 集成 / E2E）？各自使用什么工具？
- **测试文件位置和命名**：与源码并置还是集中目录？文件后缀（`.test.` / `.spec.`）？
- **组件测试方式**：用 `@testing-library/react` 还是 Enzyme 还是 Storybook？渲染和断言的惯用写法？
- **Mock 策略**：
  - API Mock：用 MSW（`src/mocks/`）/ `vi.mock` / `jest.mock`？fixture 数据放哪里？
  - 模块 Mock：哪些模块会被 mock（router / store / 第三方库）？mock 的写法惯例？
- **测试工具函数**：是否有自定义 render wrapper（带 Provider / Router）？放在哪里（`src/test-utils/` / `src/setupTests.ts`）？
- **断言风格**：`expect(el).toBeInTheDocument()` 还是其他断言库？有无自定义 matcher？
- **覆盖率要求**：是否有 coverage threshold 配置（`vitest.config.ts` 或 `jest.config.ts`）？
- **E2E 惯例**（若有 Playwright/Cypress）：Page Object Model 的组织方式？fixture 和 seed 数据的准备方式？

引用真实的测试文件片段作为示例，尤其是 custom render、MSW handler、典型组件测试的惯用结构。

---

## 编写原则

**基于证据**：每条规则必须能在阶段一读取的代码中找到依据，不允许凭感觉或通用最佳实践填充。

**用真实代码作示例**：示例代码从项目中直接引用（可简化），标注来源文件。

**规则要可操作**：描述应足够具体，让 Claude 在写新代码时能直接照做，不产生歧义。

**标注推断**：若某条规则是从少量样本推断的，加注 `（推断，样本不足）`。

**保持精简**：每个 rule 文件控制在 100–200 行，只写该项目真正有的惯例。
