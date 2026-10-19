"""Sinh audio bằng edge-tts: đọc một đoạn text, trả về bytes MP3 và các sự kiện WordBoundary.

edge-tts được import TRỄ trong hàm để các module/khâu khác (export, apply, test timing...)
chạy được khi máy chưa cài edge-tts. edge-tts là dịch vụ KHÔNG chính thức, cần mạng.
"""
from __future__ import annotations

import asyncio
import subprocess
from pathlib import Path
from typing import Any

from .timing import Boundary


async def synthesize(text: str, voice: str, rate: str) -> tuple[bytes, list[Boundary]]:
    """Đọc `text` thành MP3. Trả (audio_bytes, boundaries). Không ghi file.

    Yêu cầu edge-tts phát WordBoundary (mặc định của thư viện là SentenceBoundary) để tính
    mốc lyrics theo từng từ. Nếu một giọng không trả WordBoundary thì vẫn nhận SentenceBoundary
    làm phương án dự phòng; cả hai loại đều có offset/duration tính bằng tick 100 ns.
    """
    import edge_tts  # lazy import

    communicate = edge_tts.Communicate(text, voice=voice, rate=rate, boundary="WordBoundary")
    audio = bytearray()
    boundaries: list[Boundary] = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
            boundaries.append({
                "offset": int(chunk["offset"]),
                "duration": int(chunk["duration"]),
                "text": chunk.get("text", ""),
            })
    if not audio:
        raise RuntimeError(f"edge-tts không trả audio cho text (dài {len(text)} ký tự)")
    return bytes(audio), boundaries


async def synthesize_with_retry(
    text: str, voice: str, rate: str, *, retries: int = 3, backoff: float = 1.5,
) -> tuple[bytes, list[Boundary]]:
    """Như synthesize nhưng thử lại khi lỗi mạng/tạm thời."""
    last: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return await synthesize(text, voice, rate)
        except Exception as exc:  # edge-tts/aiohttp nhiều loại lỗi -> thử lại
            last = exc
            if attempt < retries:
                await asyncio.sleep(backoff * attempt)
    raise RuntimeError(f"Sinh audio thất bại sau {retries} lần: {last}") from last


def looks_like_mp3(path: str | Path) -> bool:
    """Kiểm tra nhanh file có header ID3 hoặc frame-sync MPEG (không cần ffprobe)."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(3)
    except OSError:
        return False
    if head[:3] == b"ID3":
        return True
    # Frame sync MPEG: byte đầu 0xFF, byte sau 0xE0..0xFF.
    return len(head) >= 2 and head[0] == 0xFF and (head[1] & 0xE0) == 0xE0


def probe_duration_sec(path: str | Path) -> float | None:
    """Thời lượng (giây) bằng ffprobe nếu có; None nếu không có ffprobe hoặc lỗi."""
    try:
        out = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
            capture_output=True, text=True, timeout=30,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    value = out.stdout.strip()
    try:
        return round(float(value), 3)
    except ValueError:
        return None


def run_async(coro: Any) -> Any:
    """Chạy một coroutine, dùng được cả khi đã/chưa có event loop."""
    return asyncio.run(coro)
