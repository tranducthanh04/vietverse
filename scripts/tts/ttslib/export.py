"""Khâu `export`: đọc nội dung đã xuất bản và ghi các ô audioUrl trống ra manifest."""
from __future__ import annotations

from typing import Any, Callable

from .manifest import extract_clips, index_clips_by_field, new_manifest

CONTENT_KINDS = ("lesson", "story", "culture")


def build_manifest(
    client: Any,
    api_base: str,
    *,
    replace_from: dict[str, Any] | None = None,
    logger: Callable[[str], None] = print,
) -> dict[str, Any]:
    """Quét lesson/story/culture, trích ô audio trống của bản live, trả về manifest.

    Nếu truyền `replace_from` (manifest của một lần chạy cũ), còn xuất thêm các ô mà giá trị live
    đang khớp đúng url ô đó trong manifest cũ VÀ text mới đã khác — tức audio do lần cũ tự ghi sai.
    """
    manifest = new_manifest(api_base)
    old_index = index_clips_by_field(replace_from)
    for kind in CONTENT_KINDS:
        items = client.list_content(kind)
        logger(f"[export] {kind}: {len(items)} mục")
        for item in items:
            content_id = item.get("contentId") or item.get("_id") or item.get("id")
            if not content_id:
                continue
            detail = client.get_content(kind, content_id)
            live = detail.get("live") if isinstance(detail, dict) else None
            if not live:
                continue  # chưa có bản xuất bản -> bỏ qua
            payload = live.get("payload", {})
            old_clips = old_index.get((kind, str(content_id)))
            clips = extract_clips(kind, payload, old_clips=old_clips)
            if not clips:
                continue
            manifest["contents"].append({
                "kind": kind,
                "contentId": str(content_id),
                "contentVersion": live.get("contentVersion", 0),
                "title": payload.get("title", ""),
                "clips": clips,
            })
            logger(f"[export]   {kind} {content_id} ({payload.get('title', '')}): {len(clips)} clip")
    total_clips = sum(len(c["clips"]) for c in manifest["contents"])
    logger(f"[export] Tổng: {len(manifest['contents'])} nội dung, {total_clips} clip cần audio")
    return manifest
