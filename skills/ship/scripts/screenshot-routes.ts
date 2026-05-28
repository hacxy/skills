#!/usr/bin/env bun
// screenshot-routes.ts <project-dir> <route1> [route2 ...]
// 对运行中的 dev server 和 design/ 原型各截图，供视觉审查 agent 对比
// 输出目录路径打印到最后一行 stdout

import { chromium } from 'playwright';
import { join, basename } from 'path';
import { mkdirSync, readdirSync, existsSync } from 'fs';

const projectDir = process.argv[2];
const routes = process.argv.slice(3);

if (!projectDir || routes.length === 0) {
  console.error('Usage: screenshot-routes.ts <project-dir> <route1> [route2 ...]');
  process.exit(1);
}

const outputDir = `/tmp/visual-review-${basename(projectDir)}-${Date.now()}`;
mkdirSync(join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'design'), { recursive: true });

const log = (msg: string) => console.error(`[screenshot] ${msg}`);

function routeToFilename(route: string): string {
  return route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '__');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 }); // mobile-first，与 UI Designer 一致

// 截图运行中的 app
log('截图 app 路由...');
for (const route of routes) {
  const url = `http://localhost:5173${route}`;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(800); // 等动画完成
    const filename = routeToFilename(route);
    const outPath = join(outputDir, 'app', `${filename}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    log(`app:${route} → ${filename}.png`);
  } catch (e) {
    log(`app:${route} 截图失败: ${e}`);
  }
}

// 截图 design/ 原型
const designDir = join(projectDir, 'design');
if (existsSync(designDir)) {
  log('截图 design/ 原型...');
  const htmlFiles = readdirSync(designDir).filter(f => f.endsWith('.html'));
  for (const htmlFile of htmlFiles) {
    const filePath = join(designDir, htmlFile);
    try {
      await page.goto(`file://${filePath}`, { waitUntil: 'networkidle', timeout: 8000 });
      await page.waitForTimeout(500);
      const name = htmlFile.replace('.html', '');
      const outPath = join(outputDir, 'design', `${name}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      log(`design/${htmlFile} → ${name}.png`);
    } catch (e) {
      log(`design/${htmlFile} 截图失败: ${e}`);
    }
  }
} else {
  log('design/ 目录不存在，跳过原型截图');
}

await browser.close();

log(`完成，截图保存至: ${outputDir}`);
log(`app/ 含实现截图，design/ 含原型截图`);

// 最后一行输出目录路径，供调用方捕获
console.log(outputDir);
