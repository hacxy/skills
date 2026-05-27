#!/usr/bin/env bun
/**
 * verify-browser.ts — Headless browser verification for ship workflow
 * harness 原则：浏览器验证是确定性检查，不需要 LLM 重复编写
 *
 * 用法：
 *   bun run "$SKILL_DIR/scripts/verify-browser.ts" <base-url> <route1> [route2] ...
 *
 * 示例：
 *   bun run verify-browser.ts http://localhost:5173 / /transactions /reports
 *   bun run verify-browser.ts http://localhost:3000 / /dashboard /accounts
 *
 * 退出码：0 = 全部通过，1 = 有路由失败
 */

import { chromium } from 'playwright'

const baseUrl = process.argv[2]
const routes = process.argv.slice(3)

if (!baseUrl || routes.length === 0) {
  console.error('用法: verify-browser.ts <base-url> <route1> [route2] ...')
  process.exit(2)
}

const browser = await chromium.launch({ headless: true })
let allPassed = true
const results: { route: string; errors: string[]; badMime: string[] }[] = []

for (const route of routes) {
  const page = await browser.newPage()
  const errors: string[] = []
  const badMime: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', err => errors.push(`[pageerror] ${err.message}`))
  page.on('response', res => {
    const url = res.url()
    const ct = res.headers()['content-type'] ?? ''
    if (url.includes('/assets/') && url.endsWith('.js') && !ct.includes('javascript'))
      badMime.push(`${url.split('/').pop()} → ${ct}`)
    if (url.includes('/assets/') && url.endsWith('.css') && !ct.includes('css'))
      badMime.push(`${url.split('/').pop()} → ${ct}`)
  })

  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForTimeout(500)
  } catch (e) {
    errors.push(`Navigation failed: ${(e as Error).message}`)
  }

  results.push({ route, errors, badMime })
  if (errors.length > 0 || badMime.length > 0) allPassed = false
  await page.close()
}

await browser.close()

// Report
console.log('\n=== Browser Verification ===')
for (const { route, errors, badMime } of results) {
  const ok = errors.length === 0 && badMime.length === 0
  console.log(`${ok ? '✅' : '❌'} ${route}`)
  errors.forEach(e => console.log(`   console.error: ${e.slice(0, 120)}`))
  badMime.forEach(m => console.log(`   bad MIME: ${m}`))
}
console.log(`\n${allPassed ? '✅ All routes passed' : '❌ Some routes failed'}`)
process.exit(allPassed ? 0 : 1)
