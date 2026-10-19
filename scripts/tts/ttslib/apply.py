"""Gắn audioUrl (và mốc lyrics) vào nội dung bằng đúng luồng draft -> publish của CMS.

MẶC ĐỊNH là dry-run: chỉ in ra những gì sẽ đổi, không gọi API ghi. Chỉ ghi khi dry_run=False.

Quy tắc an toàn (theo file phase):
- Chỉ điền ô audioUrl đang trống; không ghi đè audio có sẵn (kiểm cả ở live và ở draft).
- Nếu nội dung đang có draft dở của người khác (state == 'editing') thì bỏ qua, báo lại.
- Chỉ xử lý clip đã upload (có 'url').

`client` được truyền vào (dependency injection) nên test dùng client giả để khẳng định
dry-run không gọi hàm ghi nào.
"""
from __future__ import annotations

import copy
from typing import Any, Callable

from .manifest import get_by_path, set_by_path, is_blank


def _apply_lyric_times(payload: dict[str, Any], clip: dict[str, Any]) -> None:
    """Điền durationSec và timeSec cho từng dòng lyrics (chỉ với clip audio cả truyện)."""
    duration = clip.get("durationSec")
    if duration is not None:
        payload["durationSec"] = duration
    line_times = clip.get("lineTimes") or []
    lyrics = payload.get("lyrics") or []
    for i, time_sec in enumerate(line_times):
        if i < len(lyrics) and isinstance(lyrics[i], dict):
            lyrics[i]["timeSec"] = time_sec


def _result(content: dict[str, Any], status: str, detail: str, fields: list[str] | None = None) -> dict[str, Any]:
    return {
        "kind": content["kind"], "contentId": content["contentId"],
        "title": content.get("title", ""), "status": status, "detail": detail,
        "fields": fields or [],
    }


def apply_manifest(
    client: Any,
    manifest: dict[str, Any],
    *,
    dry_run: bool = True,
    logger: Callable[[str], None] = print,
) -> list[dict[str, Any]]:
    """Duyệt manifest, gắn audio vào các ô trống. Trả danh sách kết quả theo từng nội dung."""
    results: list[dict[str, Any]] = []
    for content in manifest.get("contents", []):
        kind = content["kind"]
        content_id = content["contentId"]
        title = content.get("title", "")

        uploaded = [clip for clip in content.get("clips", []) if clip.get("url")]
        if not uploaded:
            results.append(_result(content, "skipped", "chưa có clip nào được upload"))
            continue

        current = client.get_content(kind, content_id)
        live = current.get("live") if isinstance(current, dict) else None
        draft = current.get("draft") if isinstance(current, dict) else None

        if draft and draft.get("state") == "editing":
            msg = f"[BỎ QUA] {kind} {content_id} ({title}): đang có nháp dở của người khác."
            logger(msg)
            results.append(_result(content, "skipped", "đang có nháp 'editing' của người khác"))
            continue
        if not live:
            results.append(_result(content, "skipped", "chưa có bản live để gắn audio"))
            continue

        live_payload = live.get("payload", {})
        pending = [clip for clip in uploaded if is_blank(get_by_path(live_payload, clip["field"]))]
        if not pending:
            results.append(_result(content, "skipped", "mọi ô đích đã có audio"))
            continue

        fields = [clip["field"] for clip in pending]
        logger(f"[{'DRY-RUN' if dry_run else 'ÁP DỤNG'}] {kind} {content_id} ({title}): "
               f"gắn {len(fields)} audio -> {', '.join(fields)}")
        if dry_run:
            results.append(_result(content, "planned", f"sẽ gắn {len(fields)} audio", fields))
            continue

        base_content_version = live.get("contentVersion", 0)
        started = client.start_draft(kind, content_id, draft["draftVersion"] if draft else None)
        draft_payload = copy.deepcopy(started.get("payload", {}))
        draft_version = started["draftVersion"]

        applied_fields: list[str] = []
        for clip in pending:
            field = clip["field"]
            if not is_blank(get_by_path(draft_payload, field)):
                continue  # kiểm lại trên draft: nếu đã có thì vẫn không ghi đè
            set_by_path(draft_payload, field, clip["url"])
            if clip.get("lineTimes") is not None:
                _apply_lyric_times(draft_payload, clip)
            applied_fields.append(field)

        if not applied_fields:
            client.discard_draft(kind, content_id, draft_version)
            results.append(_result(content, "skipped", "nháp đã có đủ audio, bỏ nháp vừa mở"))
            continue

        saved = client.save_draft(kind, content_id, draft_payload, draft_version)
        published = client.publish(kind, content_id, saved["draftVersion"], started.get("baseContentVersion", base_content_version))
        detail = f"đã xuất bản v{published.get('contentVersion', '?')}" if isinstance(published, dict) else "đã xuất bản"
        results.append(_result(content, "applied", detail, applied_fields))
    return results
