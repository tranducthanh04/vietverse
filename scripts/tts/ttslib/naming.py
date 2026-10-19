"""Đặt tên file audio theo hash nội dung và kiểm tra cache.

Tên file cache ở máy dev = sha256(voice|rate|text). Hai lần sinh cùng giọng, cùng tốc
độ, cùng text luôn ra cùng tên nên có thể bỏ qua khi file đã tồn tại. (Server lại đặt
tên theo sha256 của chính nội dung file khi upload — đó là việc của phase 01.)
"""
from __future__ import annotations

import hashlib
from pathlib import Path

ALLOWED_EXT = {"mp3", "m4a", "ogg", "wav"}


def clip_hash(voice: str, rate: str, text: str) -> str:
    """Trả về sha256 hex của 'voice|rate|text' (ổn định, không phụ thuộc hệ điều hành)."""
    digest = hashlib.sha256(f"{voice}|{rate}|{text}".encode("utf-8"))
    return digest.hexdigest()


def audio_filename(voice: str, rate: str, text: str, ext: str = "mp3") -> str:
    """Tên file audio cho một clip, ví dụ '<sha256>.mp3'."""
    if ext not in ALLOWED_EXT:
        raise ValueError(f"Định dạng không hỗ trợ: {ext!r} (chỉ {sorted(ALLOWED_EXT)})")
    return f"{clip_hash(voice, rate, text)}.{ext}"


def is_cached(out_dir: str | Path, voice: str, rate: str, text: str, ext: str = "mp3") -> bool:
    """True nếu file audio của clip đã tồn tại trong out_dir (đã sinh rồi -> bỏ qua)."""
    path = Path(out_dir) / audio_filename(voice, rate, text, ext)
    return path.is_file() and path.stat().st_size > 0


def clip_path(out_dir: str | Path, voice: str, rate: str, text: str, ext: str = "mp3") -> Path:
    """Đường dẫn tuyệt đối tới file audio của clip trong out_dir."""
    return Path(out_dir) / audio_filename(voice, rate, text, ext)
