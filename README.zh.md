# skills

这是我个人的 skill 集合——带有强烈的个人主见，主要为我自己的工作流维护，同时对所有人开放使用。

Skills 存储在本仓库并同步到中央 registry：[hacxy/skills](https://github.com/hacxy/skills)。通过 CLI 可将它们安装到 Claude Code、Cursor 或 Codex。

[English](./README.md)

## 使用方式

无需安装，直接通过 npx 运行：

```bash
npx @hacxy/skills install commit
```

或者全局安装后使用：

```bash
npm install -g @hacxy/skills
skills install commit
```

## CLI 命令

### 浏览

```bash
# 列出所有技能
npx @hacxy/skills list

# 按关键字搜索
npx @hacxy/skills search commit

# 查看技能详情
npx @hacxy/skills show commit
```

### 安装

```bash
# 安装到 Claude Code（默认）
npx @hacxy/skills install commit

# 安装到 Cursor、Codex 或 Trae
npx @hacxy/skills install commit --platform cursor
npx @hacxy/skills install commit --platform codex
npx @hacxy/skills install commit --platform trae

# 安装到指定目录
npx @hacxy/skills install commit --dir ./path/to/dir

# 安装到当前目录
npx @hacxy/skills install commit --dir .

# 同时安装多个技能
npx @hacxy/skills install commit review find-docs

# 安装 registry 中的全部技能
npx @hacxy/skills install

# 同时安装到所有平台
npx @hacxy/skills install --all-platforms

# 预览安装路径，不实际写入
npx @hacxy/skills install commit --dry-run
```

支持的平台：`claude-code`、`cursor`、`codex`、`trae`

### 查看安装路径

```bash
npx @hacxy/skills where claude-code
npx @hacxy/skills where cursor
npx @hacxy/skills where codex
```

## 所有者命令

这些命令需要所有者认证，仅在你 fork 本仓库管理自己的 registry 时有用。

```bash
# 查看认证状态
skills auth status

# 上传技能到 registry
skills upload --source ./my-skill
skills upload --source ./my-skill --force        # 已存在时覆盖
skills upload --source ./my-skill --dry-run      # 仅预览
```

上传会推送到远程仓库——所有用户立即可见。

上传所需的环境变量：

| 变量                        | 说明                                               |
| --------------------------- | -------------------------------------------------- |
| `GITHUB_TOKEN` / `GH_TOKEN` | 具备仓库写权限的 GitHub token（`contents: write`） |

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
