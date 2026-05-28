#!/usr/bin/env bash
set -euo pipefail

# acme-init.sh — 检测并初始化 acme.sh + 通配符 SSL 证书
#
# 行为（幂等）：
#   acme.sh 已装 + 证书已存在 → 输出状态，直接退出
#   acme.sh 已装 + 证书不存在 → 签发并安装证书
#   acme.sh 未装               → 安装 acme.sh + 配置 DNSPod 凭证 + 签发并安装证书
#
# 用法：bash scripts/acme-init.sh
# 前提：root@SSH_HOST 支持 SSH 密钥登录（与 DEPLOY_KEY 相同，或另行配置）

CONF="$HOME/.config/ship/server.conf"

if [[ ! -f "$CONF" ]]; then
  echo "错误：找不到配置文件 $CONF" >&2
  echo "请先运行 deploy.sh 或手动创建该文件，包含 SSH_HOST / DEPLOY_KEY / BASE_DOMAIN" >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$CONF"

SSH_HOST="${SSH_HOST:?配置缺少 SSH_HOST}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_KEY="${DEPLOY_KEY:-$HOME/.ssh/id_ed25519}"
BASE_DOMAIN="${BASE_DOMAIN:?配置缺少 BASE_DOMAIN}"

# 通过 root 用户执行远程命令
rssh() {
  ssh \
    -p "$SSH_PORT" \
    -i "$DEPLOY_KEY" \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=10 \
    "root@$SSH_HOST" \
    "$@"
}

echo "==> 检测服务器 acme.sh 安装状态..."

ACME_OK=$(rssh '[ -f ~/.acme.sh/acme.sh ] && echo yes || echo no')
CERT_OK=$(rssh "[ -f /etc/nginx/ssl/$BASE_DOMAIN/fullchain.cer ] && echo yes || echo no")

# 均已就绪，无需操作
if [[ "$ACME_OK" == yes && "$CERT_OK" == yes ]]; then
  echo "✓ acme.sh 已安装，通配符证书已存在，无需初始化"
  rssh '~/.acme.sh/acme.sh --list' 2>/dev/null || true
  exit 0
fi

# ── 如果 acme.sh 未安装，先安装并配置 DNSPod 凭证 ──────────────
if [[ "$ACME_OK" == no ]]; then
  echo "→ acme.sh 未安装，开始初始化..."

  # 读取本地缓存的 DNSPod 凭证
  DP_CONF="$HOME/.config/ship/dnspod.conf"
  if [[ -f "$DP_CONF" ]]; then
    # shellcheck source=/dev/null
    source "$DP_CONF"
  fi

  if [[ -z "${DP_Id:-}" || -z "${DP_Key:-}" ]]; then
    echo ""
    echo "需要 DNSPod API 凭证（DNS-01 验证签发通配符证书必需）"
    echo "获取地址：https://console.dnspod.cn/account/token/apikey"
    read -rp "DP_Id: " DP_Id
    read -rp "DP_Key: " DP_Key
    mkdir -p "$(dirname "$DP_CONF")"
    printf 'DP_Id=%s\nDP_Key=%s\n' "$DP_Id" "$DP_Key" > "$DP_CONF"
    chmod 600 "$DP_CONF"
    echo "✓ 凭证已保存到 $DP_CONF"
  fi

  echo "==> 安装 acme.sh..."
  rssh "curl -fsSL https://get.acme.sh | sh -s email=admin@$BASE_DOMAIN"

  echo "==> 写入 DNSPod 凭证到服务器..."
  rssh "bash -s" <<REMOTE
grep -q '^export DP_Id=' ~/.acme.sh/account.conf 2>/dev/null \
  || echo 'export DP_Id=${DP_Id}' >> ~/.acme.sh/account.conf
grep -q '^export DP_Key=' ~/.acme.sh/account.conf 2>/dev/null \
  || echo 'export DP_Key=${DP_Key}' >> ~/.acme.sh/account.conf
REMOTE
fi

# ── 签发 + 安装通配符证书 ────────────────────────────────────────
echo "==> 签发通配符证书：$BASE_DOMAIN 和 *.$BASE_DOMAIN"
rssh "~/.acme.sh/acme.sh --issue \
  --dns dns_dp \
  -d $BASE_DOMAIN \
  -d '*.$BASE_DOMAIN' \
  --keylength ec-384"

echo "==> 安装证书到 nginx 路径..."
rssh "bash -s" <<REMOTE
mkdir -p /etc/nginx/ssl/$BASE_DOMAIN
~/.acme.sh/acme.sh --install-cert -d $BASE_DOMAIN \
  --key-file      /etc/nginx/ssl/$BASE_DOMAIN/$BASE_DOMAIN.key \
  --fullchain-file /etc/nginx/ssl/$BASE_DOMAIN/fullchain.cer \
  --reloadcmd 'service nginx force-reload'
REMOTE

echo ""
echo "✓ SSL 证书初始化完成"
echo "  证书：/etc/nginx/ssl/$BASE_DOMAIN/fullchain.cer"
echo "  密钥：/etc/nginx/ssl/$BASE_DOMAIN/$BASE_DOMAIN.key"
echo "  续期：acme.sh crontab 自动处理"
