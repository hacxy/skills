import zhCN from './zh-CN'
import en from './en'

export const locales = ['zh-CN', 'en'] as const
export type Locale = (typeof locales)[number]

type DeepWriteable<T> = { -readonly [K in keyof T]: T[K] extends object ? DeepWriteable<T[K]> : string }
export type Messages = DeepWriteable<typeof zhCN>

export const messages: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  en,
}
