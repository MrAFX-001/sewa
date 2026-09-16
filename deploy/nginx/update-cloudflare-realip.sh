#!/usr/bin/env bash
# Writes /etc/nginx/conf.d/cloudflare-realip.conf so $remote_addr becomes the
# visitor's IP (from CF-Connecting-IP) instead of a Cloudflare edge IP.
# Without this every visitor behind the same Cloudflare edge shares one
# rate-limit bucket. Run with sudo; re-run occasionally (e.g. monthly cron).
set -euo pipefail
OUT=/etc/nginx/conf.d/cloudflare-realip.conf
TMP=$(mktemp)

# If the DTU NAT rewrites the source address (check the first column of
# /var/log/nginx/access.log: Cloudflare IPs = no rewrite), add it here:
EXTRA_TRUSTED="${EXTRA_TRUSTED:-}"   # e.g. EXTRA_TRUSTED="10.50.0.10"

{
  echo "# generated $(date -Is) by update-cloudflare-realip.sh"
  for ip in $(curl -fsS https://www.cloudflare.com/ips-v4) $(curl -fsS https://www.cloudflare.com/ips-v6); do
    echo "set_real_ip_from $ip;"
  done
  for ip in $EXTRA_TRUSTED; do echo "set_real_ip_from $ip;"; done
  echo "real_ip_header CF-Connecting-IP;"
} > "$TMP"

grep -q set_real_ip_from "$TMP" || { echo "download failed, not replacing"; exit 1; }
install -m 644 "$TMP" "$OUT"
nginx -t && systemctl reload nginx
echo "updated $OUT"
