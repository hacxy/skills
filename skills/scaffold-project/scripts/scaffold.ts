import { randomBytes } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { $ } from 'bun'

const { values } = parseArgs({
  options: {
    name: { type: 'string', short: 'n' },
    target: { type: 'string', short: 'd' },
    // --template 保留为兼容参数，但忽略，始终使用 fullstack
    template: { type: 'string', short: 't' },
  },
})

const projectName = values.name!
const templatesDir = join(import.meta.dir, '../templates')
const targetBase = values.target || '.'
const targetDir = join(targetBase, projectName)

if (!projectName) {
  console.error('Usage: bun run scaffold.ts --name <project-name> [--target <path>]')
  process.exit(1)
}

if (existsSync(targetDir)) {
  console.error(`Error: Directory "${targetDir}" already exists.`)
  process.exit(1)
}

function copyDirRecursive(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true })
  const entries = readdirSync(src)
  for (const entry of entries) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath)
    }
    else {
      cpSync(srcPath, destPath)
    }
  }
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function writeJson(path: string, data: any): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
}

function copyEnvExample(dir: string): void {
  const examplePath = join(dir, '.env.example')
  const envPath = join(dir, '.env')
  if (existsSync(examplePath)) {
    let content = readFileSync(examplePath, 'utf-8')
    content = content.replace(/^(JWT_SECRET=)$/m, `$1${randomBytes(32).toString('hex')}`)
    writeFileSync(envPath, content)
  }
}

function scaffoldFullstack(): void {
  console.log('Scaffolding fullstack project...')
  const sourceDir = join(templatesDir, 'fullstack')
  copyDirRecursive(sourceDir, targetDir)

  const rootPkg = readJson(join(targetDir, 'package.json'))
  rootPkg.name = projectName
  const serverPkgName = `${projectName}-server`
  if (rootPkg.devDependencies?.server) {
    delete rootPkg.devDependencies.server
    rootPkg.devDependencies[serverPkgName] = 'workspace:*'
  }
  writeJson(join(targetDir, 'package.json'), rootPkg)

  const sharedPkgName = `@${projectName}/shared`
  const serverPkg = readJson(join(targetDir, 'apps/server/package.json'))
  serverPkg.name = serverPkgName
  if (serverPkg.dependencies?.['@repo/shared']) {
    delete serverPkg.dependencies['@repo/shared']
    serverPkg.dependencies[sharedPkgName] = 'workspace:*'
  }
  writeJson(join(targetDir, 'apps/server/package.json'), serverPkg)

  const webPkg = readJson(join(targetDir, 'apps/web/package.json'))
  webPkg.name = `${projectName}-web`
  webPkg.description = ''
  writeJson(join(targetDir, 'apps/web/package.json'), webPkg)

  const sharedPkg = readJson(join(targetDir, 'packages/shared/package.json'))
  sharedPkg.name = sharedPkgName
  writeJson(join(targetDir, 'packages/shared/package.json'), sharedPkg)

  copyEnvExample(join(targetDir, 'apps/server'))
  copyEnvExample(join(targetDir, 'apps/web'))

  console.log('Fullstack project scaffolded successfully!')
}

console.log(`Template: fullstack (only template)`)
console.log(`Project name: ${projectName}`)
console.log(`Target: ${targetDir}`)
console.log('')

scaffoldFullstack()

console.log('')
console.log('Initializing git...')
await $`git init`.cwd(targetDir).quiet()

console.log('Installing dependencies...')
await $`bun install`.cwd(targetDir)

console.log('Creating initial commit...')
await $`git add -A`.cwd(targetDir).quiet()
await $`git commit --no-verify -m "chore: init project from template"`.cwd(targetDir).quiet()

console.log('')
console.log(`Project created at: ${targetDir}`)
