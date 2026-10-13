#!/usr/bin/env bash
# Shared helpers for the Vietverse self-host scripts. Sourced, not executed.
# Every docker command here is scoped to Compose project "vietverse" or to images
# labelled io.vietverse.project=vietverse / named vietverse/*. No global prune anywhere.

VV_HOME="${VIETVERSE_HOME:-$HOME/vietverse}"
VV_APP="$VV_HOME/app"
VV_ENV="$VV_HOME/.env"
VV_COMPOSE_FILE="$VV_HOME/compose.yml"
VV_PROJECT="vietverse"
VV_SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

vv_log() { printf '[vietverse] %s\n' "$*"; }
vv_die() { printf '[vietverse] LỖI: %s\n' "$*" >&2; exit 1; }

vv_require_cmd() {
  local cmd
  for cmd in "$@"; do
    command -v "$cmd" >/dev/null 2>&1 || vv_die "thiếu lệnh '$cmd'"
  done
}

# The scripts must run from the checkout at ~/vietverse/app (compose build context is ./app).
vv_require_layout() {
  local expected actual
  expected="$(cd "$VV_APP/deploy/selfhost" 2>/dev/null && pwd -P)" ||
    vv_die "không thấy $VV_APP/deploy/selfhost — clone repo vào $VV_APP trước"
  actual="$(cd "$VV_SELF_DIR" && pwd -P)"
  [ "$expected" = "$actual" ] ||
    vv_die "script phải chạy từ $VV_APP/deploy/selfhost (đang ở $actual)"
}

# Copy the tracked compose file next to .env (compose resolves ./app, ./backups from there).
vv_install_compose() {
  install -m 644 "$VV_APP/deploy/selfhost/compose.yml" "$VV_COMPOSE_FILE"
}

vv_compose() {
  docker compose --project-name "$VV_PROJECT" --project-directory "$VV_HOME" \
    --file "$VV_COMPOSE_FILE" "$@"
}

# Read KEY from .env (last assignment wins); prints nothing if missing.
vv_env_get() {
  local key="$1"
  [ -f "$VV_ENV" ] || return 0
  sed -n "s/^${key}=//p" "$VV_ENV" | tail -n 1
}

# Set KEY=VALUE in .env (VALUE must not contain '|' or newlines; we only write hex/sha/ids).
vv_env_set() {
  local key="$1" value="$2"
  case "$value" in *'|'* | *$'\n'*) vv_die "giá trị không hợp lệ cho $key" ;; esac
  if grep -q "^${key}=" "$VV_ENV"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$VV_ENV"
  else
    printf '%s=%s\n' "$key" "$value" >> "$VV_ENV"
  fi
}

vv_require_env() {
  [ -f "$VV_ENV" ] || vv_die "chưa có $VV_ENV — chạy init.sh trước"
  local key value missing=()
  for key in MONGO_ROOT_USERNAME MONGO_ROOT_PASSWORD MONGO_APP_USERNAME MONGO_APP_PASSWORD \
             MONGO_BACKUP_USERNAME MONGO_BACKUP_PASSWORD JWT_SECRET JWT_REFRESH_SECRET CLIENT_ORIGIN; do
    value="$(vv_env_get "$key")"
    if [ -z "$value" ] || [ "$value" = "__GENERATE__" ]; then missing+=("$key"); fi
  done
  [ "${#missing[@]}" -eq 0 ] || vv_die "thiếu giá trị trong .env: ${missing[*]}"
  case "$(vv_env_get CLIENT_ORIGIN)" in https://*) ;; *) vv_die "CLIENT_ORIGIN phải là https://..." ;; esac
}

# Wait until a vietverse-* container reports healthy (or fail with its last logs).
vv_wait_healthy() {
  local name="$1" timeout="${2:-180}" waited=0 status
  case "$name" in vietverse-*) ;; *) vv_die "chỉ chờ container vietverse-*" ;; esac
  while :; do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$name" 2>/dev/null || echo missing)"
    [ "$status" = "healthy" ] && { vv_log "$name: healthy"; return 0; }
    if [ "$waited" -ge "$timeout" ]; then
      docker logs --tail 50 "$name" >&2 || true
      vv_die "$name chưa healthy sau ${timeout}s (trạng thái: $status)"
    fi
    sleep 5
    waited=$((waited + 5))
  done
}
