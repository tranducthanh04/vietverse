#!/usr/bin/env bash
# Take an on-demand backup of the `vietverse` DB into ~/vietverse/backups
# (vietverse-manual-<time>.archive.gz; never pruned automatically). Prints the host path.
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

vv_require_cmd docker
[ -f "$VV_COMPOSE_FILE" ] || vv_die "chưa có $VV_COMPOSE_FILE — chạy init.sh/up.sh trước"

out="$(vv_compose exec -T vietverse-backup sh /scripts/dump.sh manual)" ||
  vv_die "backup thất bại (vietverse-backup có đang chạy?)"
path="$VV_HOME/backups/${out##*/}"
[ -s "$path" ] || vv_die "không thấy file backup $path"
vv_log "backup: $path ($(du -h "$path" | cut -f1))"

# Audio volume archive alongside the mongodump (never fails the DB backup).
if aout="$(vv_compose exec -T vietverse-backup sh /scripts/dump-audio.sh manual 2>&1)"; then
  apath="$VV_HOME/backups/${aout##*/}"
  [ -s "$apath" ] && vv_log "backup audio: $apath ($(du -h "$apath" | cut -f1))" ||
    vv_log "CẢNH BÁO: không thấy file backup audio $apath"
else
  vv_log "CẢNH BÁO: backup audio thất bại: $aout"
fi

printf '%s\n' "$path"
