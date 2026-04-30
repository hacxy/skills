---
name: fe-i18n
description: 为前端项目集成多语言国际化（i18n）的完整工作流。当用户提到"国际化"、"多语言"、"i18n"、"添加中文/英文支持"、"语言切换"、"翻译"、"locale"、"l10n"，或者想让项目支持多种语言时，务必使用此 skill。支持 React、Next.js、Vue、Nuxt 等主流框架，自动检测项目类型并选择最合适的 i18n 方案，完成从安装依赖到改造现有组件的全流程集成。
---

# 前端多语言国际化集成

## 目标

将项目从硬编码文本迁移到 i18n 多语言体系，让项目支持按需扩展语言。整个过程分为五个阶段：检测项目、确认方案、安装配置、创建语言文件、改造组件。

---

## 阶段一：检测项目类型

首先读取 `package.json`，判断框架和现有 i18n 依赖：

| 框架特征 | 推荐方案 |
|---------|---------|
| `next` + App Router (`app/`) | `next-intl` |
| `next` + Pages Router | `next-i18next` 或 `next-intl` |
| `react`（非 Next.js） | `react-i18next` |
| `vue` / `nuxt` | `vue-i18n` |
| 无框架 / 其他 | `i18next` |

如果项目已安装 i18n 库，沿用现有方案，不重复安装。

---

## 阶段二：与用户确认

在动手之前，与用户确认以下信息（如果用户已经说明则跳过对应问题）：

1. **需要支持哪些语言？** 例如：中文（zh-CN）和英文（en）。默认语言由浏览器语言自动决定，如果浏览器语言不在支持列表中，则回退到列表中的第一个语言。
2. **翻译文件放在哪里？** 建议放 `src/locales/`（React）或 `locales/`（Next.js App Router），用户可以修改。
3. **现有组件需要迁移吗？** 还是只搭好骨架、用户自己处理？

---

## 阶段三：安装依赖和初始化配置

根据检测到的方案，执行对应的安装和配置。详细配置模板见参考文件：

- React + i18next → 读取 `references/react-i18next.md`
- Next.js App Router + next-intl → 读取 `references/next-intl.md`
- Vue / Nuxt + vue-i18n → 读取 `references/vue-i18n.md`

**安装时的重要原则：**
- 优先使用用户项目已有的包管理器（查看是否有 `pnpm-lock.yaml`、`yarn.lock` 或 `bun.lockb`）
- 安装完成后验证 `package.json` 中的依赖

---

## 阶段四：创建语言文件

使用 **TypeScript 模块格式**（`.ts`），而非 JSON，原因是 TS 格式有类型推导、IDE 补全，且能避免 JSON key 拼写错误。

### 目录结构示例

```
src/locales/
├── index.ts          # 导出和类型定义
├── zh-CN.ts          # 中文
└── en.ts             # 英文
```

### 语言文件格式

```typescript
// src/locales/zh-CN.ts
const messages = {
  common: {
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    loading: '加载中...',
  },
  nav: {
    home: '首页',
    about: '关于',
  },
} as const

export default messages
```

```typescript
// src/locales/en.ts
const messages = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    loading: 'Loading...',
  },
  nav: {
    home: 'Home',
    about: 'About',
  },
} as const

export default messages
```

```typescript
// src/locales/index.ts
import zhCN from './zh-CN'
import en from './en'

export const locales = ['zh-CN', 'en'] as const
export type Locale = typeof locales[number]
export type Messages = typeof zhCN

export const messages: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  en,
}
```

**键的命名规则：**
- 按功能模块分组（`common`、`nav`、`auth`、`dashboard` 等）
- 使用 camelCase
- 插值变量使用 `{variableName}` 格式，如 `'欢迎，{name}！'`

---

## 阶段五：改造现有组件中的硬编码文本

扫描组件文件，识别硬编码中文或英文字符串，用 `t()` 调用替换。

### 识别规则

需要替换的：JSX 中的字符串文字、`placeholder`、`title`、`aria-label` 等 prop 中的文字。

不需要替换的：CSS 类���、HTML 标签名、变量名、注释、URL、正则表达式。

### 改造示例

**改造前（React）：**
```tsx
export function LoginForm() {
  return (
    <form>
      <h1>登录</h1>
      <input placeholder="请输入邮箱" type="email" />
      <button type="submit">立即登录</button>
    </form>
  )
}
```

**改造后（React + react-i18next）：**
```tsx
import { useTranslation } from 'react-i18next'

export function LoginForm() {
  const { t } = useTranslation()
  return (
    <form>
      <h1>{t('auth.login.title')}</h1>
      <input placeholder={t('auth.login.emailPlaceholder')} type="email" />
      <button type="submit">{t('auth.login.submit')}</button>
    </form>
  )
}
```

同时将新增的 key 加入所有语言文件，保持各语言文件结构同步。

---

## 阶段六：添加语言切换组件

创建语言切换组件，集成到项目中，这是标准步骤，不需要询问用户是否需要。

**组件要求：**
- 展示所有支持的语言列表，高亮当前语言
- 切换后语言偏好持久化（localStorage），下次访问仍生效
- 组件文件放在 `src/components/LanguageSwitcher.tsx`（React）或对应路径

各框架的组件实现见对应参考文件中的"语言切换组件"部分。

创建组件后，在用户的根布局或导航组件中引用它，确保可以直接使用。

---

## 收尾检查

完成后，告知用户：
1. 已安装的依赖和配置文件路径
2. 语言文件位置和如何添加新翻译
3. 哪些组件已改造，哪些还需手动处理
4. 如何扩展支持新语言（添加 locale 文件 → 注册到 `index.ts` → 更新 `locales` 数组）
