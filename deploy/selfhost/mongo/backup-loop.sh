#!/bin/sh
# vietverse-backup entrypoint: one daily dump at/after BACKUP_HOUR (TZ of the container),
# keeps the BACKUP_KEEP newest daily archives. Manual archives (vietverse-manual-*) are never
# pruned automatically. No host cron/systemd involved.
set -u

HOUR="${BACKUP_HOUR:-2}"
KEEP="${BACKUP_KEEP:-14}"
case "$HOUR" in ''|*[!0-9]*) echo "BACKUP_HOUR không hợp lệ: $HOUR" >&2; exit 2 ;; esac
case "$KEEP" in ''|*[!0-9]*) echo "BACKUP_KEEP không hợp lệ: $KEEP" >&2; exit 2 ;; esac
[ "$HOUR" -le 23 ] || { echo "BACKUP_HOUR phải 0-23" >&2; exit 2; }
[ "$KEEP" -ge 1 ] || { echo "BACKUP_KEEP phải >= 1" >&2; exit 2; }

ALIVE=/tmp/vv-backup-alive
FAILED=/tmp/vv-backup-failed

prune() {
  # Daily archives sort chronologically by name (vietverse-YYYY-MM-DD_HHMMSS.archive.gz).
  ls -1 /backups/vietverse-[0-9]*.archive.gz 2>/dev/null | sort -r | tail -n +"$((KEEP + 1))" |
    while IFS= read -r old; do rm -f -- "$old" && echo "Đã xóa backup cũ: $old"; done
}

echo "vietverse-backup: giờ chạy ${HOUR}:00, giữ ${KEEP} bản, TZ=${TZ:-UTC}"
while true; do
  touch "$ALIVE"
  today="$(date +%Y-%m-%d)"
  hour_now="$(date +%H | sed 's/^0//')"
  if [ "${hour_now:-0}" -ge "$HOUR" ] && ! ls /backups/vietverse-"$today"_*.archive.gz >/dev/null 2>&1; then
    if out="$(sh /scripts/dump.sh daily 2>&1)"; then
      echo "Backup OK: $out"
      rm -f "$FAILED"
      prune
    else
      echo "Backup THẤT BẠI: $out" >&2
      touch "$FAILED"
    fi
  fi
  sleep 600
done
