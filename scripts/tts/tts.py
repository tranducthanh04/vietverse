#!/usr/bin/env python3
"""CLI sinh audio tiếng Việt cho Vietverse bằng edge-tts (chạy ở MÁY DEV).

Các lệnh:
  export    Đăng nhập admin, đọc nội dung đã xuất bản, ghi ô audioUrl trống ra manifest.
  generate  Sinh MP3 bằng edge-tts cho mọi clip trong manifest (có cache).
  upload    Đẩy MP3 lên BE (POST /api/v1/admin/content/audio), lưu URL vào manifest.
  apply     Gắn audioUrl (và mốc lyrics) qua luồng draft -> publish. MẶC ĐỊNH dry-run.

Tài khoản admin lấy từ biến môi trường, KHÔNG ghi ra file:
  VIETVERSE_ADMIN_EMAIL, VIETVERSE_ADMIN_PASSWORD
API base: cờ --api-base hoặc biến VIETVERSE_API_BASE (mặc định http://localhost:5093).

edge-tts là dịch vụ KHÔNG chính thức của Microsoft; audio sinh ra là audio TẠM, nên
thay bằng giọng thu thật khi có. Xem docs/content-audio-tts.md.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from ttslib import manifest as manifest_mod
from ttslib.api import VietverseClient, ApiError

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUT = SCRIPT_DIR / "out"
DEFAULT_MANIFEST = DEFAULT_OUT / "manifest.json"
DEFAULT_VOICE = "vi-VN-HoaiMyNeural"
DEFAULT_RATE = "-10%"
DEFAULT_API_BASE = os.environ.get("VIETVERSE_API_BASE", "http://localhost:5093")

BACKUP_REMINDER = (
    "\n*** NHẮC SAO LƯU DB ***\n"
    "Trước khi --apply (ghi và xuất bản nội dung), hãy backup database:\n"
    "    deploy/selfhost/backup-now.sh\n"
    "rồi chạy lại kèm cờ --i-have-backup để xác nhận đã sao lưu.\n"
)


def _make_client(args: argparse.Namespace) -> VietverseClient:
    email = os.environ.get("VIETVERSE_ADMIN_EMAIL")
    password = os.environ.get("VIETVERSE_ADMIN_PASSWORD")
    if not email or not password:
        print("Thiếu VIETVERSE_ADMIN_EMAIL / VIETVERSE_ADMIN_PASSWORD trong môi trường.", file=sys.stderr)
        raise SystemExit(2)
    client = VietverseClient(args.api_base)
    client.login(email, password)
    return client


def cmd_export(args: argparse.Namespace) -> int:
    from ttslib.export import build_manifest
    client = _make_client(args)
    data = build_manifest(client, args.api_base)
    manifest_mod.save(args.manifest, data)
    print(f"[export] Đã ghi manifest: {args.manifest}")
    return 0


def cmd_generate(args: argparse.Namespace) -> int:
    from ttslib.generate import generate
    data = manifest_mod.load(args.manifest)
    generate(data, args.out, voice=args.voice, rate=args.rate, concurrency=args.concurrency)
    out_manifest = args.out_manifest or (Path(args.out) / "manifest.json")
    manifest_mod.save(out_manifest, data)
    print(f"[generate] Đã ghi manifest kèm audio: {out_manifest}")
    return 0


def cmd_upload(args: argparse.Namespace) -> int:
    from ttslib.upload import upload_manifest
    client = _make_client(args)
    data = manifest_mod.load(args.manifest)
    upload_manifest(client, data, args.out)
    manifest_mod.save(args.manifest, data)
    print(f"[upload] Đã cập nhật URL vào manifest: {args.manifest}")
    return 0


def cmd_apply(args: argparse.Namespace) -> int:
    from ttslib.apply import apply_manifest
    if args.apply and not args.i_have_backup:
        print(BACKUP_REMINDER, file=sys.stderr)
        print("Từ chối --apply vì chưa có --i-have-backup.", file=sys.stderr)
        return 2
    client = _make_client(args)
    data = manifest_mod.load(args.manifest)
    dry_run = not args.apply
    if dry_run:
        print("[apply] Chế độ DRY-RUN (chỉ in kế hoạch, không ghi). Thêm --apply để ghi thật.")
    results = apply_manifest(client, data, dry_run=dry_run, actor_id=client.user_id)
    applied = sum(1 for r in results if r["status"] == "applied")
    planned = sum(1 for r in results if r["status"] == "planned")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    errors = [r for r in results if r["status"] == "error"]
    print(f"[apply] Kết quả: áp dụng {applied}, dự kiến {planned}, bỏ qua {skipped}, lỗi {len(errors)}")
    for r in errors:
        print(f"[apply]   LỖI {r['kind']} {r['contentId']} ({r['title']}): {r['detail']}", file=sys.stderr)
    # Trả mã khác 0 nếu có nội dung lỗi để người chạy biết cần xem lại.
    return 1 if errors else 0


def _add_common(parser: argparse.ArgumentParser, *, need_out: bool = True) -> None:
    parser.add_argument("--api-base", default=DEFAULT_API_BASE, help="URL gốc của API (vd http://localhost:5093)")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST), help="Đường dẫn manifest.json")
    if need_out:
        parser.add_argument("--out", default=str(DEFAULT_OUT), help="Thư mục chứa MP3 đã sinh")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="tts.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    p_export = sub.add_parser("export", help="Xuất ô audioUrl trống ra manifest")
    _add_common(p_export, need_out=False)
    p_export.set_defaults(func=cmd_export)

    p_generate = sub.add_parser("generate", help="Sinh MP3 bằng edge-tts")
    _add_common(p_generate)
    p_generate.add_argument("--voice", default=DEFAULT_VOICE, help="Giọng edge-tts")
    p_generate.add_argument("--rate", default=DEFAULT_RATE, help="Tốc độ đọc, vd -10%%")
    p_generate.add_argument("--concurrency", type=int, default=4, help="Số request đồng thời tối đa")
    p_generate.add_argument("--out-manifest", default=None, help="Nơi ghi manifest kèm audio (mặc định <out>/manifest.json)")
    p_generate.set_defaults(func=cmd_generate)

    p_upload = sub.add_parser("upload", help="Upload MP3 lên BE, lưu URL vào manifest")
    _add_common(p_upload)
    p_upload.set_defaults(func=cmd_upload)

    p_apply = sub.add_parser("apply", help="Gắn audioUrl qua draft->publish (mặc định dry-run)")
    _add_common(p_apply, need_out=False)
    p_apply.add_argument("--apply", action="store_true", help="Ghi thật (không có cờ này là dry-run)")
    p_apply.add_argument("--i-have-backup", action="store_true", help="Xác nhận đã backup DB trước khi --apply")
    p_apply.set_defaults(func=cmd_apply)

    return parser


def _force_utf8_output() -> None:
    # Console Windows mặc định cp1252 không in được tiếng Việt; ép UTF-8.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def main(argv: list[str] | None = None) -> int:
    _force_utf8_output()
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except ApiError as exc:
        print(f"Lỗi API: {exc}", file=sys.stderr)
        return 1
    except FileNotFoundError as exc:
        print(f"Lỗi file: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
