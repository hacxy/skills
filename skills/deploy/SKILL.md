---
name: deploy
description: >
  通过 SSH 密钥将 ship 项目部署到目标服务器。
  首次运行自动生成配置文件模板（~/.config/ship/<app>.conf），填写后重新运行即可完整部署。
  服务器敏感信息（地址、密钥路径、域名）存在本地配置文件，不提交到仓库。
  当用户说"部署"、"deploy"、"发布"、"上线"，或 ship workflow Stage 10 时使用。
---

## 服务器部署架构

```
/srv/projects/<app>/
├── web/                  ← 前端静态文件（nginx 直接服务）
└── server/
    ├── sqlite.db         ← 数据库（WorkingDirectory = server/）
    ├── bin/
    │   └── server        ← Bun 编译的 Linux x64 原生二进制
    └── drizzle/          ← 数据库迁移文件
```

**进程管理**：systemd（服务名 `<app>-server`）
**用户**：`deploy`（有 sudo 权限执行 `systemctl restart <app>-server`）
**nginx**：SSL 终止 + 静态文件服务 + `/api/*` proxy_pass

**Elysia 只暴露 `/api/*`，不服务静态文件。**
`client.ts` 必须用 `process.cwd()` 而不是 `import.meta.dir`（编译后无效）。

---

## 部署命令

```bash
bash "$SKILL_DIR/scripts/deploy.sh" <project-dir> [app-name]
```

**首次运行**：生成 `~/.config/ship/<app>.conf` 模板，填写后重跑。  
**后续运行**：直接执行完整部署流程。

---

## 配置文件格式

`~/.config/ship/<app>.conf`（本地私有，不提交仓库）：

```bash
SSH_HOST=your-server.com      # 服务器地址
SSH_PORT=22                   # SSH 端口
DEPLOY_KEY=~/.ssh/id_ed25519  # deploy 用户的本地私钥路径

APP_DOMAIN=app.yourdomain.com # 域名（nginx server_name + 验证用）
APP_PORT=3000                 # Elysia 后端端口
REMOTE_DIR=/srv/projects      # 服务器项目根目录
```

---

## 完整部署流程

1. **本地编译前端** — `bun run build`
2. **本地交叉编译后端** — `bun build --compile --target=bun-linux-x64`
3. **rsync 三类文件**：
   - `apps/web/dist/` → `server:/srv/projects/<app>/web/`
   - `apps/server/bin/server` → `server:/srv/projects/<app>/server/bin/server`
   - `apps/server/drizzle/` → `server:/srv/projects/<app>/server/drizzle/`
4. **nginx 配置**（首次部署自动生成，已有则跳过）
5. **重启服务** — `sudo systemctl restart <app>-server`
6. **验证** — headless 浏览器检查所有路由

---

## 首次部署前提（需 root 在服务器执行一次）

deploy 用户需要有对应 app 的 systemd 服务和 sudo 权限：

```bash
# 1. 创建 systemd 服务文件（脚本会提示具体内容）
# 2. 赋予 deploy 用户 sudo 权限
echo 'deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart <app>-server' \
    | sudo tee /etc/sudoers.d/<app>-deploy
# 3. 确保 deploy 用户的 SSH 公钥已在服务器上
cat ~/.ssh/id_ed25519.pub | ssh root@server "cat >> /home/deploy/.ssh/authorized_keys"
```

---

## SSL 证书

服务器使用 **acme.sh + Let's Encrypt + DNSPod DNS API** 签发通配符证书。

deploy.sh 自动检测 `/etc/nginx/ssl/*/fullchain.cer`：
- 有证书 → 生成 HTTPS nginx 配置（443 + HTTP→HTTPS 301）
- 无证书 → 生成 HTTP nginx 配置

**签发新证书**（详见 `references/ssl-setup.md`）：
```bash
# SSH 进服务器（root）
~/.acme.sh/acme.sh --issue --dns dns_dp \
    -d yourdomain.com -d "*.yourdomain.com" --keylength ec-384
~/.acme.sh/acme.sh --install-cert -d yourdomain.com \
    --key-file /etc/nginx/ssl/yourdomain.com/yourdomain.com.key \
    --fullchain-file /etc/nginx/ssl/yourdomain.com/fullchain.cer \
    --reloadcmd "service nginx force-reload"
```

DNS API 密钥存储在服务器 `~/.acme.sh/account.conf`（不在任何仓库中）。

---

## 验证

```bash
bun run "$SKILL_DIR/scripts/verify-browser.ts" https://<domain> / <route2> ...
```

---

## 常见问题

**Permission denied (publickey)**：检查 `DEPLOY_KEY` 路径，确认该公钥已加入服务器 deploy 用户的 `~/.ssh/authorized_keys`

**systemd 服务不存在**：脚本会打印创建命令，用 root 执行后重新部署

**502 Bad Gateway**：后端未启动 →
```bash
ssh -i $DEPLOY_KEY deploy@$SSH_HOST "journalctl -u <app>-server -f"
```

**ENOENT migrations**：`client.ts` 用了 `import.meta.dir` →
改为 `join(process.cwd(), 'drizzle')`，并确保 drizzle/ 已 rsync 到服务器
