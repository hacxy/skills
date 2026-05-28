---
name: deploy
description: >
  通过 SSH 密钥将 ship 项目部署到目标服务器。SSH 登录用户固定为 deploy。
  使用全局配置文件 ~/.config/ship/server.conf（所有项目共用）。
  域名自动生成为 <app>.<BASE_DOMAIN>，端口从 3000 自动递增，目录固定 /srv/projects。
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

**进程管理**：systemd，服务名 `<app>-server`，User=deploy  
**SSH 用户**：`deploy`（全程，包括 sudo 特权操作）  
**nginx**：SSL 证书自动检测，静态文件 + `/api/*` proxy_pass  
**Elysia 只暴露 `/api/*`，不服务静态文件。**

---

## 全局配置文件（所有项目共用）

`~/.config/ship/server.conf`（本地私有，不提交仓库）：

```bash
SSH_HOST=your-server.com      # 服务器地址（支持 ~/.ssh/config 别名）
SSH_PORT=22
DEPLOY_KEY=~/.ssh/id_ed25519  # deploy 用户的本地私钥路径

BASE_DOMAIN=hacxy.cn          # 基础域名（应用部署到 <app>.<BASE_DOMAIN>）
```

首次运行 `deploy.sh` 自动生成此文件，填写后重新运行即可。

**脚本自动处理的内容（无需配置）：**
- `APP_DOMAIN` = `<app>.<BASE_DOMAIN>`（自动生成）
- `REMOTE_DIR` = `/srv/projects`（固定）
- `APP_PORT` = 从 3000 起自动检测下一个可用端口，已有服务保持原端口

---

## 部署方式

### 手动部署（本地执行）

```bash
bash "$SKILL_DIR/scripts/deploy.sh" <project-dir> [app-name]
```

### GitHub Actions 自动部署（推荐）

一次性配置，之后 push 到 main 分支自动触发：

```bash
bash "$SKILL_DIR/scripts/setup-github-deploy.sh" <project-dir> [app-name]
```

脚本自动完成：
1. 生成 GitHub Actions 专用 SSH 密钥（`~/.config/ship/github-deploy.key`，所有项目共用）
2. 将公钥添加到服务器 deploy 用户
3. 在项目中生成 `.github/workflows/deploy.yml`
4. 通过 `gh` CLI 自动写入 GitHub Secrets：`DEPLOY_SSH_KEY`、`SSH_HOST`、`SSH_PORT`、`BASE_DOMAIN`

前提：已安装并登录 GitHub CLI（`brew install gh && gh auth login`）。

配置完成后，push 到 main 分支即可自动部署，也支持在 GitHub Actions 页面手动触发。

app-name 默认取项目目录名。

---

## 完整部署流程

1. 读取 `~/.config/ship/server.conf`，自动推导 domain、port、remote path
2. **本地编译前端** — `bun run build`
3. **本地交叉编译后端** — `bun build --compile --target=bun-linux-x64`
4. **rsync 三类文件**：`web/`、`server/bin/server`、`server/drizzle/`
5. **nginx 配置**（首次自动创建，已有则跳过）
6. **systemd 服务**（首次自动创建并 enable，同时配置 sudo 权限）
7. **重启** — `sudo systemctl restart <app>-server`
8. **reload nginx**
9. **浏览器验证**

---

## 前提：deploy 用户 sudo 基础权限（管理员一次性配置）

```bash
# 服务器上执行（只需一次）
cat > /etc/sudoers.d/deploy-base << 'SUDOERS'
Defaults:deploy !requiretty
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /usr/bin/systemctl daemon-reload
deploy ALL=(ALL) NOPASSWD: /usr/bin/tee /etc/nginx/conf.d/*, /usr/bin/tee /etc/systemd/system/*
SUDOERS
chmod 440 /etc/sudoers.d/deploy-base
```

每个新 app 部署时，脚本自动在服务器创建 `/etc/sudoers.d/<app>-deploy`。

---

## SSL 证书

服务器使用 acme.sh + Let's Encrypt + DNSPod DNS API 签发通配符证书。
详见 `references/ssl-setup.md`。

脚本自动检测 `/etc/nginx/ssl/*/fullchain.cer`：有则生成 HTTPS 配置，无则 HTTP。

---

## 常见问题

**Permission denied (publickey)**：确认 `DEPLOY_KEY` 对应的公钥已加入服务器 deploy 用户的 `~/.ssh/authorized_keys`

**sudo 权限不足**：参考上方"前提"章节，以管理员身份配置 deploy-base sudoers

**502 Bad Gateway**：后端未启动 →
```bash
ssh -i $DEPLOY_KEY deploy@$SSH_HOST "journalctl -u <app>-server -f"
```

**ENOENT migrations**：`client.ts` 用了 `import.meta.dir` → 改为 `join(process.cwd(), 'drizzle')`
