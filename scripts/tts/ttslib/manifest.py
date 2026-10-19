"""Mô hình manifest và trích các ô audioUrl đang trống từ payload nội dung.

Manifest (out/manifest.json) mô tả mọi chỗ cần audio:

    {
      "generatedAt": "2026-10-19T10:00:00+07:00",
      "apiBase": "http://localhost:5093",
      "voice": "vi-VN-HoaiMyNeural",   # generate điền
      "rate": "-10%",                   # generate điền
      "contents": [
        {
          "kind": "lesson"|"story"|"culture",
          "contentId": "...", "contentVersion": 3, "title": "...",
          "clips": [
            {"field": "activities.0.audioUrl", "text": "...",
             "file": null, "url": null,
             # chỉ clip audio cả truyện mới có:
             "lyricLines": ["...", "..."], "durationSec": null, "lineTimes": null}
          ]
        }
      ]
    }

`field` là đường dẫn chấm trong payload nơi sẽ gắn URL audio (số = chỉ số mảng).
Các hàm trích/đọc/ghi ở đây thuần nên test được không cần mạng.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

# Nối các dòng lyrics bằng xuống dòng để edge-tts ngắt nghỉ giữa các dòng.
LYRIC_JOINER = "\n"


def _parse_path(path: str) -> list[str | int]:
    return [int(part) if part.isdigit() else part for part in path.split(".")]


def get_by_path(obj: Any, path: str) -> Any:
    """Đọc giá trị theo đường dẫn chấm; trả None nếu bất kỳ mắt xích nào không tồn tại."""
    cur = obj
    for key in _parse_path(path):
        if isinstance(key, int):
            if not isinstance(cur, list) or key < 0 or key >= len(cur):
                return None
            cur = cur[key]
        else:
            if not isinstance(cur, dict) or key not in cur:
                return None
            cur = cur[key]
    return cur


def set_by_path(obj: Any, path: str, value: Any) -> None:
    """Ghi giá trị theo đường dẫn chấm. Ném KeyError/IndexError nếu đường dẫn không tồn tại."""
    keys = _parse_path(path)
    cur = obj
    for key in keys[:-1]:
        cur = cur[key]
    cur[keys[-1]] = value


def is_blank(value: Any) -> bool:
    """True nếu giá trị không phải chuỗi có nội dung (coi như ô audio đang trống)."""
    return not (isinstance(value, str) and value.strip())


def extract_clips(kind: str, payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Trích danh sách clip cần sinh audio cho một nội dung (chỉ các ô audioUrl đang trống).

    - lesson: prompt của mỗi activity, text của mỗi option có chữ, mỗi từ vựng.
    - story: một clip audio cho CẢ truyện (đọc toàn bộ lyrics), kèm lyricLines để tính mốc.
    - culture: đọc phần giới thiệu (intro).
    """
    clips: list[dict[str, Any]] = []

    def add(field: str, text: str, **extra: Any) -> None:
        if is_blank(text):
            return
        clip = {"field": field, "text": text, "file": None, "url": None}
        clip.update(extra)
        clips.append(clip)

    if kind == "lesson":
        for i, activity in enumerate(payload.get("activities", []) or []):
            if is_blank(activity.get("audioUrl")):
                add(f"activities.{i}.audioUrl", activity.get("prompt", ""))
            for j, option in enumerate(activity.get("options", []) or []):
                if is_blank(option.get("audioUrl")):
                    add(f"activities.{i}.options.{j}.audioUrl", option.get("text", "") or "")
        for k, word in enumerate(payload.get("vocabulary", []) or []):
            if is_blank(word.get("audioUrl")):
                add(f"vocabulary.{k}.audioUrl", word.get("word", "") or "")
    elif kind == "story":
        if is_blank(payload.get("audioUrl")):
            lines = [str(line.get("text", "")) for line in payload.get("lyrics", []) or []]
            if any(line.strip() for line in lines):
                add(
                    "audioUrl",
                    LYRIC_JOINER.join(lines),
                    lyricLines=lines,
                    durationSec=None,
                    lineTimes=None,
                )
    elif kind == "culture":
        if is_blank(payload.get("audioUrl")):
            add("audioUrl", payload.get("intro", "") or "")
    else:
        raise ValueError(f"kind không hợp lệ: {kind!r}")

    return clips


def now_iso() -> str:
    """Thời điểm hiện tại theo múi giờ Việt Nam, dạng ISO 8601."""
    return datetime.now(timezone(timedelta(hours=7))).isoformat(timespec="seconds")


def new_manifest(api_base: str) -> dict[str, Any]:
    return {
        "generatedAt": now_iso(),
        "apiBase": api_base,
        "voice": None,
        "rate": None,
        "contents": [],
    }


def load(path: str | Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save(path: str | Path, manifest: dict[str, Any]) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with open(target, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
