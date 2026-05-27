---
name: deploy
description: >
  部署 ship 项目到目标环境。支持两种模式：
  （1）本地 mock-server（Docker 容器，架构与生产服务器一致：nginx + Elysia 二进制）；
  （2）生产服务器（SSH + nginx + systemd，待扩展）。
  当用户说"部署"、"deploy"、"发布到服务器"、"测试部署"、"本地测试"、"验证部署"、
  或 ship workflow Stage 10 需要发布时，使用此 skill。
---

## 服务器真实架构（必须理解）

```
远程服务器 (OpenCloudOS 9.2 / RHEL 9)
├── nginx 1.26.2
│   ├── 静态文件  → /srv/projects/<app>/web/（nginx 直接服务，不经过 Elysia）
│   └── /api/*  → proxy_pass http://127.0.0.1:<port>
└── Elysia 后端
    ├── 编译为 Linux 原生二进制（bun build --compile）
    ├── systemd 管理（每个 app 独立 user/group）
    └── 只暴露 /api/* 路由，不服务任何静态文件
```

**Elysia 不做静态文件服务**——nginx 负责。任何在 Elysia 里服务静态文件的代码在生产环境都是无效的。

---

## 本地 Mock Server（开发测试用）

本地 mock-server 完全镜像真实服务器架构：
- nginx 服务静态文件 + proxy_pass /api/
- Bun 运行 Elysia（mock 用 bun run，真实服务器用编译二进制）

### 前提：启动 mock-server 容器

```bash
cd ~/Projects/mock-server && docker compose up -d
# 验证：curl http://localhost:8088/health
```

### 部署到 mock-server

```bash
bash "$SKILL_DIR/scripts/mock-server.sh" <project-dir> <app-name> <port>
```

脚本执行流程：
1. `bun run build`（前端）
2. 复制 dist/ → 容器 `/srv/projects/<app>/web/`
3. 复制 server 源码 → 容器，容器内 `bun install`
4. 复制 drizzle 迁移文件
5. 生成 nginx app.conf（静态文件 + proxy_pass）
6. 启动 Elysia：`bun run src/index.ts`
7. nginx reload

### 验证

```bash
bun run "$SKILL_DIR/scripts/verify-browser.ts" \
  http://localhost:8088 \
  / /transactions /reports /accounts  # ← 替换为实际路由
```

验证通过条件：所有路由 `errors=0 badMime=0`

---

## 生产服务器（待完善）

```bash
# 1. 构建前端
cd apps/web && bun run build

# 2. 编译后端为 Linux x86_64 二进制
cd apps/server && bun build --compile \
  --target=bun-linux-x64 \
  --outfile bin/server \
  src/index.ts

# 3. 上传到服务器
rsync -av apps/web/dist/ server:/srv/projects/<app>/web/
rsync -av apps/server/bin/server server:/srv/projects/<app>/server/bin/
rsync -av apps/server/drizzle/ server:/srv/projects/<app>/server/drizzle/

# 4. 重启服务
ssh server "systemctl restart <app>-server"

# 5. nginx 配置（参考 scripts/nginx-app.conf.template）
# 6. 验证（替换为实际域名）
bun run "$SKILL_DIR/scripts/verify-browser.ts" https://<domain> / /transactions
```

**注意：**
- `import.meta.dir` 在编译后二进制中无效，必须用 `process.cwd()`
- 编译后端时需在 server 目录下运行（`cwd = apps/server/`）
- drizzle 迁移文件夹路径：`process.cwd()/drizzle`（由 `drizzle.config.ts` 的 `out` 字段决定）

---

## 常见问题

**502 Bad Gateway**：Elysia 未启动或端口不对 → 检查 `docker exec mock-server tail /var/log/<app>-server.log`

**ENOENT: /web/dist/index.html**：Elysia 里有静态文件路由，且 `import.meta.dir` 在编译后失效 → 删除 Elysia 的静态路由（nginx 负责），确保 client.ts 用 `process.cwd()`

**MIME type 错误**：Elysia 用了 staticPlugin 通配符 → 改为 nginx 服务静态文件

**迁移失败 "Can't find meta/_journal.json"**：drizzle 迁移目录未复制，或路径用了 `import.meta.dir` → 用 `process.cwd()/drizzle`
