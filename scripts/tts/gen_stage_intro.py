#!/usr/bin/env python3
"""Sinh 5 file MP3 lời chào mở đầu chặng của Sao Lí Lắc (chạy ở MÁY DEV).

Nguồn lời: client/src/features/quest-map/stageIntroScripts.json — ĐÚNG MỘT nơi, dùng chung
với client (stageIntroScripts.ts), nên lời không bị lệch giữa UI và audio.

Mỗi chặng -> client/public/audio/stage-intro/stage-<n>.mp3 bằng edge-tts, giọng và tốc độ lấy
từ chính file JSON (mặc định vi-VN-HoaiMyNeural, rate -10%). In thời lượng từng file; cảnh báo
nếu vượt 16 giây (mục tiêu 8–16 giây).

edge-tts là dịch vụ KHÔNG chính thức của Microsoft; audio sinh ra là audio TẠM. Xem
docs/content-audio-tts.md và scripts/tts/README.md.

Cách chạy (ở máy dev, cần mạng):
    cd scripts/tts
    python -m venv .venv                                   # nếu chưa có
    .venv/Scripts/python.exe -m pip install edge-tts mutagen   # Windows
    .venv/Scripts/python.exe gen_stage_intro.py
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

from ttslib.synth import synthesize_with_retry, probe_duration_sec, looks_like_mp3

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_SCRIPTS = REPO_ROOT / "client" / "src" / "features" / "quest-map" / "stageIntroScripts.json"
DEFAULT_OUT = REPO_ROOT / "client" / "public" / "audio" / "stage-intro"

MIN_SECONDS = 8.0
MAX_SECONDS = 16.0


def _force_utf8_output() -> None:
    # Console Windows mặc định cp1252 không in được tiếng Việt; ép UTF-8.
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def _duration_sec(path: Path) -> float | None:
    """Thời lượng (giây): ffprobe nếu có; nếu không, thử mutagen; None nếu cả hai đều không được."""
    seconds = probe_duration_sec(path)
    if seconds is not None:
        return seconds
    try:
        from mutagen.mp3 import MP3  # lazy: chỉ cần khi không có ffprobe
    except ImportError:
        return None
    try:
        return round(float(MP3(str(path)).info.length), 3)
    except Exception:
        return None


async def _generate(scripts_path: Path, out_dir: Path) -> int:
    data = json.loads(scripts_path.read_text(encoding="utf-8"))
    voice = data.get("voice", "vi-VN-HoaiMyNeural")
    rate = data.get("rate", "-10%")
    stages = sorted(data.get("stages", []), key=lambda s: s["order"])
    if not stages:
        print(f"[stage-intro] Không có chặng nào trong {scripts_path}", file=sys.stderr)
        return 1

    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"[stage-intro] Giọng {voice}, tốc độ {rate}; sinh {len(stages)} file vào {out_dir}")

    warnings = 0
    for stage in stages:
        order = stage["order"]
        text = (stage.get("vi") or "").strip()
        target = out_dir / f"stage-{order}.mp3"
        if not text:
            print(f"[stage-intro] CẢNH BÁO: chặng {order} không có lời 'vi', bỏ qua", file=sys.stderr)
            warnings += 1
            continue

        # edge-tts occasionally throttles consecutive requests ("No audio was received"); be patient
        # and pace the calls so all five clips come through in one run.
        audio, _boundaries = await synthesize_with_retry(text, voice, rate, retries=8, backoff=2.0)
        target.write_bytes(audio)
        await asyncio.sleep(1.5)

        if not looks_like_mp3(target):
            print(f"[stage-intro] CẢNH BÁO: {target.name} không giống file MP3 hợp lệ", file=sys.stderr)
            warnings += 1

        seconds = _duration_sec(target)
        if seconds is None:
            print(f"[stage-intro] stage-{order}.mp3  (không đo được thời lượng — thiếu ffprobe/mutagen)")
        else:
            flag = ""
            if seconds > MAX_SECONDS:
                flag = f"  ⚠ DÀI QUÁ {MAX_SECONDS:.0f}s"
                warnings += 1
            elif seconds < MIN_SECONDS:
                flag = f"  ⚠ ngắn hơn {MIN_SECONDS:.0f}s"
            print(f"[stage-intro] stage-{order}.mp3  {seconds:.2f}s{flag}")

    print(f"[stage-intro] Xong. Cảnh báo: {warnings}.")
    return 1 if warnings else 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="gen_stage_intro.py",
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--scripts", default=str(DEFAULT_SCRIPTS), help="Đường dẫn stageIntroScripts.json")
    parser.add_argument("--out", default=str(DEFAULT_OUT), help="Thư mục chứa MP3 đã sinh")
    return parser


def main(argv: list[str] | None = None) -> int:
    _force_utf8_output()
    args = build_parser().parse_args(argv)
    scripts_path = Path(args.scripts)
    if not scripts_path.is_file():
        print(f"Không tìm thấy file lời: {scripts_path}", file=sys.stderr)
        return 2
    try:
        return asyncio.run(_generate(scripts_path, Path(args.out)))
    except RuntimeError as exc:
        print(f"Lỗi sinh audio: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
