# SSL 证书签发与管理

本服务器使用 **acme.sh + Let's Encrypt + DNSPod DNS API** 签发通配符证书。

---

## 一键初始化（推荐）

```bash
bash "$SKILL_DIR/scripts/acme-init.sh"
```

脚本会自动检测服务器状态并按需执行：

| 当前状态 | 脚本行为 |
|----------|---------|
| acme.sh 已装 + 证书已存在 | 输出证书状态，直接退出（幂等） |
| acme.sh 已装 + 证书不存在 | 签发并安装通配符证书 |
| acme.sh 未装 | 安装 acme.sh → 配置 DNSPod 凭证 → 签发 → 安装 |

**前提条件：**

- `~/.config/ship/server.conf` 已配置 `SSH_HOST`、`DEPLOY_KEY`、`BASE_DOMAIN`
- 服务器 root 用户支持 SSH 密钥登录（与 `DEPLOY_KEY` 一致，或通过 `/root/.ssh/authorized_keys` 单独配置）
- DNSPod API 凭证（首次运行时脚本会提示输入，并保存至 `~/.config/ship/dnspod.conf`）

**获取 DNSPod API 凭证：**  
https://console.dnspod.cn/account/token/apikey

---

## 证书信息

| 项目 | 值 |
|------|---|
| 工具 | acme.sh |
| CA | Let's Encrypt |
| 证书类型 | 通配符（`*.yourdomain.com`） |
| 密钥算法 | EC-384 |
| 证书路径 | `/etc/nginx/ssl/yourdomain.com/fullchain.cer` |
| 密钥路径 | `/etc/nginx/ssl/yourdomain.com/yourdomain.com.key` |
| DNS API | DNSPod（`dns_dp`）|
| 自动续期 | acme.sh crontab 自动处理 |

---

## 手动操作参考

如需手动执行各步骤（SSH 进服务器后操作）：

### 安装 acme.sh

```bash
ssh root@server

curl -fsSL https://get.acme.sh | sh -s email=admin@yourdomain.com
```

### 配置 DNSPod 凭证

```bash
# 写入 acme.sh 账户配置（首次需要）
echo 'export DP_Id=your-dp-id' >> ~/.acme.sh/account.conf
echo 'export DP_Key=your-dp-key' >> ~/.acme.sh/account.conf
```

### 签发通配符证书

```bash
~/.acme.sh/acme.sh --issue \
    --dns dns_dp \
    -d yourdomain.com \
    -d "*.yourdomain.com" \
    --keylength ec-384
```

### 安装到 nginx 路径

```bash
mkdir -p /etc/nginx/ssl/yourdomain.com

~/.acme.sh/acme.sh --install-cert \
    -d yourdomain.com \
    --key-file /etc/nginx/ssl/yourdomain.com/yourdomain.com.key \
    --fullchain-file /etc/nginx/ssl/yourdomain.com/fullchain.cer \
    --reloadcmd "service nginx force-reload"
```

### 续期

自动续期由 acme.sh crontab 处理，无需手动操作：

```bash
crontab -l  # 查看：48 21 * * * ~/.acme.sh/acme.sh --cron ...
```

手动触发续期测试：

```bash
~/.acme.sh/acme.sh --renew -d yourdomain.com --force
```

---

## nginx 证书引用

`deploy.sh` 自动检测服务器上的 SSL 证书并生成对应的 nginx 配置：
- 有 `/etc/nginx/ssl/*/fullchain.cer` → 生成 HTTPS 配置（443 + 301 跳转）
- 无 → 生成 HTTP 配置

生成的 nginx 配置引用已有的通配符证书，无需为每个子域名单独签发。

### nginx 配置模板（HTTPS）

```nginx
server {
    server_name app.yourdomain.com;
    root /srv/projects/app/web;

    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location /api/ { proxy_pass http://127.0.0.1:3000; }

    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/yourdomain.com/fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com/yourdomain.com.key;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
}
server {
    listen 80;
    server_name app.yourdomain.com;
    return 301 https://$host$request_uri;
}
```
