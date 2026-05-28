---
name: deploy
description: >
  通过 SSH 密钥将 ship 项目部署到目标服务器。SSH 登录用户固定为 deploy。
  首次部署一键完成：服务器配置 + GitHub 私有仓库 + CI/CD + 自动推送。
  后续只需 git push，GitHub Actions 自动构建并部署。
  当用户说"部署"、"deploy"、"发布"、"上线"，或 ship workflow Stage 10 时使用。
---

## 部署架构

```
/srv/projects/<app>/
├── web/           ← 前端静态文件（nginx 直接服务）
└── server/
    ├── sqlite.db  ← 数据库（WorkingDirectory = server/）
    ├── bin/server ← Bun 编译的 Linux x64 原生二进制
    └── drizzle/   ← 迁移文件
```

**进程管理**：systemd（服务名 `<app>-server`，User=deploy）  
**SSH 用户**：`deploy`（全程，包括 sudo 特权操作）  
**nginx**：SSL 证书自动检测，静态文件 + /api/* proxy_pass

---

## 全局配置文件

`~/.config/ship/server.conf`（所有项目共用，不提交仓库）：

```bash
SSH_HOST=your-server.com      # 支持 ~/.ssh/config 别名
SSH_PORT=22
DEPLOY_KEY=~/.ssh/id_ed25519  # deploy 用户私钥

BASE_DOMAIN=hacxy.cn          # 应用部署到 <app>.<BASE_DOMAIN>
```

首次运行 `deploy.sh` 自动生成此文件。脚本自动处理：域名、目录（/srv/projects）、端口（3000 起自动递增）。

---

## 首次部署（一键完成）

```bash
bash "$SKILL_DIR/scripts/setup-github-deploy.sh" <project-dir> [app-name]
```

自动完成 6 个步骤：

1. **服务器基础设施**：nginx conf + systemd service（via SSH，幂等）
2. **GitHub Actions 部署密钥**：生成/复用 `~/.config/ship/github-deploy.key`
3. **创建 GitHub 私有仓库**（gh repo create --private）
4. **生成** `.github/workflows/deploy.yml`
5. **配置 GitHub Secrets**（gh secret set）：`DEPLOY_SSH_KEY`、`SSH_HOST`、`SSH_PORT`、`BASE_DOMAIN`
6. **commit + push** → 触发首次自动部署

前提：gh CLI 已安装并登录（`brew install gh && gh auth login`）。

---

## 后续部署

```bash
git push   # 推送到 main 分支，GitHub Actions 自动构建并部署
```

---

## 手动部署（备用）

```bash
bash "$SKILL_DIR/scripts/deploy.sh" <project-dir> [app-name]
```

---

## 前提：deploy 用户 sudo 权限（管理员一次性配置）

```bash
cat > /etc/sudoers.d/deploy-base << 'SUDOERS'
Defaults:deploy !requiretty
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /usr/bin/systemctl daemon-reload
deploy ALL=(ALL) NOPASSWD: /usr/bin/tee /etc/nginx/conf.d/*, /usr/bin/tee /etc/systemd/system/*
SUDOERS
chmod 440 /etc/sudoers.d/deploy-base
```

---

## SSL 证书

acme.sh + Let's Encrypt + DNSPod DNS API，详见 `references/ssl-setup.md`。  
脚本自动检测证书，有则生成 HTTPS 配置，无则 HTTP。

---

## 常见问题

**Permission denied (publickey)**：确认私钥公钥已加入服务器 deploy 用户 ~/.ssh/authorized_keys

**sudo 权限不足**：参考上方"前提"章节配置 deploy-base sudoers

**502**：`ssh deploy@$SSH_HOST "journalctl -u <app>-server -f"`

**ENOENT migrations**：client.ts 用了 import.meta.dir，改为 join(process.cwd(), 'drizzle')
