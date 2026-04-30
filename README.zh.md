# skills

这是我个人的 skill 集合——带有强烈的个人主见，主要为我自己的工作流维护，同时对所有人开放使用。

Skills 存储在本仓库并同步到中央 registry：[hacxy/skills](https://github.com/hacxy/skills)。通过 CLI 可将它们安装到 Claude Code、Cursor 或 Codex。

[English](./README.md)

## 安装

```bash
npm install -g @hacxy/skills
```

## CLI 用法

### 浏览

```bash
# 列出所有技能
skills list

# 按关键字搜索
skills search commit

# 查看技能详情
skills show commit
```

### 安装

```bash
# 安装到 Claude Code（默认）
skills install commit

# 安装到 Cursor 或 Codex
skills install commit --platform cursor
skills install commit --platform codex

# 同时安装多个技能
skills install commit review find-docs

# 安装 registry 中的全部技能
skills install

# 同时安装到所有平台
skills install --all-platforms

# 预览安装路径，不实际写入
skills install commit --dry-run
```

支持的平台：`claude-code`、`cursor`、`codex`

### 查看安装路径

```bash
skills where claude-code
skills where cursor
skills where codex
```

## 所有者命令

这些命令需要所有者认证，仅在你 fork 本仓库管理自己的 registry 时有用。

```bash
# 初始化 owner token
skills auth init --token your-secret-token

# 查看认证状态
skills auth status

# 上传技能到 registry
skills upload --source ./my-skill
skills upload --source ./my-skill --force        # 已存在时覆盖
skills upload --source ./my-skill --dry-run      # 仅预览
```

上传会将技能写入本地 `skills/` 目录，并通过 GitHub Contents API 推送到仓库——所有用户立即可见。

上传所需的环境变量：

| 变量 | 说明 |
|---|---|
| `SKILLS_OWNER_TOKEN` | 上传认证用 owner token |
| `GITHUB_TOKEN` / `GH_TOKEN` | 具备仓库写权限的 GitHub token |

## 本地开发

```bash
npm install
npm run build
npm run dev:web    # 启动 Web 应用
npm run dev:cli    # CLI 开发模式
```

## 许可证

[MIT](LICENSE)

---

> English documentation: [README.md](./README.md)
