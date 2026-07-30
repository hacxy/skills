# Matt Pocock Skills 方法论完全手册

> 原文仓库：<https://github.com/mattpocock/skills>
> 作者：Matt Pocock（TypeScript 领域知名教育者，Total TypeScript 创始人）
> 整理时间：2025年

---

## 目录

- [一、核心哲学](#一核心哲学)
- [二、Skill 设计元理论](#二skill-设计元理论)
- [三、主流程：从想法到交付](#三主流程从想法到交付)
- [四、核心 Skill 详解](#四核心-skill-详解)
- [五、领域语言系统](#五领域语言系统)
- [六、代码设计词汇表](#六代码设计词汇表)
- [七、Skill 之间的关系图谱](#七skill-之间的关系图谱)
- [八、设计原则速查表](#八设计原则速查表)

---

## 一、核心哲学

### 这套 Skill 解决什么问题

Matt Pocock 在 README 中列出了 AI 编程的四个常见失败模式：

| 失败模式 | 根因 | 对应 Skill |
| --------- | ------ | ----------- |
| **AI 没做你想要的事** | 需求不对齐，沟通有鸿沟 | `/grill-me`、`/grill-with-docs` |
| **AI 太啰嗦** | AI 用自己的语言描述你的代码 | `CONTEXT.md` + `/domain-modeling` |
| **代码不能工作** | 缺乏反馈循环 | `/tdd`、`/diagnosing-bugs` |
| **建了一团泥巴** | 缺乏架构纪律 | `/improve-codebase-architecture`、`/codebase-design` |

### 底层信念

> "These skills are designed to be small, easy to adapt, and composable. They work with any model. They're based on decades of engineering experience."

核心信念：

1. **AI 是工具，人是决策者** — 几乎每个关键 Skill 都有 HITL（Human In The Loop）检查点
2. **小而深，而非大而全** — 每个 Skill 很短，但背后有深厚的工程智慧
3. **思维框架，而非操作手册** — 教 AI 怎么想，而非做什么
4. **工程传承，而非 AI 新发明** — 引用 Kent Beck、Michael Feathers、Eric Evans、John Ousterhout 等人的经典思想

---

## 二、Skill 设计元理论

这是 Matt Pocock 写的「如何写好 Skill」的完整方法论，来自 `writing-great-skills` Skill。

### 2.1 根本目标：可预测性（Predictability）

> 一个 Skill 存在的意义是从随机系统中驯服确定性。**可预测性**是根本美德 — 每次运行的过程相同，而非输出相同。

一个头脑风暴 Skill 的 token 每次不同，但行为模式应该相同。

### 2.2 两种代价：Context Load vs Cognitive Load

| 代价 | 来源 | 含义 |
|------|------|------|
| **Context Load（上下文负载）** | Model-invoked Skill | 该 Skill 的 description 字段每轮对话都占用 context window |
| **Cognitive Load（认知负载）** | User-invoked Skill | 用户需要记住有哪些 Skill 以及何时使用 |

**设计选择**：

- **Model-invoked**（模型可触发）：保留 description 字段，AI 可以自动触发。代价是每轮对话都占用 context window。
- **User-invoked**（用户触发）：设置 `disable-model-invocation: true`，只有用户手动输入才能触发。零 context 代价，但用户要记住它的存在。
- **Router Skill**：当 User-invoked Skill 多到记不住时，创建一个路由 Skill 来索引其他所有 Skill。

### 2.3 信息层级（Information Hierarchy）

Skill 的内容按「AI 需要的紧急程度」排列的阶梯：

```
1. 步骤（Steps）          ← SKILL.md 内的主要内容
2. 参考（Reference）       ← SKILL.md 内的辅助内容
3. 外部参考（External）    ← 链接到独立文件，按需加载
```

**渐进式披露（Progressive Disclosure）**：把参考内容从 SKILL.md 移到外部文件，用「上下文指针」（context pointer）链接。顶部保持清晰，细节按需加载。

### 2.4 Leading Word（锚点词）

这是最精妙的设计。每个 Skill 都有一个「锚点词」，它利用模型预训练中已有的概念来锚定行为：

| Skill | 锚点词 | 效果 |
| ------- | -------- | ------ |
| `tdd` | **red** | "Write the failing test FIRST" |
| `diagnosing-bugs` | **tight** | "A tight feedback loop is the skill" |
| `codebase-design` | **deep** | "Small interface, lots of implementation" |
| `wayfinder` | **fog** | "Don't chart what you can't see yet" |
| `prototype` | **throwaway** | "Code that answers a question, then gets deleted" |
| `code-review` | **two-axis** | "Standards and Spec, reported separately" |
| `grilling` | **grill** | "Grill the user relentlessly" |

**锚点词的双重作用**：

1. **锚定执行** — AI 每次看到这个词就会触发同一套行为
2. **锚定调用** — 当同样的词出现在你的 prompt、文档、代码中时，AI 能更可靠地关联到对应 Skill

**寻找锚点词的方法**：

- 你的 Skill 最核心的约束是什么？用一个词表达
- 什么词已经在工程社区有共识？（red、tight、deep、seam 都是）
- 优先使用已有的、模型已理解的词，而非自造新词

### 2.5 完成标准（Completion Criterion）

完成标准有两个属性：

| 属性 | 含义 | 例子 |
|------|------|------|
| **清晰度** | AI 能否区分「完成」和「未完成」？ | "一个可检验的命令" ✅ vs "理解已达成" ❌ |
| **要求度** | 它要求多少工作量？ | "每个修改的模型都已处理" ✅ vs "生成变更列表" ❌ |

**最强的完成标准既可检验又要求彻底。**

### 2.6 五种失败模式

| 失败模式 | 含义 | 治疗方法 |
| --------- | ------ | --------- |
| **过早完成（Premature Completion）** | AI 在步骤未真正完成时就跳到下一步 | 首先锐化完成标准；若仍无法解决，拆分步骤隐藏后续内容 |
| **重复（Duplication）** | 同一含义出现在多处 | 单一来源原则：每个含义只在一个地方 |
| **沉积（Sediment）** | 陈旧内容层层堆积，从未清理 | 建立修剪纪律，定期审查相关性 |
| **蔓延（Sprawl）** | Skill 太长，即使每行都是活的 | 信息层级：把参考推到外部文件 |
| **空操作（No-Op）** | 指令不改变任何行为，因为模型默认就会这样做 | 用「空操作测试」检查每行：它和默认行为有区别吗？ |

### 2.7 否定陷阱（Negation）

> 告诉 AI「不要做什么」反而会让被禁止的行为更突出。"不要想大象" — 你脑子里全是大象。

**治疗方法**：用正面表述描述目标行为。只有在无法正面表述时才使用禁止，且必须同时给出正面目标。

---

## 三、主流程：从想法到交付

### 3.1 主链路

```
想法
  │
  ▼
/grill-with-docs          ← 磨锐需求，建立领域语言
  │
  ├── 需要原型？ ──→ /prototype ──→ /handoff 返回
  │
  ▼
/to-spec                  ← 把对话变成规格说明
  │
  ▼
/to-tickets               ← 拆分成 tracer-bullet tickets
  │
  ▼
/implement                ← 逐个实现
  │  内部调用 /tdd（红-绿循环）
  │  完成后调用 /code-review（双轴审查）
  │
  ▼
提交代码
```

### 3.2 两个入口匝道

| 场景 | 入口 Skill | 合并到主链路的位置 |
| ------ | ----------- | ----------------- |
| Bug 和请求堆积 | `/triage` | 产生 agent-ready 的 issue → `/implement` |
| 某个东西坏了 | `/diagnosing-bugs` | 独立调试流程 |
| 巨大的、模糊的工作 | `/wayfinder` | 产出决策 → `/to-spec` → 主链路 |

### 3.3 上下文卫生

- 第 1-3 步（grill → spec → tickets）保持在**一个不中断的上下文窗口**中
- 每个 `/implement` 从新上下文开始，只看 ticket
- 接近 smart zone（~120k tokens）时，用 `/handoff` 切换到新会话

### 3.4 代码库健康

- `/improve-codebase-architecture` — 有空就跑，维护代码库质量
- 它产出「深化机会」→ 可以带入主链路的 `/grill-with-docs`

---

## 四、核心 Skill 详解

### 4.1 grilling（审问）— 所有对话的基础原语

**本质**：一场无情的面试，压力测试你的计划或设计。

**核心机制**：

- **一次只问一个问题**，等你回答后再问下一个 — 不批量提问
- 每个问题附带 AI 自己的推荐答案
- 能从代码库中找到答案的问题，AI 自己去探索，不问你
- 区分**事实**（查代码库）和**决策**（必须问人）

**决策树模型**：每个计划都分支成决策，决策之间有依赖关系。grilling 沿着决策树逐个节点下降，所以早期的回答会重塑后续的问题。

**确认门控**：AI 不会开始执行计划，直到你确认共享理解已达成。

### 4.2 grill-me（无代码库审问）

**触发**：`/grill-me`

无状态：不保存任何本地文件，不建立 CONTEXT.md。用于不涉及代码库的任何计划或设计。

### 4.3 grill-with-docs（带文档审问）

**触发**：`/grill-with-docs`

有状态：审问过程中同时构建 CONTEXT.md 和 ADR。是主链路的起点。

它内嵌调用 `/domain-modeling` Skill，在对话过程中：

- 挑战术语冲突
- 磨锐模糊语言
- 用具体场景压力测试
- 实时更新 CONTEXT.md
- 谨慎记录 ADR

### 4.4 prototype（原型）— 用代码回答设计问题

**本质**：**一次性代码，用来回答一个问题。** 问题决定原型的形状。

**两种分支**：

| 分支 | 触发条件 | 产出 |
| ------ | --------- | ------ |
| **Logic 原型** | "这个状态模型感觉对吗？" | 终端 TUI 应用，驱动状态机 |
| **UI 原型** | "这个界面应该长什么样？" | 同一路由上的多个 UI 变体 |

**Logic 原型规则**：

1. 明确说明原型在回答什么问题
2. 把逻辑隔离在一个可移植的纯模块中（reducer / 状态机 / 纯函数）
3. TUI 只是一个薄壳，可丢弃
4. 一个命令即可运行
5. 不加测试、不连真实数据库、不泛化

**UI 原型规则**：

1. 默认 3 个变体，最多 5 个
2. 变体必须**结构上不同**（布局、信息层级、主要交互），不只是颜色不同
3. 用 `?variant=` URL 参数切换
4. 底部浮动切换条
5. 生产构建中隐藏切换条

### 4.5 tdd（测试驱动开发）

**本质**：红 → 绿循环。这是一个**纯参考** Skill，没有步骤。

**核心规则**：

1. **Red before green** — 先写失败的测试，再写刚好能通过的代码
2. **一次一个切片** — 一个 seam、一个测试、一个最小实现
3. **重构不属于循环** — 重构属于 code-review 阶段

**什么是好的测试**：

- 通过公共接口验证行为，不验证实现细节
- 读起来像规格说明："user can checkout with valid cart"
- 能承受重构，因为它不关心内部结构

**Seam（接缝）**：测试存在的位置 — 观察行为而不深入内部的公共边界。**只在预定义的 seam 上测试，写任何测试前先和用户确认 seam。**

**反模式**：

- **实现耦合** — mock 内部协作者、测试私有方法
- **同义反复测试** — 断言用和代码相同的逻辑重新计算期望值
- **水平切片** — 先写所有测试再写所有实现（应垂直切片：一个测试 → 一个实现 → 重复）

### 4.6 code-review（代码审查）

**本质**：沿两个轴审查 diff — **Standards**（是否符合编码标准）和 **Spec**（是否符合需求规格）。

两个轴**并行运行**为独立的 sub-agent，避免互相污染上下文。

**Standards 轴**包含：

- 仓库文档化的编码标准
- Fowler 代码异味基线（12 种高信号异味）

**Fowler 代码异味基线**：

| 异味 | 含义 | 治疗 |
| ------ | ------ | ------ |
| Mysterious Name | 名字不揭示功能 | 重命名 |
| Duplicated Code | 相同逻辑出现在多处 | 提取共享形状 |
| Feature Envy | 方法访问其他对象的数据多于自己的 | 移动方法 |
| Data Clumps | 相同字段反复一起出现 | 打包成类型 |
| Primitive Obsession | 原始类型代替领域概念 | 给概念自己的类型 |
| Repeated Switches | 相同类型的 switch/if 级联反复出现 | 多态或共享 map |
| Shotgun Surgery | 一个逻辑变更迫使多文件散落编辑 | 聚集到一个模块 |
| Divergent Change | 一个文件因多个无关原因被编辑 | 拆分 |
| Speculative Generality | 为不存在的需求添加抽象 | 删除 |
| Message Chains | 长链式导航 a.b().c().d() | 隐藏在一个方法中 |
| Middle Man | 大部分只是委托的中间人 | 剪掉，直接调用 |
| Refused Bequest | 子类忽略或覆盖大部分继承 | 用组合代替继承 |

**两条绑定规则**：

1. 仓库文档化的标准总是覆盖基线
2. 每个异味都是判断性标记，不是硬违规

### 4.7 diagnosing-bugs（诊断 Bug）

**本质**：一个有纪律的诊断循环。**拒绝在有反馈循环之前假设。**

**六个阶段**：

**Phase 1 — 构建反馈循环（这是核心技能）**

- 花不成比例的精力在这里
- 按优先级尝试：失败测试 → curl/HTTP 脚本 → CLI 调用 → 无头浏览器 → 重放 trace → 临时测试工具 → 属性/模糊测试 → 二分工具 → 差分循环 → HITL bash 脚本
- **收紧循环**：能否更快？信号能否更锐利？能否更确定性？
- 非确定性 bug：目标不是完美复现，而是**更高的复现率**
- **完成标准**：一个已经跑过至少一次的、能变红的、确定性的、快速的、agent 可运行的命令

**Phase 2 — 复现 + 最小化**

- 确认循环产出用户描述的失败模式
- 缩小到仍然变红的最小场景：每次移除一个元素，重新运行循环
- 每个剩余元素都是承重的

**Phase 3 — 假设**

- 生成 3-5 个排序假设后再测试任何一个
- 每个假设必须**可证伪**：明确预测
- 格式："如果 <X> 是原因，那么 <改变 Y> 会让 bug 消失"
- **测试前展示给用户**

**Phase 4 — 插桩**

- 每个探针对应一个特定预测
- 一次只改变一个变量
- 偏好：调试器 > 目标化日志 > 不要"记录一切然后 grep"
- 每个调试日志用唯一前缀标记：`[DEBUG-a4f2]`
- 性能分支：先建立基线测量，再二分

**Phase 5 — 修复 + 回归测试**

- 在修复**之前**写回归测试（只在有正确 seam 时）
- 如果没有正确的 seam，这本身就是发现 — 记录它

**Phase 6 — 清理 + 事后分析**

- 原始复现不再复现
- 回归测试通过
- 所有 `[DEBUG-...]` 插桩已移除
- 问：什么能防止这个 bug？如果涉及架构变更 → 交给 `/improve-codebase-architecture`

### 4.8 to-spec（写规格说明）

**本质**：把当前对话变成规格说明（PRD），**不再次采访用户**，只综合已知信息。

**产出模板**：

- Problem Statement（问题陈述）
- Solution（解决方案）
- User Stories（用户故事，长列表）
- Implementation Decisions（实现决策）
- Testing Decisions（测试决策）
- Out of Scope（范围外）
- Further Notes（补充说明）

**关键约束**：

- 不包含具体文件路径或代码片段（会过时）
- 例外：原型产出的代码片段可以内联（状态机、reducer、schema）

### 4.9 to-tickets（拆分 tickets）

**本质**：把计划、规格或对话拆分成 **tracer-bullet tickets**，每个声明其阻塞边。

**Tracer bullet**：窄但完整的路径，贯穿每一层（schema、API、UI、测试）。完成的切片可独立演示或验证。

**宽重构的例外**：单个机械变更（如重命名列）影响范围太广，不能垂直切片。使用**展开-收缩**模式：

1. 展开：在旧形式旁添加新形式
2. 迁移：按影响范围分批迁移调用点
3. 收缩：删除旧形式

### 4.10 implement（实现）

**本质**：基于规格或 tickets 实现工作。

```
实现工作
  │
  ├─ 使用 /tdd（预定义的 seam 处）
  ├─ 定期运行类型检查
  ├─ 定期运行单个测试文件
  ├─ 最后运行完整测试套件
  ├─ 完成后使用 /code-review 审查
  └─ 提交到当前分支
```

### 4.11 wayfinder（寻路）— 大型项目规划

**本质**：一个模糊的想法太大，一个会话装不下，且路还看不清。Wayfinder 在 issue tracker 上绘制一个**共享地图**，逐个解决**决策 tickets**，直到路径清晰。

**核心概念**：

| 概念 | 含义 |
| ------ | ------ |
| **Destination（目的地）** | 这个地图要到达的地方 — 规格、决策或变更 |
| **The Map（地图）** | 一个 `wayfinder:map` label 的 issue，是索引不是存储 |
| **Decision Ticket（决策 ticket）** | 地图的子 issue，解决一个决策 |
| **Fog of War（战争迷雾）** | 你能感觉到要来但还无法精确定义的决策 |
| **Frontier（边界）** | 开放的、未阻塞的、未认领的 tickets — 已知的边缘 |
| **Out of Scope（范围外）** | 超出目的地的工作，关闭，永不毕业 |

**Ticket 类型**：

| 类型 | HITL/AFK | 含义 |
| ------ | ---------- | ------ |
| **Research** | AFK | 阅读文档、API，用 `/research` subagent 并行解决 |
| **Prototype** | HITL | 用 `/prototype` 做廉价原型来提高讨论精度 |
| **Grilling** | HITL | 通过 `/grilling` 和 `/domain-modeling` 逐个问题对话 |
| **Task** | HITL 或 AFK | 必须在决策前完成的手动工作 |

**两条铁律**：

1. **计划，不要做** — 地图产出决策，不是交付物
2. **每次会话最多解决一个 ticket**（research 除外）

**流程**：

*绘制地图*：

1. 命名目的地（用 grilling 确定）
2. 映射边界（breadth-first grilling）
3. 创建地图
4. 创建你能定义的 tickets
5. 点燃 research subagents
6. 停止 — 绘制是一个会话的工作

*解决地图*：

1. 加载地图（低分辨率）
2. 选择 ticket（用户指定或第一个边界 ticket）
3. 认领它（分配给自己）
4. 解决它
5. 记录解决：发布解决评论、关闭 issue、追加到 Decisions so far
6. 创建新暴露的 tickets

### 4.12 research（研究）

**本质**：把阅读工作委托给**后台 agent**。

- 调查问题，针对**主要来源**（官方文档、源代码、规范、第一方 API）
- 将发现写入单个 Markdown 文件
- 每个声明引用来源
- 你在它读的时候继续工作

### 4.13 triage（分流）

**本质**：把 issues 和外部 PRs 推过一个状态机。

**分类角色**：`bug`（坏了）、`enhancement`（新功能）

**状态角色**：

- `needs-triage` — 维护者需要评估
- `needs-info` — 等待报告者更多信息
- `ready-for-agent` — 完全定义，可交给 AFK agent
- `ready-for-human` — 需要人工实现
- `wontfix` — 不会处理

**流程**：

1. 收集上下文（读完整 issue/PR、探索代码库）
2. 推荐分类和状态
3. 验证声明（复现 bug、确认 PR diff）
4. 如需要 → grilling
5. 应用结果

**每个 AI 生成的评论必须以免责声明开头**：

```
> *This was generated by AI during triage.*
```

### 4.14 improve-codebase-architecture（改进代码库架构）

**本质**：扫描代码库寻找**深化机会**，以可视化 HTML 报告呈现，然后 grilling 你选择的那个。

**流程**：

1. **探索** — 先确定范围（YAGNI），找热点文件
2. **呈现候选** — HTML 报告（Tailwind + Mermaid），每个候选有前后对比图
3. **Grilling 循环** — 你选一个，用 grilling 走决策树

**HTML 报告的每个候选卡片包含**：

- Files（涉及的文件）
- Problem（为什么当前架构有摩擦）
- Solution（什么会改变）
- Benefits（用 leverage 和 locality 解释）
- Before/After 图表
- Recommendation strength（Strong / Worth exploring / Speculative）

### 4.15 codebase-design（代码库设计词汇表）

**本质**：设计**深度模块**的共享词汇 — 大量行为隐藏在小接口后面，放在干净的 seam 上，通过该接口可测试。

**这是语言，不是程序。** 它不重构你的代码，它修正你的用词。

**核心词汇**：

| 术语 | 定义 | 避免使用 |
| ------ | ------ | --------- |
| **Module（模块）** | 任何有接口和实现的东西。规模无关 | unit, component, service |
| **Interface（接口）** | 调用者必须知道的一切：类型签名、不变量、排序约束、错误模式 | API, signature |
| **Depth（深度）** | 接口的杠杆率：调用者每学一单位接口能行使多少行为 | — |
| **Seam（接缝）** | 可以在不编辑该位置的情况下改变行为的地方（Michael Feathers） | boundary |
| **Adapter（适配器）** | 在 seam 处满足接口的具体东西 | — |
| **Leverage（杠杆）** | 调用者从深度中获得的：每学一单位接口获得的能力 | — |
| **Locality（局部性）** | 维护者从深度中获得的：变更、bug、知识集中在一个地方 | — |

**两个核心检验**：

1. **删除测试** — 想象删除模块。如果复杂性消失，它是透传；如果复杂性在 N 个调用者中重现，它值得存在
2. **一个适配器意味着假想的 seam；两个适配器意味着真实的 seam** — 除非有东西真的在 seam 上变化，否则不要切 seam

**设计原则**：

- 深度是接口的属性，不是实现的属性
- 接口就是测试面
- 接受依赖，不要创建它们
- 返回结果，不要产生副作用
- 小表面积

### 4.16 domain-modeling（领域建模）

**本质**：主动构建和打磨项目的领域模型。这是**主动纪律** — 挑战术语、发明边缘场景、在术语确定时立刻写入。

**在会话中做什么**：

1. **挑战术语冲突** — "你的术语表定义 X 是…，但你现在说的是 Y"
2. **磨锐模糊语言** — "你说的 account 是 Customer 还是 User？"
3. **用具体场景压力测试** — 发明探测边缘案例的场景
4. **与代码交叉引用** — 检查代码是否同意用户的说法
5. **实时更新 CONTEXT.md** — 术语确定就立刻写入
6. **谨慎提供 ADR** — 只在三个条件同时满足时

**ADR 触发的三个条件**：

1. 难以逆转
2. 没有上下文会让人困惑
3. 是真实权衡的结果

### 4.17 resolving-merge-conflicts（解决合并冲突）

1. 查看当前合并/rebase 状态
2. 找到每个冲突的**主要来源**（commit messages、PRs、原始 issues）
3. 解决每个 hunk — 保留双方意图，不发明新行为
4. 运行项目的自动化检查
5. 完成合并/rebase

### 4.18 handoff（交接）

当会话满了或需要分支时，把对话压缩成 markdown 文件。**你不是继续在原地 — 你打开新会话并引用该文件。** 这是上下文窗口之间的桥梁。

### 4.19 writing-great-skills（写好 Skill）

这是一份参考文档，不是程序。教你怎么写出可预测的 Skill。完整内容见本文第二节「Skill 设计元理论」。

---

## 五、领域语言系统

### 5.1 CONTEXT.md 是什么

项目的**术语表**，人和 AI 之间的**共同语言**。

**格式**：

```markdown
# {项目名}

{一两句话描述}

## Language

**{术语1}**:
{一两句话定义它是什么}
_Avoid_: {同义词1}, {同义词2}

**{术语2}**:
{一两句话定义它是什么}
_Avoid_: {同义词1}, {同义词2}
```

**规则**：

- 每个概念只用一个词，`_Avoid_` 禁止同义词
- 定义要短（一两句话），说「是什么」不是「做什么」
- 只收录领域特有的术语
- 懒创建：第一个术语确定时才创建文件
- **不包含实现细节** — 它是术语表，不是 spec

**多上下文仓库**：

```
/
├── CONTEXT-MAP.md          ← 指向各子上下文
├── docs/adr/               ← 系统级决策
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

### 5.2 为什么领域语言如此重要

AI 有一个隐蔽的坏习惯：**它会用自己习惯的词来描述你的代码**。

```
你的 CONTEXT.md 定义：        AI 实际会说：
─────────────────────        ─────────────────
"Materialization"            "instantiation"
"Cascade"                    "propagation chain"
"Section"                    "chapter"
```

这导致：变量命名不一致、沟通成本上升、上下文窗口浪费、AI 理解偏差。

**效果对比**：

> **BEFORE**: "There's a problem when a lesson inside a section of a course is made 'real' (i.e. given a spot in the file system)"
>
> **AFTER**: "There's a problem with the materialization cascade"

后者用了两个领域术语，10 个词说清了 25 个词的事。

### 5.3 ADR（架构决策记录）

**格式极简**：

```markdown
# {决策简短标题}

{1-3 句话：上下文、决定、原因}
```

**可选章节**（只在有真正价值时添加）：

- Status 前置（proposed / accepted / deprecated / superseded）
- Considered Options（被拒绝的替代方案）
- Consequences（非显而易见的下游影响）

**ADR 存放在** `docs/adr/`，顺序编号：`0001-slug.md`。

---

## 六、代码设计词汇表

### 6.1 深度模块 vs 浅层模块

**深度模块** = 小接口 + 大量实现：

```
┌─────────────────────┐
│   Small Interface   │  ← 少量方法，简单参数
├─────────────────────┤
│                     │
│  Deep Implementation│  ← 复杂逻辑被隐藏
│                     │
└─────────────────────┘
```

**浅层模块** = 大接口 + 少量实现（应避免）：

```
┌─────────────────────────────────┐
│       Large Interface           │  ← 多方法，复杂参数
├─────────────────────────────────┤
│  Thin Implementation            │  ← 只是透传
└─────────────────────────────────┘
```

### 6.2 依赖分类

| 类别 | 含义 | 测试策略 |
| ------ | ------ | --------- |
| **进程内** | 纯计算，无 I/O | 直接测试 |
| **本地可替代** | 有本地测试替代（PGLite 替代 Postgres） | 用替代品测试 |
| **远程但拥有** | 你自己的跨网络服务 | 定义 port + adapter |
| **真正的外部** | Stripe、Twilio 等第三方 | 注入 port + mock adapter |

### 6.3 深化安全指南

**Seam 纪律**：

- 一个适配器 = 假想的 seam
- 两个适配器 = 真实的 seam
- 内部 seam（私有，给自己的测试用）vs 外部 seam（公共接口）

**测试策略：替换，不要分层**：

- 旧的单元测试一旦深度模块的接口测试存在就变成废物 — 删除它们
- 在深度模块的接口上写新测试
- 测试断言通过接口可观察的结果，不是内部状态

### 6.4 Design It Twice（设计两次）

当你想为一个深化候选探索替代接口时：

1. **框定问题空间** — 写出约束、依赖、代码草图
2. **并行启动 sub-agents** — 每个生产一个**根本不同的**接口：
   - Agent 1: 最小化接口（1-3 个入口点）
   - Agent 2: 最大化灵活性
   - Agent 3: 优化最常见的调用者
   - Agent 4: 围绕 ports & adapters 设计
3. **呈现和比较** — 按深度、局部性、seam 放置对比

---

## 七、Skill 之间的关系图谱

### 7.1 调用关系

```
/grill-with-docs ──→ /grilling (原语)
       │              + /domain-modeling
       │
       ├──→ /prototype (可选分支)
       │
       ▼
    /to-spec
       │
       ▼
    /to-tickets
       │
       ▼
    /implement ──→ /tdd
       │          + /code-review
       │
       ▼
    提交代码


/wayfinder ──→ /grilling + /domain-modeling
    │           + /research (subagent)
    │           + /prototype
    │
    ▼
  /to-spec → /to-tickets → /implement


/triage ──→ /grilling + /domain-modeling
    │
    ▼
  /implement (后续)


/diagnosing-bugs ──→ /improve-codebase-architecture (事后)


/improve-codebase-architecture ──→ /codebase-design (词汇)
    │                               + /domain-modeling (词汇)
    │
    ▼
  /grilling (深化某个候选)
```

### 7.2 词汇层

两个 model-invoked 的参考 Skill 运行在其他 Skill **之下**：

| 词汇 Skill | 覆盖领域 | 谁使用它 |
| ----------- | --------- | --------- |
| `/domain-modeling` | 项目的领域语言 | grill-with-docs, triage, improve-codebase-architecture, wayfinder |
| `/codebase-design` | 模块设计语言 | tdd, improve-codebase-architecture, to-spec |

### 7.3 Skill 分类

**按调用方式**：

| User-invoked | Model-invoked |
| ------------- | --------------- |
| grill-me | grilling |
| grill-with-docs | domain-modeling |
| wayfinder | codebase-design |
| triage | prototype |
| to-spec | research |
| to-tickets | code-review |
| ask-matt | — |
| writing-great-skills | — |

**按功能**：

| 类别 | Skills |
| ------ | -------- |
| **对话与对齐** | grilling, grill-me, grill-with-docs |
| **规划** | wayfinder, to-spec, to-tickets |
| **实现** | implement, tdd |
| **审查与维护** | code-review, improve-codebase-architecture |
| **调试** | diagnosing-bugs |
| **基础设施** | domain-modeling, codebase-design, prototype, research |
| **工作流管理** | triage, handoff, resolving-merge-conflicts |
| **元** | ask-matt, writing-great-skills, setup-matt-pocock-skills |

---

## 八、设计原则速查表

### 写 Skill 的清单

```
□ 找到背后的工程智慧（有经典书/方法论支撑吗？）
□ 提炼 leading word（一个词锚定整个 Skill 的行为）
□ 写核心规则（3-5 条，imperative 语气）
□ 命名反模式（2-3 个，什么做法看起来对但实际是错的）
□ 写完成标准（AI 怎么知道自己做完了？）
□ 决定粒度（要不要拆分？）
□ 决定调用方式（model-invoked 还是 user-invoked？）
□ 用真实场景测试（AI 每次执行的过程一样吗？）
□ 迭代（在真实使用中发现反模式）
```

### 检验标准

问自己：**如果把我的 Skill 给一个初级工程师看，他能从中学到一个工程概念吗？**

- 如果能 → 他学到了什么是 tight loop、deep module、tracer bullet
- 如果不能 → 他还停留在执行步骤的层次

### 核心设计原则

| 原则 | 含义 |
| ------ | ------ |
| **可预测性 > 一切** | 同样的过程，不是同样的输出 |
| **小而深** | 接口小，实现深 |
| **Leading word 锚定行为** | 一个词代替一段解释 |
| **正面表述 > 禁止** | "写一行注释" > "不要写冗长的注释" |
| **单一来源** | 每个含义只在一个地方 |
| **渐进式披露** | 顶部清晰，细节按需加载 |
| **HITL 检查点** | 人是决策者，AI 是工具 |
| **反模式比正确做法更重要** | AI 知道该做什么，但不知道不该做什么 |
| **完成标准要可检验** | 模糊的标准导致过早完成 |
| **懒创建** | 需要时才创建文件 |

---

## 附录：Skill 完整列表

| Skill | 类型 | 触发词 | 一句话描述 |
| ------- | ------ | -------- | ----------- |
| `ask-matt` | User | `/ask-matt` | 路由器：该用哪个 Skill |
| `code-review` | Model | 自动 | 双轴审查：Standards + Spec |
| `codebase-design` | Model | 自动 | 深度模块设计词汇 |
| `diagnosing-bugs` | Model | "diagnose"/"debug" | 纪律化的诊断循环 |
| `domain-modeling` | Model | 自动 | 主动构建领域模型 |
| `grill-me` | User | `/grill-me` | 无代码库的审问 |
| `grill-with-docs` | User | `/grill-with-docs` | 带文档的审问 |
| `grilling` | Model | 自动 | 审问原语 |
| `implement` | User | `/implement` | 基于规格实现 |
| `improve-codebase-architecture` | User | `/improve` | 扫描深化机会 |
| `prototype` | Model | 自动 | 一次性代码回答设计问题 |
| `research` | Model | 自动 | 后台 agent 调研 |
| `resolving-merge-conflicts` | Model | "resolve conflict" | 解决 git 冲突 |
| `setup-matt-pocock-skills` | User | `/setup` | 首次配置 |
| `tdd` | Model | 自动 | 红-绿循环参考 |
| `to-spec` | User | `/to-spec` | 对话变规格 |
| `to-tickets` | User | `/to-tickets` | 计划变 tickets |
| `triage` | User | `/triage` | Issue 分流 |
| `wayfinder` | User | `/wayfinder` | 大型项目寻路 |
| `writing-great-skills` | User | `/writing-great-skills` | 写好 Skill 的参考 |
