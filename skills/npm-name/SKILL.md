---
name: npm-name
description: 根据用户描述的库功能，生成符合 npm 命名规范的候选包名，并实时查询 npm 注册表确认哪些名称尚未被占用。当用户提到"帮我找 npm 包名"、"给我推荐一个 npm 名字"、"我想发布 npm 包，取什么名字好"、"查一下这个名字在 npm 上有没有被用"、"npm 包名建议"、"npm name"、"package name"、"给我的库起个名字"等，务必使用此 skill。至少返回 3 个可用名称；若可用名称不足 3 个，返回全部找到的；若全部被占用，则给出备选创意建议并说明。
---

# npm 包名查询助手

根据用户对库功能的描述，生成有意义的候选包名，并通过 npm 注册表 API 验证可用性。

## 工作流

### 第一步：理解描述，提取关键词

仔细阅读用户的描述，提取：
- **核心动词**：库做什么（parse、validate、format、convert、generate…）
- **领域名词**：操作的对象（date、url、color、json、image…）
- **修饰词**：特性或风格（fast、tiny、simple、smart、lite…）

### 第二步：生成候选名称（≥ 12 个）

按以下模式组合，尽量覆盖多种风格，生成至少 12 个候选名：

| 模式 | 示例 |
|------|------|
| `动词-名词` | `parse-date`、`format-url` |
| `名词-工具词` | `date-kit`、`color-utils`、`json-helper` |
| `形容词-名词` | `tiny-validator`、`fast-formatter` |
| `名词js/ts` | `datejs`、`colorify` |
| `前缀 + 核心词` | `super-parser`、`ultra-lint` |
| `核心词 + 后缀` | `dateify`、`colorize`、`urlish` |
| `缩写/拼接` | `fmtd`、`vurl`、`jparse` |
| 创意/拟声词 | 与功能相关的有趣词汇 |

**命名规范**（必须遵守）：
- 全小写，不含大写字母
- 只用字母、数字、连字符 `-`，不用下划线或空格
- 不以点 `.` 或连字符 `-` 开头
- 长度不超过 214 个字符
- 避免与知名包名极为相似（防止混淆）

### 第三步：并行检查 npm 可用性

对所有候选名称同时发出 HTTP 请求：

```bash
curl -s -o /dev/null -w "%{http_code}" https://registry.npmjs.org/<package-name>
```

- **404** → 名称**可用** ✅
- **200** → 名称**已被占用** ❌
- 其他状态码 → 视为不确定，标注 `⚠️ 待确认`

为减少等待，用 `&` 并行执行所有 curl 请求，收集结果后统一汇报。示例：

```bash
check_name() {
  local name=$1
  local code=$(curl -s -o /dev/null -w "%{http_code}" "https://registry.npmjs.org/$name")
  echo "$name $code"
}

# 并行检查所有候选名
for name in "${candidates[@]}"; do
  check_name "$name" &
done
wait
```

### 第四步：整理并输出结果

按以下格式展示：

```
## 可用的 npm 包名（共 N 个）

✅ **package-name-1** — 简短说明为何这个名字适合（10字以内）
✅ **package-name-2** — 简短说明
✅ **package-name-3** — 简短说明
...

## 已被占用
❌ taken-name-1
❌ taken-name-2
```

**数量规则**：
- 可用名称 ≥ 3 个：展示全部可用名称
- 可用名称 1-2 个：展示全部找到的，并在末尾追加"备选建议"（注明未经验证）
- 可用名称为 0 个：不显示可用区块，直接展示"备选建议"

### 备选建议（兜底）

当可用名称不足时，结合用户描述给出 3 个创意备选，格式如下：

```
## 备选建议（未验证，请自行确认）

💡 **creative-name-1** — 理由
💡 **creative-name-2** — 理由  
💡 **creative-name-3** — 理由

可用以下命令手动验证：
\`curl -s -o /dev/null -w "%{http_code}" https://registry.npmjs.org/<包名>\`
返回 404 表示可用。
```

## 注意事项

- 查询速度取决于网络，通常 3-10 秒内完成所有检查
- npm 注册表偶尔返回非标准状态码，对结果标注 `⚠️` 并提示用户手动验证
- 不要建议带 `@scope/` 前缀的 scoped 包名，除非用户主动要求
- 如果用户的描述很短（如"工具库"），主动询问更多细节以生成更精准的名称
