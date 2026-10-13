#!/usr/bin/env bash
# Prove a Vietverse change did not affect other projects on this host (read-only checks).
#   check-isolation.sh before   snapshot before installing/updating/uninstalling
#   check-isolation.sh after    snapshot after the change
#   check-isolation.sh diff     compare; exit 1 on ANY difference
# Snapshots (~/vietverse/.isolation/{before,after}/):
#   containers.txt  every non-vietverse container: name|image|state|health
#   ports.txt       listening TCP sockets except Vietverse's 127.0.0.1:15081
#   sites.txt       HTTP status of every other nginx server_name (https://<name>/)
set -euo pipefail
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

mode="${1:-}"
case "$mode" in
  before | after | diff) ;;
  *) sed -n '2,10p' "$0"; exit 2 ;;
esac

ISO_DIR="$VV_HOME/.isolation"

snapshot() {
  local dir="$ISO_DIR/$1" tmp
  vv_require_cmd docker ss curl awk sed sort
  mkdir -p "$ISO_DIR"
  tmp="$(mktemp -d "$ISO_DIR/.tmp.XXXXXX")"

  # Uptime text changes every second; keep only stable fields (state + health).
  docker ps -a --format '{{.Names}}|{{.Image}}|{{.State}}|{{.Status}}' |
    awk -F'|' '$1 !~ /^vietverse-/ {
      h = "-"
      if ($4 ~ /\(healthy\)/) h = "healthy"
      else if ($4 ~ /\(unhealthy\)/) h = "unhealthy"
      else if ($4 ~ /health: starting/) h = "starting"
      print $1 "|" $2 "|" $3 "|" h
    }' | sort > "$tmp/containers.txt"

  ss -ltnH | awk '{print $4}' | grep -vx '127.0.0.1:15081' | sort -u > "$tmp/ports.txt" || true

  : > "$tmp/sites.txt"
  local names name code
  names="$(cat /etc/nginx/sites-enabled/* 2>/dev/null |
    sed -nE 's/^[[:space:]]*server_name[[:space:]]+([^;]*);.*/\1/p' |
    tr -s '[:space:]' '\n' |
    grep -vE '^$|^_$|^~|\*|vietverse|^localhost$' | sort -u || true)"
  if [ -z "$names" ]; then
    vv_log "CẢNH BÁO: không đọc được server_name nào trong /etc/nginx/sites-enabled"
  fi
  for name in $names; do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$name/" || true)"
    printf '%s %s\n' "$name" "${code:-000}" >> "$tmp/sites.txt"
  done

  date -Is > "$tmp/taken-at.txt"
  rm -rf "$dir"
  mv "$tmp" "$dir"
  vv_log "đã lưu snapshot '$1' vào $dir: $(wc -l < "$dir/containers.txt") container, $(wc -l < "$dir/ports.txt") port, $(wc -l < "$dir/sites.txt") site"
}

compare() {
  local before="$ISO_DIR/before" after="$ISO_DIR/after" file rc=0
  [ -d "$before" ] && [ -d "$after" ] || vv_die "cần chạy cả 'before' và 'after' trước khi 'diff'"
  vv_log "before: $(cat "$before/taken-at.txt")  after: $(cat "$after/taken-at.txt")"
  for file in containers.txt ports.txt sites.txt; do
    if diff -u "$before/$file" "$after/$file"; then
      vv_log "$file: giống hệt"
    else
      vv_log "$file: KHÁC — dừng lại và hoàn tác bước vừa làm"
      rc=1
    fi
  done
  if [ "$rc" -eq 0 ]; then vv_log "OK: không ảnh hưởng dự án khác"; else vv_log "THẤT BẠI: có khác biệt"; fi
  return "$rc"
}

case "$mode" in
  before | after) snapshot "$mode" ;;
  diff) compare ;;
esac
