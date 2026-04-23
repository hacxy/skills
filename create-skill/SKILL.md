---
name: create-skill
description: 此 skill 应在用户说"创建 skill"、"新建一个 skill"、"写一个新的 skill"、"帮我做个 skill"、"create a skill"、"make a new skill"，或希望将某个工作流打包成可复用 skill 时使用。引导完整创建一个新 skill，包括目录结构、SKILL.md 编写和验证。
argument-hint: "[--global|--project] <skill 名称或功能描述，例如 \"git-push\" 或 \"用于格式化代码的 skill\">"
---

# 创建新 Skill

根据 `$ARGUMENTS` 中的描述，在指定位置创建一个完整的新 skill。

---

## 阶段一：理解需求

解析 `$ARGUMENTS`，明确以下信息：

**1. Skill 名称**

从描述中推断或直接提取标识符（规则：小写字母 + 连字符，如 `git-push`、`format-code`）。若 `$ARGUMENTS` 为空或描述模糊，向用户提问（每次只问一个问题）：
- "这个 skill 要完成什么任务？"
- "用户会用什么短语来触发它？（例如：'帮我推代码'、'格式化文件'）"

**2. 触发场景**

确定用户在哪些情况下调用这个 skill，收集 2–3 个典型触发短语，用于后续编写 description。

**3. 调用方式**

判断适合哪种调用模式：
- 仅限用户主动调用（有副作用，如提交代码、发送消息）→ frontmatter 加 `disable-model-invocation: true`
- 仅限 Claude 自动触发（背景知识型）→ frontmatter 加 `user-invocable: false`
- 两者皆可（默认）→ 不添加上述字段

**4. 安装位置**

检查 `$ARGUMENTS` 中是否包含位置标志：
- `--global` → 安装到全局：`/Users/hacxy/.claude/skills/`
- `--project` → 安装到当前项目：`<pwd>/.claude/skills/`

若未指定，向用户确认：
> "要将这个 skill 创建到全局（所有项目都能用），还是仅限当前项目？"

若当前不在任何 git 仓库中，默认创建到全局。

确认以上信息充分后再进入下一阶段。

---

## 阶段二：规划文件结构

根据 skill 的复杂度，决定需要哪些支撑文件：

**最小结构**（适合简单 skill）：
```
skill-name/
└── SKILL.md
```

**标准结构**（适合有参考资料的 skill）：
```
skill-name/
├── SKILL.md
└── references/
    └── [详细规范].md
```

**完整结构**（适合复杂 workflow skill）：
```
skill-name/
├── SKILL.md
├── references/   （详细规范、API 文档、策略说明）
├── examples/     （示例文件、模板）
└── scripts/      （可执行辅助脚本）
```

判断标准：
- SKILL.md 正文预计超过 300 行 → 将详细内容移入 `references/`
- skill 需要重复执行相同逻辑代码 → 在 `scripts/` 中存放脚本
- skill 需要输出特定格式文件 → 在 `examples/` 或 `assets/` 中存放模板

---

## 阶段三：创建 Skill

### 3.1 创建目录结构

根据阶段一确认的安装位置，确定 `$SKILL_ROOT`（全局为 `/Users/hacxy/.claude/skills`，项目为 `<pwd>/.claude/skills`），然后：

```bash
mkdir -p $SKILL_ROOT/<skill-name>
# 如需支撑目录，一并创建
mkdir -p $SKILL_ROOT/<skill-name>/references
```

### 3.2 编写 SKILL.md

在 `$SKILL_ROOT/<skill-name>/SKILL.md` 写入内容，遵循以下规范：

**Frontmatter 模板：**
```yaml
---
name: <skill-name>
description: <第三人称，包含具体触发短语，语言不限>
argument-hint: "（可选）参数说明，例如：文件路径或功能描述"
---
```

注意：`argument-hint` 的值**必须用引号包裹**，尤其当值中含有 `[`、`{`、`:`、`#` 等 YAML 特殊字符时（不加引号会导致解析错误）。`disable-model-invocation` 和 `user-invocable` 仅在有特殊调用需求时添加，默认省略。

**description 字段规范（关键）：**
- 必须用第三人称，语言不限（中文完全可用）
  - 中文示例：`此 skill 应在用户说"创建 skill"、"新建一个 skill"时使用。`
  - 英文示例：`This skill should be used when the user asks to "create a skill"...`
- 包含用户实际会说的具体触发短语，用引号括起来
- 避免模糊描述，短语越具体触发越准确

**正文规范：**
- 使用祈使句（动词开头）：如"读取文件"、"生成提交信息"
- 禁止"你应该..."等第二人称
- 长度目标 1,500–2,000 词，不超过 5,000 词
- 若 skill 接受参数，在正文中用 `$ARGUMENTS` 引用
- 若需在 skill 加载时注入动态上下文（如当前分支名），可在 SKILL.md 中使用叹号+反引号包裹命令的语法，skill 加载时会自动替换为执行结果（例如注入当前分支名、当前目录等）

### 3.3 编写 references/ 文件（按需）

若规划阶段决定使用 references，在对应文件中存放详细内容，并在 SKILL.md 末尾添加引用说明：

```markdown
## 参考资料

- **`references/[文件名].md`** - [说明何时读取此文件]
```

---

## 阶段四：验证

创建完成后逐项检查：

**结构：**
- [ ] `SKILL.md` 文件已创建
- [ ] SKILL.md 中引用的所有文件均已实际存在

**Frontmatter：**
- [ ] `name` 字段存在，格式为小写 + 连字符
- [ ] `description` 字段存在，第三人称，含具体触发短语
- [ ] 若声明了 `allowed-tools`，工具名称拼写正确（Read, Write, Edit, Bash, Glob, Grep）

**正文：**
- [ ] 使用祈使句，无"你应该..."等第二人称
- [ ] 若使用了 `$ARGUMENTS`，说明了参数的预期格式
- [ ] 若有 references/，SKILL.md 中有明确的引用说明

验证通过后，向用户报告：
1. 创建的文件路径
2. 触发方式示例（`/skill-name` 或自然语言短语）
3. 若有改进建议，一并说明

---

## 参考资料

- **`references/skill-spec.md`** - Frontmatter 字段完整说明、description 编写深度指南、渐进式披露原则、常见错误。在需要查阅不常用字段（如 `disable-model-invocation`、`context`、`agent`）或排查触发问题时读取。
