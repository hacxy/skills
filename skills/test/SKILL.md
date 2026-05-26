---
name: test
description: >
  为项目编写并运行测试，覆盖后端单元测试、API 接口测试和前端 E2E 测试三个层次，
  输出测试报告。是 code-review 的下游、deploy 的上游。
  当用户说"写测试"、"跑测试"、"单元测试"、"接口测试"、"E2E 测试"、"测试覆盖率"、
  "write tests"、"run tests"、"测试一下"、"帮我测试"、"测试这个功能"，
  或者开发完成想进入测试阶段时，务必使用此 skill。
---

## 定位

```
write-prd → write-tdd → scaffold-project → dev → code-review → [test] → deploy
```

test 的职责是在部署前验证功能正确性，按三个层次依次覆盖：
**后端单元测试 → API 接口测试 → 前端 E2E 测试**。

## 第一步：获取上下文

读取以下文件确定测试范围，任意来源能提供足够信息即可继续：

1. `docs/tdd-*.md` — 提取 API 接口列表、模块划分，作为测试用例的依据
2. `docs/prd-*.md` — 提取 MVP 功能范围，测试优先覆盖 MVP 标记为 ✅ 的功能
3. `package.json` — 确认项目已有的测试框架和脚本

**回退策略（不强制要求前序步骤）：**
- 无 TDD/PRD → 直接扫描 `src/` 目录中的源码，根据路由定义、接口文件和页面组件推断测试范围，并向用户确认
- 用户可以直接描述需要测试的功能，skill 根据描述制定测试计划

根据项目技术栈确定测试工具（均使用最新版本，参考官方文档）：

| 层次 | 工具 |
|------|------|
| 后端单元测试 | bun:test |
| API 接口测试 | Elysia 内置测试工具（`@elysiajs/testing`） |
| 前端 E2E 测试 | Playwright |

## 第二步：制定测试计划

列出本次要覆盖的测试用例，开始执行前展示给用户确认范围：

```
### 测试计划

**后端单元测试**
- [ ] [模块名] — [测试点]

**API 接口测试**
- [ ] [METHOD] /api/[path] — 正常流程
- [ ] [METHOD] /api/[path] — 异常/边界情况

**前端 E2E 测试**
- [ ] [页面/功能] — [用户操作路径]
```

## 第三步：逐层编写并运行测试

### 层一：后端单元测试

测试纯函数、工具方法、数据库 Model 层的核心逻辑。

测试文件放 `tests/unit/`，命名规则：`[模块名].test.ts`。

运行（已脚本化）：
```bash
bash "$SKILL_DIR/scripts/run-unit.sh"
```

**LLM 复核：** 若 `status: "failed"`，读取 `output` 字段分析失败原因并修复。

每个测试用例结构：
```ts
import { describe, it, expect } from 'bun:test'

describe('[模块名]', () => {
  it('[测试描述]', () => {
    // arrange
    // act
    // assert
    expect(result).toBe(expected)
  })
})
```

**自检标准：**
- 所有单元测试通过（0 failed）
- 核心业务逻辑覆盖率 > 80%

### 层二：API 接口测试

覆盖 TDD 中定义的每条接口，至少包含：正常请求 + 参数缺失 + 越权访问（如有鉴权）。

测试文件放 `tests/api/`，命名规则：`[resource].test.ts`。

运行（已脚本化）：
```bash
bash "$SKILL_DIR/scripts/run-api.sh"
```

**LLM 复核：** 若 `status: "failed"`，读取 `output` 字段分析失败原因并修复。

使用 Elysia 测试工具示例：
```ts
import { treaty } from '@elysiajs/eden'
import { app } from '../../src/app'

const api = treaty(app)

describe('POST /api/[resource]', () => {
  it('创建成功', async () => {
    const { data, error } = await api.[resource].post({ ... })
    expect(error).toBeNull()
    expect(data?.id).toBeDefined()
  })

  it('缺少必填字段时返回 400', async () => {
    const { error } = await api.[resource].post({})
    expect(error?.status).toBe(400)
  })
})
```

**自检标准：**
- 所有 TDD 中的接口均有对应测试
- 正常流程和至少一个异常场景均通过

### 层三：前端 E2E 测试

覆盖用户核心操作路径（从 PRD 用户故事提取），使用 Playwright。

测试文件放 `tests/e2e/`，命名规则：`[功能名].spec.ts`。

运行（已脚本化）：
```bash
bash "$SKILL_DIR/scripts/run-e2e.sh"
```

**LLM 复核：** 若 `status: "failed"`，读取 `output` 字段分析失败原因并修复。

测试用例结构：
```ts
import { test, expect } from '@playwright/test'

test('[用户故事描述]', async ({ page }) => {
  await page.goto('/')
  // 模拟用户操作
  await page.click('[data-testid="..."]')
  // 断言结果
  await expect(page.locator('...')).toBeVisible()
})
```

**自检标准：**
- MVP 核心用户路径全部通过
- 无控制台错误和未处理的网络请求失败

## 第四步：输出测试报告

```
### 测试报告

**后端单元测试**
- 通过：X / 总计：Y
- 覆盖率：Z%

**API 接口测试**
- 通过：X / 总计：Y
- 失败用例：[列出]

**前端 E2E 测试**
- 通过：X / 总计：Y
- 失败用例：[列出]

**整体结论**
- ✅ 测试全部通过，可进入部署阶段 → 运行 deploy
- ⚠️ 存在失败用例，需修复后重新测试（列出具体问题）
```

## 测试原则

- **测真实行为，不测实现细节**：测接口返回值和用户可见结果，不测内部实现细节
- **MVP 优先**：优先覆盖 PRD 中 MVP 标记 ✅ 的功能，非 MVP 功能可标注「待补充」
- **失败立即修复**：测试失败时，先定位问题根因并修复，再继续下一层
- **参考最新文档**：遇到框架 API 不确定时，使用 `find-docs` skill 查询官方最新文档
