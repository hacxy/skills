import process from 'node:process'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema.js'

// 测试环境使用内存数据库，生产/开发使用文件数据库
const isTest = !process.env.DATABASE_URL
const dbPath = isTest
  ? ':memory:'
  : process.env.DATABASE_URL!.replace(/^file:/, '')

const sqlite = new Database(dbPath)
sqlite.run('PRAGMA journal_mode=WAL;')

// Drizzle 实例：使用 schema 提供类型安全的查询
// 修改 schema.ts 后运行 `bun db:push` 同步到数据库
export const db = drizzle(sqlite, { schema })
