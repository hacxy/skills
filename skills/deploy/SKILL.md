---
name: deploy
description: >
  通过 GitHub Actions + rsync over SSH 将项目部署到远程 VPS。首次部署时引导用户
  填写服务器信息并持久化到本地，后续部署自动读取无需重复填写。
  当用户说"部署"、"deploy"、"发布"、"上线"、"push to production"、"go live"、
  "配置部署"、"生成 CI/CD"、"创建 GitHub Actions"，或任何涉及将代码部署到服务器
  的请求时，务必使用此 skill。
---

## 定位

```
... → test → [deploy]
```

服务器配置持久化在 `~/.deploy-config.json`（用户级，跨项目复用），敏感信息不进入代码库。

## 第一步：检查服务器配置

```bash
bash "$SKILL_DIR/scripts/check-config.sh"
```

- `configured: true` → 直接进入第二步
- `configured: false` → 进入**首次配置**流程

### 首次配置（仅执行一次）

向用户一次性询问以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 服务器 IP / 域名 | SSH 连接地址 | `1.2.3.4` |
| SSH 用户名 | 登录服务器的用户 | `root` |
| 部署用户名 | GitHub Actions 使用的用户 | `deploy` |
| 项目根目录 | 服务器上存放项目的路径 | `/srv/projects` |
| 域名模式 | 子域名格式 | `*.example.com` |
| 部署 SSH 私钥路径 | 服务器上 CI/CD 用的私钥 | `/home/deploy/.ssh/github_actions` |
| SSH 别名（可选） | `~/.ssh/config` 中配置的别名 | `myserver` |

收集完成后保存：

```bash
bash "$SKILL_DIR/scripts/save-config.sh" \
  "<server_host>" "<ssh_user>" "<deploy_user>" \
  "<projects_root>" "<domain_pattern>" \
  "<ssh_key_path>" "<ssh_alias>"
```

配置保存至 `~/.deploy-config.json`，权限设为 600，不进入 git。

## 第二步：检测服务器环境

在编译二进制之前，先检测服务器的 OS 和 libc 类型：

```bash
CONFIG=$(bash "$SKILL_DIR/scripts/check-config.sh")
SERVER=$(echo $CONFIG | jq -r .server_host)
SSH_USER=$(echo $CONFIG | jq -r .ssh_user)
ssh -p ${SSH_PORT:-22} $SSH_USER@$SERVER "uname -m && cat /etc/os-release | grep '^ID='"
```

根据结果选择编译目标：

| 服务器 OS | 架构 | Bun 编译目标 |
|----------|------|------------|
| Ubuntu / Debian (glibc) | x86_64 | `bun-linux-x64` |
| Ubuntu / Debian (glibc) | arm64 | `bun-linux-arm64` |
| Alpine (musl) | x86_64 | `bun-linux-x64-musl` |
| Alpine (musl) | arm64 | `bun-linux-arm64-musl` |

## 第三步：分析项目

```bash
bash "$SKILL_DIR/scripts/analyze-project.sh" .
```

输出 `pkg_manager`、`build_cmd`、`build_output`、`project_type`、`is_monorepo`。

**LLM 复核：** 若项目为 monorepo 或有非标准构建输出，读取 `vite.config.ts` / `next.config.js` 等配置文件修正 `build_output` 和 `project_type`。

## 第四步：确认部署信息

根据配置和项目分析结果，向用户确认：

- **项目名**：从目录名转换为 kebab-case
- **子域名**：`<project-name>.<domain_pattern 的主域>`
- **部署目录**：`<projects_root>/<project-name>`
- **端口**（后端 / SSR）：自动分配，避免与已有服务冲突

## 第五步：服务器初始化（首次部署）

通过 SSH 在服务器上执行（LLM 处理，需要判断）：

```bash
CONFIG=$(bash "$SKILL_DIR/scripts/check-config.sh")
SERVER=$(echo $CONFIG | jq -r .server_host)
SSH_USER=$(echo $CONFIG | jq -r .ssh_user)
DEPLOY_USER=$(echo $CONFIG | jq -r .deploy_user)

ssh $SSH_USER@$SERVER "
  # 创建部署目录
  mkdir -p <projects_root>/<project-name>
  chown $DEPLOY_USER:$DEPLOY_USER <projects_root>/<project-name>

  # 确认 SSL 证书存在（wildcard 或指定域名）
  ls /etc/nginx/ssl/ || echo '需要手动配置 SSL'

  # 写入 nginx 配置（根据 project_type 选择模板）
  # 后端/SSR 项目额外创建 systemd service
"
```

**Nginx 模板选择：**
- `static` / `ssr 构建后`：反向代理到 `dist/` 或 `out/`，SPA 路由使用 `try_files /index.html =404`（**不要用 `$uri/`**，避免静态目录导致 403）
- `backend` / `ssr 运行时`：反向代理到 `localhost:<port>`，需要 systemd service

## 第六步：生成 GitHub Actions Workflow

```bash
CONFIG=$(bash "$SKILL_DIR/scripts/check-config.sh")
bash "$SKILL_DIR/scripts/gen-workflow.sh" \
  "<pkg_manager>" "<build_output>" "<project-name>" "<project_type>" \
  "$(echo $CONFIG | jq -r .deploy_user)" \
  "$(echo $CONFIG | jq -r .projects_root)" \
  "[port]"
```

**LLM 复核：** 检查生成的 workflow，如有需要：
- Bun 后端编译为二进制：替换 build/deploy 步骤
- 无构建步骤的项目：移除 build steps，直接 rsync 源码
- 需要构建时环境变量：在 workflow 中添加

## 第七步：设置 GitHub Secrets

通过 gh CLI 设置（LLM 处理）：

```bash
CONFIG=$(bash "$SKILL_DIR/scripts/check-config.sh")
gh secret set SSH_HOST --body "$(echo $CONFIG | jq -r .server_host)"
gh secret set SSH_PRIVATE_KEY --body "$(ssh $SSH_USER@$SERVER 'cat <ssh_key_path>')"
```

## 第八步：提交、推送并验证（LLM 处理）

1. 提交 workflow 文件并推送
2. 监控运行状态：
   ```bash
   gh run list --limit 1
   gh run watch
   ```
3. 若失败，查看日志并修复：
   ```bash
   gh run view <run-id> --log-failed
   ```
4. 验证部署结果：
   ```bash
   CONFIG=$(bash "$SKILL_DIR/scripts/check-config.sh")
   ssh $(echo $CONFIG | jq -r .ssh_user)@$(echo $CONFIG | jq -r .server_host) \
     "ls -la $(echo $CONFIG | jq -r .projects_root)/<project-name>/ | head -5"
   ```
5. 新子域名需添加 DNS A 记录指向服务器 IP

## 关键规则

- **始终用 rsync**，不用 appleboy action 或 scp
- **始终包含 `workflow_dispatch`**，支持手动触发
- **Secrets 存 GitHub，不进文件**
- **SPA nginx 禁用 `$uri/`**，用 `try_files /index.html =404`
- **workflow 跑成功才算完成**，不能只提交代码就结束
