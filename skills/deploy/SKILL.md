---
name: deploy
description: >
  通过 SSH 将 ship 项目部署到目标服务器。首次运行自动创建项目配置文件，
  后续运行直接读取配置文件部署。服务器地址、端口等敏感信息存在本地配置文件中，
  不提交到仓库。当用户说"部署"、"deploy"、"发布"、"上线"、或
  ship workflow Stage 10 需要发布时使用此 skill。
---

## 服务器架构

```
目标服务器（通过 SSH 访问，无论是本地测试环境还是生产服务器，流程完全一致）
├── nginx
│   ├── 静态文件  → /srv/projects/<app>/web/
│   └── /api/*  → proxy_pass → Elysia 后端
└── Elysia 后端
    ├── 在服务器上原生编译（bun build --compile），无跨平台问题
    ├── cwd = /srv/projects/<app>/server/
    └── 只暴露 /api/* 路由，不服务静态文件
```

**注意：** Elysia 不服务静态文件，nginx 负责。`client.ts` 必须用 `process.cwd()` 而不是 `import.meta.dir`。

---

## 部署命令

```bash
bash "$SKILL_DIR/scripts/deploy.sh" <project-dir> [app-name]
```

**首次运行**：在 `~/.config/ship/<app>.conf` 创建配置文件模板，填写后重新运行。

**后续运行**：完整部署流程自动执行：
1. 本地编译前端（`bun run build`）
2. `rsync` 前端 dist/、后端 src/、迁移文件到服务器
3. SSH 进服务器：`bun install` + `bun build --compile`（在服务器原生架构编译）
4. 写入 nginx conf、重启后端进程、reload nginx
5. `verify-browser.ts` 验证

---

## 配置文件

`~/.config/ship/<app>.conf`（本地私有，不提交仓库）：

```bash
SSH_HOST=           # 服务器 IP 或域名
SSH_PORT=22         # SSH 端口
SSH_USER=root
REMOTE_DIR=/srv/projects
APP_URL=https://yourapp.com  # 部署后的访问地址（用于验证）
APP_PORT=3000
```

---

## 验证

```bash
bun run "$SKILL_DIR/scripts/verify-browser.ts" <APP_URL> / <route2> ...
```

通过条件：所有路由 0 console.error，JS=text/javascript，CSS=text/css

---

## 常见问题

**首次运行只生成配置文件**：正常行为，填写 SSH_HOST 等信息后重跑。

**502 Bad Gateway**：后端未启动或端口错误 →
```bash
ssh -p <SSH_PORT> <SSH_USER>@<SSH_HOST> "tail -f /var/log/<app>-server.log"
```

**bun: not found on server**：服务器没装 Bun → 安装 Bun：
```bash
ssh server "curl -fsSL https://bun.sh/install | bash"
```

**ENOENT migrations**：`client.ts` 用了 `import.meta.dir` →
改为 `process.cwd()/drizzle`。
