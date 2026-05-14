import { randomBytes } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { $ } from 'bun'

const { values } = parseArgs({
  options: {
    template: { type: 'string', short: 't' },
    name: { type: 'string', short: 'n' },
    target: { type: 'string', short: 'd' },
  },
})

const template = values.template as 'fullstack' | 'frontend' | 'backend'
const projectName = values.name!
const templatesDir = join(import.meta.dir, '../templates')
const targetBase = values.target || '.'
const targetDir = join(targetBase, projectName)

if (!template || !projectName) {
  console.error('Usage: bun run scaffold.ts --template <fullstack|frontend|backend> --name <name> [--target <path>]')
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

function scaffoldFrontend(): void {
  console.log('Scaffolding frontend project...')
  const sourceDir = join(templatesDir, 'frontend')
  copyDirRecursive(sourceDir, targetDir)

  const pkg = readJson(join(targetDir, 'package.json'))
  pkg.name = projectName
  writeJson(join(targetDir, 'package.json'), pkg)

  copyEnvExample(targetDir)

  console.log('Frontend project scaffolded successfully!')
}

function scaffoldBackend(): void {
  console.log('Scaffolding backend project...')
  const sourceDir = join(templatesDir, 'backend')
  copyDirRecursive(sourceDir, targetDir)

  const pkg = readJson(join(targetDir, 'package.json'))
  pkg.name = projectName
  writeJson(join(targetDir, 'package.json'), pkg)

  copyEnvExample(targetDir)

  console.log('Backend project scaffolded successfully!')
}

console.log(`Template: ${template}`)
console.log(`Project name: ${projectName}`)
console.log(`Target: ${targetDir}`)
console.log('')

switch (template) {
  case 'fullstack':
    scaffoldFullstack()
    break
  case 'frontend':
    scaffoldFrontend()
    break
  case 'backend':
    scaffoldBackend()
    break
  default:
    console.error(`Unknown template: ${template}`)
    process.exit(1)
}

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
