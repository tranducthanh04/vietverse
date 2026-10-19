"""Khâu `generate`: sinh MP3 bằng edge-tts cho mọi clip trong manifest (có cache).

- Tên file = sha256(voice|rate|text); file đã tồn tại thì bỏ qua (cache).
- Các clip TRÙNG (cùng voice|rate|text, kể cả khác nội dung) được GỘP: synth một lần rồi
  điền kết quả cho mọi clip trong nhóm, tránh sinh lại cùng một file (M-3).
- Giới hạn số request đồng thời bằng semaphore; mỗi clip retry khi lỗi.
- Với clip audio cả truyện (có 'lyricLines'): lưu kèm sidecar boundaries để tính mốc lyrics,
  điền 'lineTimes' và 'durationSec' vào clip.
"""
from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any, Callable

from .naming import audio_filename, clip_path
from .synth import synthesize_with_retry, probe_duration_sec, looks_like_mp3
from .timing import compute_lyric_times


def _sidecar(path: Path) -> Path:
    return path.with_suffix(".boundaries.json")


async def _process_group(
    clips: list[dict[str, Any]],
    out_dir: Path,
    voice: str,
    rate: str,
    sem: asyncio.Semaphore,
    stats: dict[str, int],
    logger: Callable[[str], None],
) -> None:
    """Sinh (hoặc dùng lại cache) MỘT file audio cho một nhóm clip trùng text, rồi điền
    kết quả cho mọi clip trong nhóm. Nhóm cần boundary nếu có bất kỳ clip truyện nào."""
    text = clips[0]["text"]
    needs_boundaries = any(clip.get("lyricLines") is not None for clip in clips)
    filename = audio_filename(voice, rate, text)
    path = clip_path(out_dir, voice, rate, text)
    boundaries: list[dict[str, Any]] | None = None

    cached = path.is_file() and path.stat().st_size > 0
    if cached:
        stats["cached"] += 1
        if needs_boundaries and _sidecar(path).is_file():
            boundaries = json.loads(_sidecar(path).read_text(encoding="utf-8"))
    else:
        async with sem:
            audio, boundaries = await synthesize_with_retry(text, voice, rate)
        path.write_bytes(audio)
        stats["generated"] += 1
        if needs_boundaries:
            _sidecar(path).write_text(json.dumps(boundaries, ensure_ascii=False), encoding="utf-8")

    if needs_boundaries and boundaries is None:
        # Cache hit nhưng thiếu sidecar: sinh lại để lấy boundary cho việc tính mốc.
        async with sem:
            audio, boundaries = await synthesize_with_retry(text, voice, rate)
        path.write_bytes(audio)
        _sidecar(path).write_text(json.dumps(boundaries, ensure_ascii=False), encoding="utf-8")

    duration = probe_duration_sec(path) if needs_boundaries else None
    for clip in clips:
        clip["file"] = filename
        if clip.get("lyricLines") is not None:
            line_times, dur = compute_lyric_times(clip["lyricLines"], boundaries or [], duration)
            clip["lineTimes"] = line_times
            clip["durationSec"] = dur

    if not looks_like_mp3(path):
        logger(f"[generate] CẢNH BÁO: {filename} không giống file MP3 hợp lệ")


def _group_clips(manifest: dict[str, Any], voice: str, rate: str) -> list[list[dict[str, Any]]]:
    """Gộp clip theo khoá sha256(voice|rate|text) để không synth trùng (M-3)."""
    groups: dict[str, list[dict[str, Any]]] = {}
    for content in manifest.get("contents", []):
        for clip in content.get("clips", []):
            key = audio_filename(voice, rate, clip["text"])
            groups.setdefault(key, []).append(clip)
    return list(groups.values())


async def _run(
    manifest: dict[str, Any],
    out_dir: Path,
    voice: str,
    rate: str,
    concurrency: int,
    logger: Callable[[str], None],
) -> dict[str, int]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(max(1, concurrency))
    stats = {"generated": 0, "cached": 0}
    tasks = [
        _process_group(group, out_dir, voice, rate, sem, stats, logger)
        for group in _group_clips(manifest, voice, rate)
    ]
    await asyncio.gather(*tasks)
    return stats


def generate(
    manifest: dict[str, Any],
    out_dir: str | Path,
    *,
    voice: str,
    rate: str,
    concurrency: int = 4,
    logger: Callable[[str], None] = print,
) -> dict[str, int]:
    """Sinh audio cho manifest (mutate tại chỗ: điền file/lineTimes/durationSec). Trả thống kê."""
    manifest["voice"] = voice
    manifest["rate"] = rate
    stats = asyncio.run(_run(manifest, Path(out_dir), voice, rate, concurrency, logger))
    logger(f"[generate] Xong: sinh mới {stats['generated']}, dùng lại cache {stats['cached']}")
    return stats
