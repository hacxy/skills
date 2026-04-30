import type { Messages } from '../locales'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: Messages
    }
  }
}
