#!/bin/sh
# Runs inside vietverse-backup. Writes one gzip archive of the `vietverse` DB to /backups.
# Usage: dump.sh daily|manual   -> prints the archive path on success.
set -eu

kind="${1:-daily}"
case "$kind" in
  daily) prefix="vietverse" ;;
  manual) prefix="vietverse-manual" ;;
  *) echo "Usage: dump.sh daily|manual" >&2; exit 2 ;;
esac
: "${MONGO_BACKUP_USERNAME:?missing}"
: "${MONGO_BACKUP_PASSWORD:?missing}"

umask 077
name="${prefix}-$(date +%Y-%m-%d_%H%M%S).archive.gz"
tmp="/backups/.partial-${name}"
cfg="$(mktemp)"
trap 'rm -f "$cfg" "$tmp"' EXIT
# Password via --config file, not argv (argv is visible to every host user via ps).
printf 'password: "%s"\n' "$MONGO_BACKUP_PASSWORD" > "$cfg"

mongodump --quiet \
  --host vietverse-mongo:27017 \
  --username "$MONGO_BACKUP_USERNAME" \
  --authenticationDatabase admin \
  --config "$cfg" \
  --db vietverse \
  --gzip --archive="$tmp"

mv "$tmp" "/backups/${name}"
echo "/backups/${name}"
