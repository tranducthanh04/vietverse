#!/usr/bin/env bash
# First-time (and repeatable) setup of the Vietverse self-host stack. Idempotent:
#  - creates ~/vietverse/{backups,.isolation}
#  - creates ~/vietverse/.env from .env.example and fills every __GENERATE__ secret (never
#    overwrites an existing value), chmod 600
#  - starts MongoDB only: keyfile (once) -> mongod rs0 -> rs.initiate (once) + app/backup users
# Does NOT build or start the API/web (use up.sh) and needs no sudo.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

vv_require_cmd docker openssl install sed grep
docker compose version >/dev/null 2>&1 || vv_die "cần Docker Compose v2 (docker compose)"
vv_require_layout

umask 077
mkdir -p "$VV_HOME/backups" "$VV_HOME/.isolation"
chmod 700 "$VV_HOME" "$VV_HOME/backups" "$VV_HOME/.isolation"

if [ ! -f "$VV_ENV" ]; then
  install -m 600 "$VV_APP/deploy/selfhost/.env.example" "$VV_ENV"
  vv_log "đã tạo $VV_ENV từ .env.example"
fi
chmod 600 "$VV_ENV"

generated=()
fill_secret() { # KEY BYTES
  if [ "$(vv_env_get "$1")" = "__GENERATE__" ] || ! grep -q "^$1=" "$VV_ENV"; then
    vv_env_set "$1" "$(openssl rand -hex "$2")"
    generated+=("$1")
  fi
}
fill_secret MONGO_ROOT_PASSWORD 32
fill_secret MONGO_APP_PASSWORD 32
fill_secret MONGO_BACKUP_PASSWORD 32
fill_secret JWT_SECRET 48
fill_secret JWT_REFRESH_SECRET 48
vv_env_set VV_UID "$(id -u)"
vv_env_set VV_GID "$(id -g)"
if [ "${#generated[@]}" -gt 0 ]; then
  vv_log "đã sinh secret mới: ${generated[*]} (giá trị chỉ nằm trong $VV_ENV)"
else
  vv_log "giữ nguyên secret hiện có trong $VV_ENV"
fi

for key in MONGO_ROOT_PASSWORD MONGO_APP_PASSWORD MONGO_BACKUP_PASSWORD; do
  [[ "$(vv_env_get "$key")" =~ ^[A-Za-z0-9]+$ ]] || vv_die "$key chỉ được chứa chữ/số (dùng trong MONGODB_URI)"
done
vv_require_env

vv_install_compose
vv_compose config --quiet || vv_die "compose.yml/.env không hợp lệ"

vv_log "khởi động MongoDB (keyfile -> mongod rs0 -> init users)…"
vv_compose up -d vietverse-mongo-init
code="$(docker wait vietverse-mongo-init)"
if [ "$code" != "0" ]; then
  docker logs --tail 50 vietverse-mongo-init >&2 || true
  vv_die "vietverse-mongo-init thất bại (exit $code)"
fi
docker logs --tail 5 vietverse-mongo-init
vv_wait_healthy vietverse-mongo 180

cat <<EOF

[vietverse] MongoDB sẵn sàng (rs0, auth, chỉ trong network vietverse_net).
Bước tiếp theo:
  1. Mở $VV_ENV (chmod 600) và điền GOOGLE_CLIENT_ID, CLOUDINARY_*, PAYOS_* nếu dùng.
  2. $VV_APP/deploy/selfhost/check-isolation.sh before   (nếu chưa chụp trạng thái trước)
  3. $VV_APP/deploy/selfhost/up.sh
EOF
