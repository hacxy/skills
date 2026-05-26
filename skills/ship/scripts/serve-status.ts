#!/usr/bin/env bun
/**
 * Workflow 状态看板服务
 * 状态文件存放于 ~/.workflow/<project>.json，不污染项目目录
 *
 * 用法: bun run serve-status.ts [--project <name>] [--port 4000]
 * 若不指定 project，自动使用当前目录名
 */

import { parseArgs } from 'node:util'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '4000' },
    project: { type: 'string' },
  },
  strict: false,
})

const PORT = Number(values.port) || 4000
const WORKFLOW_DIR = join(homedir(), '.workflow')
const PROJECT = values.project || basename(process.cwd())
const STATUS_FILE = join(WORKFLOW_DIR, `${PROJECT}.json`)

const HTML = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workflow Status</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e1e4e8; min-height: 100vh; padding: 2rem; }
    h1 { font-size: 1.25rem; font-weight: 600; color: #fff; margin-bottom: 0.25rem; }
    .meta { font-size: 0.8rem; color: #8b949e; margin-bottom: 2rem; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 1.5rem; max-width: 640px; }
    .progress-bar { height: 4px; background: #21262d; border-radius: 2px; margin: 1.5rem 0; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #388bfd, #58a6ff); border-radius: 2px; transition: width 0.5s ease; }
    .stage { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0; border-bottom: 1px solid #21262d; }
    .stage:last-child { border-bottom: none; }
    .icon { font-size: 1rem; width: 1.25rem; text-align: center; flex-shrink: 0; }
    .name { flex: 1; font-size: 0.875rem; color: #c9d1d9; }
    .name.done { color: #e1e4e8; }
    .name.in_progress { color: #58a6ff; font-weight: 600; }
    .name.failed { color: #f85149; }
    .duration { font-size: 0.75rem; color: #8b949e; font-variant-numeric: tabular-nums; min-width: 64px; text-align: right; }
    .badge { font-size: 0.68rem; padding: 0.15rem 0.5rem; border-radius: 20px; margin-left: 0.5rem; vertical-align: middle; }
    .badge.running { background: #1f3d6e; color: #58a6ff; animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .summary { display: flex; gap: 1.5rem; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid #30363d; font-size: 0.8rem; color: #8b949e; }
    .summary b { color: #e1e4e8; }
    .not-started { text-align: center; padding: 3rem; color: #8b949e; line-height: 1.8; }
    .foot { font-size: 0.7rem; color: #3d444d; text-align: right; margin-top: 0.5rem; max-width: 640px; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    const PROJECT = location.search ? new URLSearchParams(location.search).get('project') : null
    function fmtDur(s) {
      if (s == null) return '—'
      if (s < 60) return s + 's'
      if (s < 3600) return Math.floor(s/60) + 'm ' + String(s%60).padStart(2,'0') + 's'
      return Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'm'
    }
    function fmtTime(ts) { return ts ? new Date(ts*1000).toLocaleTimeString() : '' }
    const ICONS = { done:'✅', in_progress:'⏳', failed:'❌', pending:'⬜' }
    async function refresh() {
      const url = '/api/status' + (PROJECT ? '?project=' + PROJECT : '')
      try {
        const r = await fetch(url)
        render(r.ok ? await r.json() : null)
      } catch { render(null) }
    }
    function render(d) {
      const app = document.getElementById('app')
      if (!d) {
        app.innerHTML = '<div class="card"><div class="not-started">⬜ Workflow has not started yet.<br><small>Waiting for ' + (PROJECT||'project') + ' status...</small></div></div>'
        return
      }
      const now = Math.floor(Date.now()/1000)
      const elapsed = fmtDur(now - d.started_at)
      const done = d.stages.filter(s=>s.status==='done').length
      const total = d.stages.length
      const pct = Math.round(done/total*100)
      const rows = d.stages.map(s => {
        const dur = s.status === 'in_progress' ? fmtDur(now - s.started_at) : fmtDur(s.duration_s)
        const badge = s.status === 'in_progress' ? '<span class="badge running">⏺ running</span>' : ''
        const err = s.error ? ' <span style="color:#f85149;font-size:0.75rem">– ' + s.error + '</span>' : ''
        return '<div class="stage"><span class="icon">' + (ICONS[s.status]||'⬜') + '</span>' +
          '<span class="name ' + s.status + '">[' + s.id + '] ' + s.name + badge + err + '</span>' +
          '<span class="duration">' + dur + '</span></div>'
      }).join('')
      app.innerHTML = '<div class="card">' +
        '<h1>📋 ' + d.project + '</h1>' +
        '<div class="meta">Mode: ' + d.mode + ' &nbsp;│&nbsp; Started: ' + fmtTime(d.started_at) + ' &nbsp;│&nbsp; Elapsed: ' + elapsed + '</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        rows +
        '<div class="summary"><span>Progress: <b>' + done + ' / ' + total + '</b></span><span><b>' + pct + '%</b> complete</span></div>' +
        '</div><p class="foot">Auto-refreshes every 2s &nbsp;│&nbsp; ~/.workflow/' + d.project + '.json</p>'
    }
    refresh()
    setInterval(refresh, 2000)
  </script>
</body>
</html>`

const server = Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url)
    if (url.pathname === '/api/status') {
      const proj = url.searchParams.get('project') || PROJECT
      const file = join(WORKFLOW_DIR, `${proj}.json`)
      if (!existsSync(file)) {
        return new Response('null', { headers: { 'Content-Type': 'application/json' } })
      }
      try {
        return new Response(readFileSync(file, 'utf-8'), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        })
      }
      catch {
        return new Response('null', { headers: { 'Content-Type': 'application/json' } })
      }
    }
    return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  },
})

console.log(`\n  🔭 Workflow Status Dashboard`)
console.log(`  Project : ${PROJECT}`)
console.log(`  Status  : ${STATUS_FILE}`)
console.log(`  Open    : http://localhost:${PORT}`)
console.log(`  Ctrl+C to stop\n`)

try { Bun.spawnSync(['open', `http://localhost:${PORT}`]) } catch {}
