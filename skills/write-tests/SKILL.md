---
name: write-tests
description: >
  根据 TDD 技术设计文档生成测试用例代码，在功能实现前建立测试骨架。
  覆盖单元测试、API 接口测试和 E2E 测试三个层次，输出可立即运行（初始为红）的测试文件，
  为 dev 阶段提供明确的实现目标。是 scaffold-project 的下游、dev 的上游。
  当用户说"写测试用例"、"生成测试"、"根据 TDD 写测试"、"先写测试"、"测试驱动开发"、
  "TDD 红阶段"、"write test cases"、"generate tests"、"tests from TDD"，
  或者想在开发前先建立测试框架时，务必使用此 skill。
---

## 定位

```
write-prd → write-tdd → scaffold-project → [write-tests] → dev → code-review → test → deploy
```

write-tests 的职责是把 TDD 中的接口设计和模块划分转化为测试代码，形成「红-绿-重构」
循环的**红阶段**——测试先行，dev 阶段让它们变绿。

## 第一步：获取上下文

按优先级读取：

1. `docs/tdd-*.md` — 提取：API 接口列表、数据库表、模块划分
2. `docs/prd-*.md` — 提取：MVP 功能范围和用户故事（用于 E2E 场景）
3. 用户对话描述（若以上文档均不存在）

**回退策略：**
- 无 TDD → 向用户询问需要测试的接口和功能
- 无 PRD → E2E 场景由用户描述或跳过

## 第二步：生成测试用例

按三个层次逐一生成测试文件。生成顺序：**单元测试 → API 测试 → E2E 测试**。

每生成一层立即写入文件，不等全部生成完再写。

**生成完所有测试文件后，必须执行依赖声明检查：**

```bash
# 检查测试文件中所有 import 的包是否在 package.json 中声明
grep -rh "^import" tests/ | grep "from '" | grep -oP "from '[^']+'" | sort -u
cat package.json | jq '.dependencies // {} | keys'
```

API 测试必须使用 `@elysiajs/eden`，若 `package.json` 中无此包，立即安装：
```bash
bun add @elysiajs/eden
```

**不允许留到运行时才发现缺包。**

---

### 层一：单元测试

**目标**：覆盖工具函数、数据校验逻辑、Model 层核心方法。

文件放 `tests/unit/`，命名：`[模块名].test.ts`。

从 TDD 模块划分中识别可单元测试的部分：
- `models/` 中的数据操作方法
- `middlewares/` 中的校验逻辑
- 工具函数和纯函数

每个测试文件结构：
```ts
import { describe, it, expect, beforeEach } from 'bun:test'

describe('[模块名]', () => {
  // 正常路径
  it('should [预期行为] when [条件]', () => {
    // arrange
    // act
    // assert
    expect(actual).toBe(expected)
  })

  // 边界/异常路径
  it('should throw when [异常条件]', () => {
    expect(() => fn(invalidInput)).toThrow()
  })
})
```

---

### 层二：API 接口测试

**目标**：覆盖 TDD 中定义的每条接口，每条接口至少三个用例：正常 + 参数缺失 + 越权（如有鉴权）。

文件放 `tests/api/`，命名：`[resource].test.ts`。

从 TDD API 列表逐一生成，使用 Elysia Eden treaty。

**路径适配：** 先确认项目结构再写 import：
- 标准结构（单体）：`import { app } from '../../src/app'`
- fullstack monorepo：`import { app } from '../../apps/server/src/app'`

```ts
import { treaty } from '@elysiajs/eden'
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../src/app'  // 根据实际项目结构调整路径

const api = treaty(app)

describe('[Resource] API', () => {
  describe('POST /api/[resource]', () => {
    it('创建成功，返回新记录', async () => {
      const { data, error } = await api.[resource].post({
        // 从 TDD 请求体定义填入合法参数
      })
      expect(error).toBeNull()
      expect(data?.id).toBeDefined()
    })

    it('缺少必填字段时返回 400', async () => {
      const { error } = await api.[resource].post({} as any)
      expect(error?.status).toBe(400)
    })
  })

  // 按 TDD 中的接口列表继续生成其他方法...
})
```

---

### 层三：E2E 测试

**目标**：覆盖 PRD 用户故事中的核心操作路径。

文件放 `tests/e2e/`，命名：`[功能名].spec.ts`。

**前置检查：** E2E 测试依赖 Playwright 配置文件。若项目根目录没有 `playwright.config.ts`，先生成：
```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
})
```

从 PRD 用户故事中提取操作路径，每条用户故事对应一个 test：

```ts
import { test, expect } from '@playwright/test'

// 用户故事：作为 [用户]，我希望 [做某事]，以便 [达到目的]
test('[用户故事标题]', async ({ page }) => {
  await page.goto('/')
  // 按用户故事步骤编写操作
  await page.getByRole('button', { name: '...' }).click()
  await expect(page.getByText('...')).toBeVisible()
})
```

---

## 第三步：输出清单

所有测试文件生成后，输出覆盖清单：

```
### 测试用例生成完成

**单元测试** tests/unit/
- [模块名].test.ts — X 个用例

**API 测试** tests/api/
- [resource].test.ts — X 个用例（覆盖 Y 条接口）

**E2E 测试** tests/e2e/
- [功能名].spec.ts — X 个场景

**当前状态：** 全部测试应为红（未实现），运行 dev 让它们变绿。

**下一步：** 运行 dev skill 实现功能代码。
```

## 生成原则

- **测试先于实现**：生成的测试基于 TDD 接口定义，不参考 src/ 已有实现（即使存在）
- **最小可失败**：每个测试用例应当精确——只测一件事，失败时能明确指出问题
- **MVP 覆盖优先**：从 PRD MVP 范围内的功能开始，非 MVP 功能的测试可标注 `// TODO: v1.1`
- **参数真实**：测试中的请求参数应符合 TDD 中定义的类型，不用 `any` 糊弄
