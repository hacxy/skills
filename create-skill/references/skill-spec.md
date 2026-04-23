# Skill 规范详细参考

在需要查阅字段规范细节、description 编写指南或排查触发问题时参考本文件。

---

## 一、Frontmatter 字段完整说明

| 字段 | 类型 | 是否必需 | 说明 |
|------|------|----------|------|
| `name` | string | 否（默认用目录名） | skill 标识符，即 `/skill-name` 中的名称。规则：小写字母、数字、连字符，最长 64 字符 |
| `description` | string | 推荐 | 第三人称描述，含具体触发短语。Claude 用此决定何时自动触发 skill |
| `argument-hint` | string | 否 | 自动补全提示文字，显示在 `/skill-name` 后面 |
| `disable-model-invocation` | boolean | 否 | `true` 时禁止 Claude 自动触发，仅支持用户手动 `/skill-name` 调用。默认 `false` |
| `user-invocable` | boolean | 否 | `false` 时不显示在 `/` 菜单，仅 Claude 自动触发。默认 `true` |
| `compatibility` | string | 否 | 兼容性声明 |
| `license` | string | 否 | 许可证信息 |
| `metadata` | object | 否 | 自定义元数据 |

---

## 二、description 编写深度指南

### 核心规则

description 决定 skill 的触发准确率，是最重要的字段。

**必须：**
- 使用第三人称（"此 skill 应在用户...时使用" 或 "This skill should be used when..."）
- 包含用户实际会说的具体短语，用引号标注
- 语言不限（中文、英文、混合均可）

**避免：**
- 第一/第二人称："使用此 skill 来..." / "Use this skill when you..."
- 模糊描述："用于 skill 相关工作" —— 没有具体触发短语

### 触发短语数量建议

- 最少：2–3 个具体短语
- 推荐：4–6 个，覆盖不同说法
- 混合中英文：对中文用户有效，避免只说英文时 undertrigger

### 示例对比

**差的 description：**
```yaml
description: 用于创建 skill 的工具。
```
问题：没有具体触发短语，Claude 无法判断何时使用。

**好的 description：**
```yaml
description: 此 skill 应在用户说"创建 skill"、"新建一个 skill"、"帮我做个 skill"、"create a skill"，或希望将工作流打包成可复用 skill 时使用。
```

---

## 三、渐进式披露设计原则

Skill 采用三层加载机制，按需消耗上下文：

| 层级 | 内容 | 何时加载 | 大小限制 |
|------|------|----------|----------|
| 元数据 | name + description | 始终在上下文中 | ~100 词 |
| SKILL.md 正文 | 核心工作流和指令 | skill 触发时 | 目标 1,500–2,000 词，最多 5,000 词 |
| 支撑资源 | references/、scripts/、examples/ | Claude 判断需要时 | 不限 |

**实践原则：**
- SKILL.md 放核心流程和快速参考
- 详细规范、完整 API 文档、大量示例 → 移入 `references/`
- 可执行脚本 → 放入 `scripts/`，可不加载到上下文直接执行
- 模板/资产文件 → 放入 `assets/`，不加载上下文

---

## 四、$ARGUMENTS 使用模式

### 基本用法

```markdown
根据 `$ARGUMENTS` 中的描述，执行...
```

用户调用 `/skill-name foo bar` 时，`$ARGUMENTS` 展开为 `foo bar`。

### 参数为空时的降级处理

```markdown
若 `$ARGUMENTS` 为空，向用户询问：
- "请描述要完成的任务"
```

### 动态上下文注入

在 skill 加载时执行命令并注入结果，使用叹号+反引号包裹命令的语法（`!` + 反引号 + 命令 + 反引号）：

```markdown
当前分支：!`git branch --show-current`
当前目录：!`pwd`
```

这些在 skill 内容加载时就会被执行结果替换，不需要 Claude 额外调用工具。

---

## 五、常见错误及修复方法

### 错误 1：description 使用第二人称

```yaml
# 错误
description: 使用此 skill 来创建新 skill。
# 修复
description: 此 skill 应在用户说"创建 skill"时使用。
```

### 错误 2：description 过于模糊

```yaml
# 错误
description: 提供 skill 相关帮助。
# 修复
description: 此 skill 应在用户说"创建 skill"、"新建 skill"、"写一个 skill" 时使用。引导完整创建 skill 的目录结构和 SKILL.md。
```

### 错误 3：SKILL.md 正文过长（>5,000 词）

将以下内容下沉到 `references/`：
- 详细字段说明表格
- 完整 API 文档
- 大量示例代码
- 边缘场景处理

在 SKILL.md 末尾用一行引用代替：
```markdown
- **`references/spec.md`** - 完整字段说明，排查触发问题时读取
```

### 错误 4：正文使用第二人称

```markdown
# 错误
你应该先读取文件，然后分析内容。

# 修复
读取文件，分析内容。
```

### 错误 5：引用了不存在的文件

在 SKILL.md 中引用 `references/guide.md` 但忘记创建该文件。Claude 会尝试读取却找不到，导致混乱。创建前先确认目录结构规划，写完所有被引用的文件。

---

## 六、目录路径速查

| 位置 | 路径 |
|------|------|
| 全局 skills | `/Users/hacxy/.claude/skills/` |
| 项目 skills | `<项目根目录>/.claude/skills/` |
| 插件 skills | `<插件目录>/skills/` |

**全局 vs 项目 skill 的选择依据：**
- 全局：个人工作流、通用工具（如 commit、格式化代码）
- 项目：项目特定规范、特定 API 的操作指南、团队共享工作流
