import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  markdown: false,
  node: true,
  ignores: [
    'docs/**',
    'drizzle/**',
    '*.md',
  ],
})
