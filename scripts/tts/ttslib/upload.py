"""Khâu `upload`: đẩy từng MP3 đã sinh lên BE và lưu URL trả về vào manifest.

Dedupe theo tên file: cùng một file chỉ upload một lần (server cũng dedupe theo hash
nội dung, nhưng cache ở client giúp bớt request).
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, Callable


def upload_manifest(
    client: Any,
    manifest: dict[str, Any],
    out_dir: str | Path,
    *,
    logger: Callable[[str], None] = print,
) -> int:
    """Upload mọi clip đã có 'file' nhưng chưa có 'url'. Trả số file thực sự upload."""
    out_dir = Path(out_dir)
    cache: dict[str, str] = {}
    uploaded = 0
    for content in manifest.get("contents", []):
        for clip in content.get("clips", []):
            filename = clip.get("file")
            if not filename or clip.get("url"):
                continue
            if filename in cache:
                clip["url"] = cache[filename]
                continue
            path = out_dir / filename
            if not path.is_file():
                raise FileNotFoundError(f"Thiếu file audio để upload: {path}")
            url = client.upload_audio(path)
            clip["url"] = url
            cache[filename] = url
            uploaded += 1
            logger(f"[upload] {filename} -> {url}")
    logger(f"[upload] Xong: upload {uploaded} file, dùng lại {len(cache) - uploaded} bản trùng")
    return uploaded
