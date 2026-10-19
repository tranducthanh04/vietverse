"""Khâu `generate`: sinh MP3 bằng edge-tts cho mọi clip trong manifest (có cache).

- Tên file = sha256(voice|rate|text); file đã tồn tại thì bỏ qua (cache).
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


async def _process_clip(
    clip: dict[str, Any],
    out_dir: Path,
    voice: str,
    rate: str,
    sem: asyncio.Semaphore,
    stats: dict[str, int],
    logger: Callable[[str], None],
) -> None:
    text = clip["text"]
    is_story = clip.get("lyricLines") is not None
    filename = audio_filename(voice, rate, text)
    path = clip_path(out_dir, voice, rate, text)
    boundaries: list[dict[str, Any]] | None = None

    cached = path.is_file() and path.stat().st_size > 0
    if cached:
        stats["cached"] += 1
        if is_story and _sidecar(path).is_file():
            boundaries = json.loads(_sidecar(path).read_text(encoding="utf-8"))
    else:
        async with sem:
            audio, boundaries = await synthesize_with_retry(text, voice, rate)
        path.write_bytes(audio)
        stats["generated"] += 1
        if is_story:
            _sidecar(path).write_text(json.dumps(boundaries, ensure_ascii=False), encoding="utf-8")

    clip["file"] = filename

    if is_story:
        if boundaries is None:
            # Cache hit nhưng thiếu sidecar: sinh lại để lấy boundary cho việc tính mốc.
            async with sem:
                audio, boundaries = await synthesize_with_retry(text, voice, rate)
            path.write_bytes(audio)
            _sidecar(path).write_text(json.dumps(boundaries, ensure_ascii=False), encoding="utf-8")
        duration = probe_duration_sec(path)
        line_times, dur = compute_lyric_times(clip["lyricLines"], boundaries, duration)
        clip["lineTimes"] = line_times
        clip["durationSec"] = dur

    if not looks_like_mp3(path):
        logger(f"[generate] CẢNH BÁO: {filename} không giống file MP3 hợp lệ")


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
        _process_clip(clip, out_dir, voice, rate, sem, stats, logger)
        for content in manifest.get("contents", [])
        for clip in content.get("clips", [])
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
