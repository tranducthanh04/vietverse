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
from typing import Any, Callable

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


def _new_activity_instructions(activity: dict[str, Any], *, include_steps: bool = False) -> str:
    """Phản chiếu NewActivityFrame.tsx: nối [prompt, subPrompt, (text từng bước nếu follow_steps)]
    sau khi bỏ phần rỗng, bằng '. ' — đúng chuỗi mà nút nghe của khung đọc khi không có audioUrl."""
    parts: list[Any] = [activity.get("prompt"), activity.get("subPrompt")]
    if include_steps:
        parts.extend(
            step.get("text") for step in (activity.get("steps") or []) if isinstance(step, dict)
        )
    return ". ".join(part for part in parts if isinstance(part, str) and part)


# Với mỗi activity.type, text mà component ở client đọc cho activities[].audioUrl KHI KHÔNG có
# audioUrl (fallback textToSpeak). Khoá theo type, mỗi entry chú thích component nó phản chiếu.
# Loại KHÔNG có trong bảng (drag_match, record_voice) không bao giờ phát activities[].audioUrl
# nên không sinh clip cho ô đó — tránh sinh audio không ai nghe.
LESSON_ACTIVITY_AUDIO_TEXT: dict[str, Callable[[dict[str, Any]], str]] = {
    # WordCardActivity.tsx: nút nghe lớn phát audioUrl, fallback đọc targetWord (thẻ to, thường
    # là CẢ đoạn đọc) — KHÔNG phải prompt. Chính chỗ này sinh sai audioUrl trên prod.
    "word_card": lambda a: str(a.get("targetWord") or ""),
    # ListenChooseActivity.tsx: nút loa đọc prompt.
    "listen_choose": lambda a: str(a.get("prompt") or ""),
    # FillBlankActivity.tsx -> WrongAnswerFeedback: đọc prompt (replay khi chọn sai).
    "fill_blank": lambda a: str(a.get("prompt") or ""),
    # SortOrderActivity.tsx -> WrongAnswerFeedback: đọc prompt.
    "sort_order": lambda a: str(a.get("prompt") or ""),
    # ReviewActivity.tsx -> WrongAnswerFeedback: đọc prompt.
    "review": lambda a: str(a.get("prompt") or ""),
    # MultiSelectActivity.tsx -> NewActivityFrame: đọc prompt + subPrompt.
    "multi_select": _new_activity_instructions,
    # GroupSortActivity.tsx -> NewActivityFrame: đọc prompt + subPrompt.
    "group_sort": _new_activity_instructions,
    # FillBlanksActivity.tsx -> NewActivityFrame: đọc prompt + subPrompt.
    "fill_blanks": _new_activity_instructions,
    # FollowStepsActivity.tsx -> NewActivityFrame: đọc prompt + subPrompt + text từng bước.
    "follow_steps": lambda a: _new_activity_instructions(a, include_steps=True),
}


def replace_allowed(old_clip: dict[str, Any] | None, current_value: Any, new_text: str) -> bool:
    """True nếu được phép THAY giá trị hiện có của một ô audio (replace-from): ô đang giữ đúng URL
    mà lần chạy cũ (`old_clip`) đã ghi cho CHÍNH ô này, VÀ text mới khác text cũ.

    Nhờ vậy chỉ sửa audio do script tự sinh sai trước đó; audio người khác tải lên (URL khác)
    hoặc ô mà lần cũ không ghi (không có `old_clip`) hoặc text không đổi đều được giữ nguyên.
    """
    return bool(
        old_clip
        and old_clip.get("url")
        and isinstance(current_value, str)
        and current_value == old_clip["url"]
        and new_text != str(old_clip.get("text") or "")
    )


def index_clips_by_field(manifest: dict[str, Any] | None) -> dict[tuple[str, str], dict[str, dict[str, Any]]]:
    """Lập chỉ mục (kind, contentId) -> {field: clip} từ một manifest cũ, dùng cho replace-from."""
    index: dict[tuple[str, str], dict[str, dict[str, Any]]] = {}
    for content in (manifest or {}).get("contents", []) or []:
        key = (content.get("kind"), str(content.get("contentId")))
        index[key] = {c["field"]: c for c in (content.get("clips") or []) if c.get("field")}
    return index


def extract_clips(
    kind: str,
    payload: dict[str, Any],
    *,
    old_clips: dict[str, dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Trích danh sách clip cần sinh audio cho một nội dung.

    Mặc định chỉ lấy các ô audioUrl ĐANG TRỐNG. Nếu truyền `old_clips` (bản đồ field -> clip của
    một manifest cũ cho chính nội dung này) thì còn lấy thêm các ô ĐÃ CÓ giá trị nhưng đúng là
    audio do lần chạy cũ tự ghi (giá trị khớp url cũ) và text mới đã khác (replace-from).

    - lesson: text của mỗi activity theo đúng loại (bảng LESSON_ACTIVITY_AUDIO_TEXT; loại không
      phát activities[].audioUrl thì bỏ qua), text của mỗi option có chữ, mỗi từ vựng.
    - story: một clip audio cho CẢ truyện (đọc toàn bộ lyrics), kèm lyricLines để tính mốc.
    - culture: đọc phần giới thiệu (intro).
    """
    clips: list[dict[str, Any]] = []
    old_clips = old_clips or {}

    def add(field: str, current_value: Any, text: str, **extra: Any) -> None:
        text = text or ""
        if is_blank(text):
            return
        if not is_blank(current_value) and not replace_allowed(old_clips.get(field), current_value, text):
            return  # ô đã có audio và không thuộc diện replace-from -> giữ nguyên
        clip = {"field": field, "text": text, "file": None, "url": None}
        clip.update(extra)
        clips.append(clip)

    if kind == "lesson":
        for i, activity in enumerate(payload.get("activities", []) or []):
            text_fn = LESSON_ACTIVITY_AUDIO_TEXT.get(activity.get("type"))
            if text_fn is not None:
                add(f"activities.{i}.audioUrl", activity.get("audioUrl"), text_fn(activity))
            for j, option in enumerate(activity.get("options", []) or []):
                add(f"activities.{i}.options.{j}.audioUrl", option.get("audioUrl"), option.get("text", "") or "")
        for k, word in enumerate(payload.get("vocabulary", []) or []):
            add(f"vocabulary.{k}.audioUrl", word.get("audioUrl"), word.get("word", "") or "")
    elif kind == "story":
        lines = [str(line.get("text", "")) for line in payload.get("lyrics", []) or []]
        if any(line.strip() for line in lines):
            add(
                "audioUrl",
                payload.get("audioUrl"),
                LYRIC_JOINER.join(lines),
                lyricLines=lines,
                durationSec=None,
                lineTimes=None,
            )
    elif kind == "culture":
        add("audioUrl", payload.get("audioUrl"), payload.get("intro", "") or "")
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
