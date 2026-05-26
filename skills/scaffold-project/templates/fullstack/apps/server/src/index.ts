import process from 'node:process'
import consola from 'consola'
import { app } from './app.js'

// Schema 同步说明：
// 开发时修改 db/schema.ts 后，运行 `bun db:push` 将 schema 推送到 SQLite
// 无需手动编写 migration 文件，drizzle-kit push 会自动处理

app.listen({
  hostname: '0.0.0.0',
  port: Number(process.env.PORT) || 3001,
}, ({ hostname, port }) => {
  consola.success(`Server running at http://${hostname}:${port}`)
})
