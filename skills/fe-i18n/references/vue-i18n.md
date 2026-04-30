# Vue / Nuxt + vue-i18n 集成指南

## 安装

**Vue 3（Vite）：**
```bash
npm install vue-i18n@10
```

**Nuxt 3：**
```bash
npm install @nuxtjs/i18n
```

## Vue 3 配置

创建 `src/i18n/index.ts`：

```typescript
import { createI18n } from 'vue-i18n'
import { messages, locales } from '@/locales'
import type { Messages } from '@/locales'

function detectLocale(): string {
  // 优先读取上次用户选择，其次读取浏览器语言
  const saved = localStorage.getItem('locale')
  if (saved && locales.includes(saved as typeof locales[number])) return saved

  const browserLang = navigator.language
  // 精确匹配（如 'zh-CN'）或语言前缀匹配（如 'zh' 匹配 'zh-CN'）
  return (
    locales.find((l) => l === browserLang) ??
    locales.find((l) => l.startsWith(browserLang.split('-')[0])) ??
    locales[0]
  )
}

export const i18n = createI18n<[Messages], typeof locales[number]>({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: locales[0],
  messages,
})
```

在 `main.ts` 中注册：

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import { i18n } from './i18n'

createApp(App).use(i18n).mount('#app')
```

## Nuxt 3 配置

`nuxt.config.ts`：

```typescript
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: {
    locales: [
      { code: 'zh-CN', name: '中文' },
      { code: 'en', name: 'English' },
    ],
    defaultLocale: 'zh-CN',
    vueI18n: './i18n/config.ts',
  },
})
```

`i18n/config.ts`：

```typescript
import { messages } from '@/locales'

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'zh-CN',
  messages,
}))
```

## 在组件中使用

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <button>{{ t('common.save') }}</button>
  <p>{{ t('greeting', { name: 'Alice' }) }}</p>
</template>
```

## 语言切换组件

**Vue 3：** 切换后写入 localStorage，下次访问时 `detectLocale()` 会优先读取。

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { locales } from '@/locales'

const { locale } = useI18n()

const localeLabels: Record<string, string> = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
}

function changeLocale(value: string) {
  locale.value = value
  localStorage.setItem('locale', value)
}
</script>

<template>
  <select :value="locale" @change="changeLocale(($event.target as HTMLSelectElement).value)">
    <option v-for="l in locales" :key="l" :value="l">
      {{ localeLabels[l] ?? l }}
    </option>
  </select>
</template>
```

**Nuxt 3：** `@nuxtjs/i18n` 内置 cookie 持久化，`setLocale()` 会自动处理，不需要手动操作 localStorage。

```vue
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const localeLabels: Record<string, string> = {
  'zh-CN': '中文',
  en: 'English',
  ja: '日本語',
}
</script>

<template>
  <select :value="locale" @change="setLocale(($event.target as HTMLSelectElement).value)">
    <option v-for="l in locales" :key="(l as any).code" :value="(l as any).code">
      {{ localeLabels[(l as any).code] ?? (l as any).code }}
    </option>
  </select>
</template>
```
