# Next.js App Router + next-intl 集成指南

## 安装

```bash
npm install next-intl
```

## 目录结构

```
├── messages/          # 语言文件（next-intl 的默认约定）
│   ├── zh-CN.ts
│   └── en.ts
├── i18n/
│   ├── config.ts      # 语言列表和请求配置
│   └── routing.ts     # 路由配置
├── middleware.ts
└── app/
    └── [locale]/      # 所有路由包裹在 [locale] 动态段中
        └── layout.tsx
```

## 配置文件

`i18n/routing.ts`：

```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  // localeDetection 默认为 true：middleware 会读�� Accept-Language 请求头
  // 自动将首次访客重定向到最匹配的语言路由
})
```

`i18n/config.ts`：

```typescript
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { messages } from '@/locales'
import type { Locale } from '@/locales'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }
  return {
    locale,
    messages: messages[locale as Locale],
  }
})
```

`middleware.ts`（项目根目录）：

```typescript
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

`next.config.ts` 中添加插件：

```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/config.ts')

export default withNextIntl({
  // 其他 Next.js 配置
})
```

`app/[locale]/layout.tsx`：

```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import type { Locale } from '@/locales'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }
  const messages = await getMessages()
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

## 在组件中使用

Server Component：

```tsx
import { getTranslations } from 'next-intl/server'

export default async function Page() {
  const t = await getTranslations()
  return <h1>{t('nav.home')}</h1>
}
```

Client Component：

```tsx
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations()
  return <p>{t('common.save')}</p>
}
```

## 语言切换组件（Client Component）

next-intl 的语言切换通过改变 URL 中的 locale 段实现，middleware 会将用户的选择写入 cookie（`NEXT_LOCALE`），下次访问时自动读取，不需要手动操作 localStorage。

使用 `next-intl/navigation` 的 `useRouter`（不是 `next/navigation`），它的 `replace()` 支持 `locale` 参数，路径切换更可靠。

```tsx
'use client'
import { useRouter, usePathname } from 'next-intl/navigation'
import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

const localeLabels: Record<string, string> = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
}

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  return (
    <select
      value={currentLocale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
    >
      {routing.locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeLabels[locale] ?? locale}
        </option>
      ))}
    </select>
  )
}
```
