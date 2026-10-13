#!/usr/bin/env bash
# Restore a mongodump gzip archive into the `vietverse` DB of vietverse-mongo ONLY.
#   restore.sh <archive.gz> --yes-replace-vietverse [--from-db <name>] [--no-safety-backup]
#   --from-db <name>   source DB name inside the archive (default: vietverse), e.g. `test`
#                      for an Atlas dump; it is renamed to `vietverse` during restore.
# Collections present in the archive are dropped and replaced (--drop); other collections in
# `vietverse` are left untouched; users/other databases in the archive are ignored.
# The API is stopped during the restore and started again afterwards; indexes are re-applied.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

usage() { sed -n '2,8p' "$0"; exit 2; }
archive="" confirm=0 from_db="vietverse" safety=1
while [ $# -gt 0 ]; do
  case "$1" in
    --yes-replace-vietverse) confirm=1 ;;
    --from-db) [ $# -ge 2 ] || usage; from_db="$2"; shift ;;
    --no-safety-backup) safety=0 ;;
    -h | --help) usage ;;
    -*) vv_die "tham số không hợp lệ: $1" ;;
    *) [ -z "$archive" ] || usage; archive="$1" ;;
  esac
  shift
done
[ -n "$archive" ] || usage
[ -f "$archive" ] && [ -s "$archive" ] || vv_die "không đọc được file archive: $archive"
[[ "$from_db" =~ ^[A-Za-z0-9_-]+$ ]] || vv_die "--from-db không hợp lệ: $from_db"
[ "$confirm" -eq 1 ] || vv_die "restore sẽ THAY THẾ các collection trong DB vietverse. Thêm --yes-replace-vietverse để xác nhận."

vv_require_cmd docker gzip
[ -f "$VV_COMPOSE_FILE" ] || vv_die "chưa có $VV_COMPOSE_FILE — chạy init.sh/up.sh trước"
gzip -t "$archive" || vv_die "archive hỏng hoặc không phải gzip (cần mongodump --archive --gzip)"
vv_wait_healthy vietverse-mongo 60

if [ "$safety" -eq 1 ]; then
  vv_log "backup an toàn trước khi restore…"
  bash "$VV_SELF_DIR/backup-now.sh" >/dev/null
fi

restarted=0
restart_api() {
  if [ "$restarted" -eq 0 ]; then
    restarted=1
    vv_log "khởi động lại vietverse-api"
    vv_compose start vietverse-api >/dev/null || vv_log "CẢNH BÁO: không start được vietverse-api"
  fi
}
trap restart_api EXIT

vv_log "dừng vietverse-api trong lúc restore"
vv_compose stop vietverse-api >/dev/null

vv_log "restore $archive (DB nguồn: $from_db) -> vietverse"
# Root credentials are read inside the container from its own env; the password goes via a
# temporary --config file, never via argv.
vv_compose exec -T -e VV_FROM_DB="$from_db" vietverse-mongo sh -c '
  set -eu
  cfg="$(mktemp)"; trap "rm -f \"$cfg\"" EXIT
  printf "password: \"%s\"\n" "$MONGO_INITDB_ROOT_PASSWORD" > "$cfg"
  set -- --nsInclude "${VV_FROM_DB}.*"
  if [ "$VV_FROM_DB" != "vietverse" ]; then
    set -- "$@" --nsFrom "${VV_FROM_DB}.*" --nsTo "vietverse.*"
  fi
  mongorestore --quiet --username "$MONGO_INITDB_ROOT_USERNAME" --authenticationDatabase admin \
    --config "$cfg" --archive --gzip --drop "$@"
' < "$archive"

restart_api
vv_wait_healthy vietverse-api 180
vv_log "áp dụng lại indexes"
vv_compose exec -T vietverse-api node dist/seeds/prepareDeploymentIndexes.js --apply >/dev/null ||
  vv_die "deploy:indexes thất bại sau restore — kiểm tra conflict index thủ công"
vv_log "restore xong. Đối soát số document từng collection trước khi mở traffic."
