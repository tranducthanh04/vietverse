#!/usr/bin/env bash
# Build and (re)start the Vietverse stack at the current git commit.
#   up.sh [--pull]      --pull: git pull --ff-only in ~/vietverse/app first
# Steps: build vietverse/{api,web}:<short sha> -> up -d -> wait healthy -> apply indexes
# (additive only) -> remove older vietverse images except the current and previous tag.
# Rollback: see docs/self-host-deployment.md ("Rollback bản build").
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

pull=0
for arg in "$@"; do
  case "$arg" in
    --pull) pull=1 ;;
    -h | --help) sed -n '2,6p' "$0"; exit 0 ;;
    *) vv_die "tham số không hợp lệ: $arg (chỉ hỗ trợ --pull)" ;;
  esac
done

vv_require_cmd docker git install sed grep awk
docker compose version >/dev/null 2>&1 || vv_die "cần Docker Compose v2 (docker compose)"
vv_require_layout
vv_require_env

if [ "$pull" -eq 1 ]; then
  vv_log "git pull --ff-only trong $VV_APP"
  git -C "$VV_APP" pull --ff-only
fi

tag="$(git -C "$VV_APP" rev-parse --short=12 HEAD)"
if [ -n "$(git -C "$VV_APP" status --porcelain --untracked-files=no)" ]; then
  vv_log "CẢNH BÁO: $VV_APP có thay đổi chưa commit; image $tag không khớp đúng commit"
fi
current="$(vv_env_get VIETVERSE_TAG)"
previous="$(vv_env_get VIETVERSE_PREVIOUS_TAG)"
if [ -n "$current" ] && [ "$current" != "$tag" ] && [ "$current" != "latest" ]; then
  previous="$current"
fi

vv_install_compose
# Docker would create a missing bind-mount source as root; keep it owned by this user.
mkdir -p "$VV_HOME/backups"
export VIETVERSE_TAG="$tag"
vv_compose config --quiet || vv_die "compose.yml/.env không hợp lệ"

vv_log "build vietverse/api:$tag và vietverse/web:$tag"
vv_compose build vietverse-api vietverse-web

# Record the tag before starting so .env always names what is (being) deployed and
# a plain `docker compose up -d` later reuses these exact images.
vv_env_set VIETVERSE_TAG "$tag"
vv_env_set VIETVERSE_PREVIOUS_TAG "$previous"
vv_log "khởi động stack (rollback: đặt VIETVERSE_TAG=${previous:-<tag cũ>} trong .env rồi docker compose up -d)"
vv_compose up -d --remove-orphans

vv_wait_healthy vietverse-mongo 180
vv_wait_healthy vietverse-api 180
vv_wait_healthy vietverse-web 60

vv_log "áp dụng indexes (chỉ thêm, không xóa/sửa index có sẵn)"
vv_compose exec -T vietverse-api node dist/seeds/prepareDeploymentIndexes.js --apply >/dev/null ||
  vv_die "deploy:indexes thất bại — xem 'docker logs vietverse-api'; stack vẫn chạy bản $tag"

vv_log "dọn image vietverse cũ (giữ $tag${previous:+ và $previous})"
keep_re="^vietverse/(api|web):(${tag}${previous:+|$previous})\$"
docker image ls --filter 'label=io.vietverse.project=vietverse' --format '{{.Repository}}:{{.Tag}} {{.ID}}' |
  while read -r ref id; do
    case "$ref" in
      vietverse/api:* | vietverse/web:*)
        if [[ "$ref" =~ $keep_re ]]; then continue; fi
        if docker image rm "$ref" >/dev/null; then vv_log "đã xóa $ref"; else vv_log "bỏ qua $ref (đang dùng?)"; fi
        ;;
      '<none>:<none>')
        docker image rm "$id" >/dev/null 2>&1 && vv_log "đã xóa image vietverse không tag $id" || true
        ;;
    esac
  done

curl_status() { curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" || echo "000"; }
if command -v curl >/dev/null 2>&1; then
  vv_log "smoke: /healthz=$(curl_status http://127.0.0.1:15081/healthz) /=$(curl_status http://127.0.0.1:15081/) /api/v1/culture=$(curl_status http://127.0.0.1:15081/api/v1/culture)"
fi
vv_log "xong: đang chạy vietverse/*:$tag. Nhớ chạy check-isolation.sh after && check-isolation.sh diff"
