# React + react-i18next 集成指南

## 安装

```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

## 初始化配置文件

创建 `src/i18n/config.ts`：

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { messages, locales } from '@/locales'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: Object.fromEntries(
      locales.map((locale) => [locale, { translation: messages[locale] }])
    ),
    fallbackLng: locales[0], // 所有支持语言都不匹配时的最终回退
    supportedLngs: locales,
    interpolation: {
      escapeValue: false, // React 已做 XSS 转义
    },
    detection: {
      // 检测顺序：先读用户上次选择（localStorage），再读浏览器语言
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n
```

**语言检测逻辑说明：**
- 首次访问：读取 `navigator.language`（浏览器语言），匹配 `supportedLngs` 列表；如不在列表中则使用 `fallbackLng`
- 再次访问：优先使用上次切换时存入 `localStorage` 的语言偏好

在应用入口（`src/main.tsx` 或 `src/index.tsx`）顶部导入：

```typescript
import '@/i18n/config'
```

## 在组件中使用

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <p>{t('common.save')}</p>
}
```

带插值：

```tsx
// 语言文件：{ greeting: '你好，{name}！' }
t('greeting', { name: 'Alice' })
```

## 语言切换组件

`i18n.changeLanguage()` 会自动将选择存入 localStorage，下次访问时自动恢复。

```tsx
import { useTranslation } from 'react-i18next'
import { locales } from '@/locales'

const localeLabels: Record<string, string> = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeLabels[locale] ?? locale}
        </option>
      ))}
    </select>
  )
}
```

## TypeScript 类型增强（可选，推荐）

在 `src/i18n/types.d.ts` 中添加，获得 `t()` 的键名自动补全：

```typescript
import type { Messages } from '@/locales'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: Messages
    }
  }
}
```
