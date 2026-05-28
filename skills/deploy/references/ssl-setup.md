# SSL 证书签发与管理

本服务器使用 **acme.sh + Let's Encrypt + DNSPod DNS API** 签发通配符证书。

## 当前证书信息

| 项目 | 值 |
|------|---|
| 工具 | acme.sh |
| CA | Let's Encrypt |
| 证书类型 | 通配符（`*.yourdomain.com`） |
| 密钥算法 | EC-384 |
| 证书路径 | `/etc/nginx/ssl/yourdomain.com/fullchain.cer` |
| 密钥路径 | `/etc/nginx/ssl/yourdomain.com/yourdomain.com.key` |
| DNS API | DNSPod（`dns_dp`）|
| 自动续期 | crontab 每日 21:48 |

## 为新域名签发证书

### 前提

DNSPod API 密钥存储在 `~/.acme.sh/account.conf`（服务器本地，不在任何仓库中）。

### 签发通配符证书

```bash
# SSH 进服务器
ssh root@server

# 签发（DNS 验证，自动写入 DNSPod TXT 记录）
~/.acme.sh/acme.sh --issue \
    --dns dns_dp \
    -d yourdomain.com \
    -d "*.yourdomain.com" \
    --keylength ec-384

# 创建证书目录
mkdir -p /etc/nginx/ssl/yourdomain.com

# 安装到 nginx 路径，并设置 reload hook（续期后自动 reload）
~/.acme.sh/acme.sh --install-cert \
    -d yourdomain.com \
    --key-file /etc/nginx/ssl/yourdomain.com/yourdomain.com.key \
    --fullchain-file /etc/nginx/ssl/yourdomain.com/fullchain.cer \
    --reloadcmd "service nginx force-reload"
```

### 续期

自动续期由 crontab 处理，无需手动操作：
```bash
crontab -l  # 查看：48 21 * * * ~/.acme.sh/acme.sh --cron ...
```

手动触发续期测试：
```bash
~/.acme.sh/acme.sh --renew -d yourdomain.com --force
```

## 在新 nginx 配置中引用证书

deploy.sh 自动检测服务器上的 SSL 证书并生成对应的 nginx 配置：
- 有 `/etc/nginx/ssl/*/fullchain.cer` → 生成 HTTPS 配置（443 + 301 跳转）
- 无 → 生成 HTTP 配置

生成的 nginx 配置会引用已有的通配符证书，无需为每个子域名单独签发。

## nginx 配置模板（HTTPS）

```nginx
server {
    server_name app.yourdomain.com;
    root /srv/projects/app/web;

    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location /api/ { proxy_pass http://127.0.0.1:3000; ... }

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
