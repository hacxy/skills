---
name: deploy
description: >
  通过 SSH 密钥将 ship 项目部署到目标服务器。SSH 登录用户固定为 deploy。
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

**进程管理**：systemd（服务名 `<app>-server`，User=deploy）  
**SSH 用户**：`deploy`（全程，包括 sudo 特权操作）  
**nginx**：SSL 证书自动检测，静态文件 + `/api/*` proxy_pass  
**Elysia 只暴露 `/api/*`，不服务静态文件。**

---

## 前提：deploy 用户 sudo 权限（管理员一次性配置）

deploy 用户需要以下 sudo 权限才能自主完成全部部署步骤：

```bash
# 在服务器上以管理员身份执行（只需一次）：
cat > /etc/sudoers.d/deploy-base << 'SUDOERS'
Defaults:deploy !requiretty
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /usr/bin/systemctl daemon-reload
deploy ALL=(ALL) NOPASSWD: /usr/bin/tee /etc/nginx/conf.d/*, /usr/bin/tee /etc/systemd/system/*
SUDOERS
chmod 440 /etc/sudoers.d/deploy-base
```

每次新增 app 时，`deploy.sh` 会自动在服务器上创建 `/etc/sudoers.d/<app>-deploy`，
授权 `systemctl restart <app>-server`，**不再需要手动操作**。

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
SSH_HOST=your-server.com      # 服务器地址（支持 ~/.ssh/config 别名）
SSH_PORT=22
DEPLOY_KEY=~/.ssh/id_ed25519  # deploy 用户的本地私钥路径

APP_DOMAIN=app.yourdomain.com # 域名（nginx + 验证用）
APP_PORT=3000
REMOTE_DIR=/srv/projects
```

---

## 完整部署流程

1. **本地编译前端** — `bun run build`
2. **本地交叉编译后端** — `bun build --compile --target=bun-linux-x64`
3. **rsync 三类文件**：`web/`、`server/bin/server`、`server/drizzle/`
4. **nginx 配置**（首次自动创建，已有则跳过）
5. **systemd 服务**（首次自动创建并 enable）
6. **重启** — `sudo systemctl restart <app>-server`
7. **reload nginx**
8. **浏览器验证**

---

## SSL 证书

服务器使用 **acme.sh + Let's Encrypt + DNSPod DNS API** 签发通配符证书。

deploy.sh 自动检测 `/etc/nginx/ssl/*/fullchain.cer`：
- 有证书 → HTTPS 配置（443 + HTTP→HTTPS 301）
- 无证书 → HTTP 配置

**签发新证书**（详见 `references/ssl-setup.md`）：
```bash
# 以管理员身份执行（只需一次）
~/.acme.sh/acme.sh --issue --dns dns_dp \
    -d yourdomain.com -d "*.yourdomain.com" --keylength ec-384
~/.acme.sh/acme.sh --install-cert -d yourdomain.com \
    --key-file /etc/nginx/ssl/yourdomain.com/yourdomain.com.key \
    --fullchain-file /etc/nginx/ssl/yourdomain.com/fullchain.cer \
    --reloadcmd "service nginx force-reload"
```

DNS API 密钥存储在服务器 `~/.acme.sh/account.conf`（不在任何仓库中）。

---

## 常见问题

**Permission denied (publickey)**：确认 `DEPLOY_KEY` 对应的公钥已加入服务器 deploy 用户的 `~/.ssh/authorized_keys`

**sudo: command not found 或 permission denied**：deploy 用户缺少 sudo 权限，参考上方"前提"章节配置

**502 Bad Gateway**：后端未启动 →
```bash
ssh -i $DEPLOY_KEY deploy@$SSH_HOST "journalctl -u <app>-server -f"
```

**ENOENT migrations**：`client.ts` 用了 `import.meta.dir` → 改为 `join(process.cwd(), 'drizzle')`
