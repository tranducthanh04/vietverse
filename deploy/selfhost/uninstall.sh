#!/usr/bin/env bash
# Remove everything Vietverse created in Docker: containers, network vietverse_net, volumes
# vietverse_* (ALL DATABASE DATA) and vietverse/* images. Touches nothing of other projects.
#   uninstall.sh --yes
# Does not delete ~/vietverse (backups live there) and cannot do the sudo steps; it prints them.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

[ "${1:-}" = "--yes" ] && [ $# -eq 1 ] || {
  sed -n '2,5p' "$0"
  vv_die "từ chối chạy khi thiếu --yes. Copy backup mới nhất ra ngoài máy trước khi gỡ."
}
vv_require_cmd docker

compose_file="$VV_COMPOSE_FILE"
[ -f "$compose_file" ] || compose_file="$VV_APP/deploy/selfhost/compose.yml"
[ -f "$compose_file" ] || vv_die "không thấy compose.yml của vietverse"

vv_log "docker compose down -v (chỉ project vietverse)"
# Interpolation needs the .env values only to parse the file; fall back to dummies if it is gone.
if [ -f "$VV_ENV" ]; then
  docker compose --project-name "$VV_PROJECT" --project-directory "$VV_HOME" --file "$compose_file" \
    down --volumes --remove-orphans
else
  MONGO_ROOT_USERNAME=x MONGO_ROOT_PASSWORD=x MONGO_APP_PASSWORD=x MONGO_BACKUP_PASSWORD=x \
  JWT_SECRET=x JWT_REFRESH_SECRET=x CLIENT_ORIGIN=https://x \
  docker compose --project-name "$VV_PROJECT" --project-directory "$VV_HOME" --file "$compose_file" \
    down --volumes --remove-orphans
fi

vv_log "xóa image vietverse/*"
{
  docker image ls --filter 'label=io.vietverse.project=vietverse' --format '{{.ID}}'
  docker image ls --format '{{.Repository}}:{{.Tag}}' | grep -E '^vietverse/(api|web):' || true
} | sort -u | while read -r ref; do
  [ -n "$ref" ] || continue
  docker image rm -f "$ref" >/dev/null 2>&1 && vv_log "đã xóa $ref" || true
done

leftover="$(docker ps -a --format '{{.Names}}' | grep '^vietverse-' || true)"
[ -z "$leftover" ] || vv_log "CẢNH BÁO: còn container: $leftover"
docker volume ls --format '{{.Name}}' | grep '^vietverse_' && vv_log "CẢNH BÁO: còn volume ở trên" || true
docker network ls --format '{{.Name}}' | grep -x 'vietverse_net' && vv_log "CẢNH BÁO: còn network vietverse_net" || true

cat <<EOF

[vietverse] Đã gỡ phần Docker. Phần còn lại:
  1. (anhduong) Sau khi đã copy backup ra ngoài:  rm -rf $VV_HOME
  2. (chủ máy, sudo):
       sudo rm /etc/nginx/sites-enabled/vietverse.conf /etc/nginx/sites-available/vietverse.conf
       sudo nginx -t && sudo systemctl reload nginx
       sudo certbot delete --cert-name vietverse.io.vn
  3. Xóa DNS record vietverse.io.vn / www.vietverse.io.vn (nếu không dùng nữa).
  4. Chạy lại check-isolation (bản lưu ở nơi khác) và so với trạng thái trước khi gỡ.
EOF
