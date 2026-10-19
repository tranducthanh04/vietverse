#!/bin/sh
# Runs inside vietverse-backup. Writes one gzip tar of the audio volume to /backups.
# Usage: dump-audio.sh daily|manual   -> prints the archive path on success.
# The audio volume is mounted read-only at $AUDIO_SRC (default /audio).
set -eu

kind="${1:-daily}"
case "$kind" in
  daily) prefix="vietverse-audio" ;;
  manual) prefix="vietverse-audio-manual" ;;
  *) echo "Usage: dump-audio.sh daily|manual" >&2; exit 2 ;;
esac
src="${AUDIO_SRC:-/audio}"
[ -d "$src" ] || { echo "Không thấy thư mục audio: $src" >&2; exit 2; }

umask 077
name="${prefix}-$(date +%Y-%m-%d_%H%M%S).tar.gz"
tmp="/backups/.partial-${name}"
trap 'rm -f "$tmp"' EXIT
# -C so entries are relative to the volume root (recordings/, content/) for a clean restore.
tar -czf "$tmp" -C "$src" .
mv "$tmp" "/backups/${name}"
echo "/backups/${name}"
