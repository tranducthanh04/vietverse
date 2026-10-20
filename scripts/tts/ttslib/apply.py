"""Gắn audioUrl (và mốc lyrics) vào nội dung bằng đúng luồng draft -> publish của CMS.

MẶC ĐỊNH là dry-run: chỉ in ra những gì sẽ đổi, không gọi API ghi. Chỉ ghi khi dry_run=False.

Quy tắc an toàn (theo file phase + review):
- Chỉ điền ô audioUrl đang trống; không ghi đè audio có sẵn (kiểm cả ở live và ở draft).
- Riêng chế độ replace-from (truyền `replace_from` = manifest cũ): còn được THAY một ô đã có giá
  trị, nhưng CHỈ khi giá trị đó đúng là url mà lần chạy cũ tự ghi cho ô đó VÀ text mới đã khác.
  Audio người khác tải lên, ô text không đổi, hay ô lần cũ không ghi đều được giữ nguyên.
- Nếu nội dung đang có draft dở của người khác (state == 'editing') thì bỏ qua, báo lại.
- Chỉ xử lý clip đã upload (có 'url').
- Xử lý lỗi theo TỪNG nội dung: một nội dung lỗi không làm dừng cả mẻ; nháp vừa mở được dọn
  để lần chạy lại không bị chặn (I-1/M-2).
- Sau start_draft, xác nhận nháp trả về đúng là nháp script vừa mở trước khi ghi (I-2).
- Với truyện: chỉ gắn mốc lyrics khi mốc còn khớp lyrics hiện tại (M-1).

`client` được truyền vào (dependency injection) nên test dùng client giả để khẳng định
dry-run không gọi hàm ghi nào.
"""
from __future__ import annotations

import copy
from typing import Any, Callable

from .api import ApiError
from .manifest import get_by_path, set_by_path, is_blank, index_clips_by_field, replace_allowed

# Các lỗi "từng-nội-dung" được bắt để cô lập một nội dung lỗi khỏi phần còn lại của mẻ.
# KeyError/IndexError đến từ set_by_path khi đường dẫn trường không tồn tại trên payload (M-2).
_PER_CONTENT_ERRORS = (ApiError, KeyError, IndexError)


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


def _lyrics_mismatch(payload: dict[str, Any], clip: dict[str, Any]) -> str | None:
    """Trả lý do nếu mốc lyrics không còn khớp lyrics hiện tại; None nếu khớp (M-1).

    Mốc (`lineTimes`) được tính từ `lyricLines` chụp lúc export. Nếu số dòng hoặc nội dung
    từng dòng đã đổi giữa export và apply thì gắn theo chỉ số sẽ lệch -> bỏ qua và báo.
    """
    line_times = clip.get("lineTimes") or []
    lyrics = payload.get("lyrics") or []
    if len(line_times) != len(lyrics):
        return f"số mốc ({len(line_times)}) khác số dòng lyrics hiện tại ({len(lyrics)})"
    export_lines = clip.get("lyricLines") or []
    if len(export_lines) != len(lyrics):
        return f"số dòng lúc export ({len(export_lines)}) khác hiện tại ({len(lyrics)})"
    for i, line in enumerate(lyrics):
        current = str(line.get("text", "")) if isinstance(line, dict) else ""
        if current != str(export_lines[i]):
            return f"dòng {i + 1} đã đổi nội dung kể từ lúc export"
    return None


def _draft_ownership_issue(started: Any, actor_id: str | None, expected_version: int) -> str | None:
    """Trả lý do nếu KHÔNG chắc nháp trả về là của script; None nếu chắc chắn là của script (I-2).

    Server trả nháp 'editing' đang mở của người khác NGUYÊN TRẠNG (giữ updatedBy của họ,
    content.service.ts startDraft). Chỉ khi script tạo mới hoặc cập nhật nháp thì server mới
    đặt updatedBy = adminId của script và tăng draftVersion đúng bước. Vì vậy tiêu chí chắc
    chắn: updatedBy khớp actor_id VÀ draftVersion khớp kỳ vọng.
    """
    if not isinstance(started, dict):
        return "phản hồi start_draft không hợp lệ"
    if actor_id is None:
        return "không biết id admin của script (chưa đăng nhập?)"
    owner = started.get("updatedBy")
    if owner is None or str(owner) != str(actor_id):
        return "updatedBy của nháp không phải admin của script (có người mở nháp chen vào?)"
    got_version = started.get("draftVersion")
    if got_version != expected_version:
        return f"draftVersion {got_version} khác kỳ vọng {expected_version}"
    return None


def _discard_quietly(
    client: Any, kind: str, content_id: str, draft_version: int,
    actor_id: str | None, logger: Callable[[str], None],
) -> None:
    """Dọn (best-effort) nháp 'editing' mà script vừa mở, để không chặn lần chạy lại.

    Nếu draftVersion đã lệch (vd save_draft chạy ở server rồi mới rớt mạng) thì đọc lại trạng
    thái để lấy version đúng, và chỉ dọn nháp do script sở hữu (không đụng nháp người khác)."""
    try:
        client.discard_draft(kind, content_id, draft_version)
        return
    except _PER_CONTENT_ERRORS as exc:
        first_error = exc
    try:
        current = client.get_content(kind, content_id)
        draft = current.get("draft") if isinstance(current, dict) else None
        if (
            draft and draft.get("state") == "editing"
            and (actor_id is None or str(draft.get("updatedBy")) == str(actor_id))
        ):
            client.discard_draft(kind, content_id, draft["draftVersion"])
            return
    except _PER_CONTENT_ERRORS:
        pass
    logger(f"[CẢNH BÁO] {kind} {content_id}: không dọn được nháp vừa mở "
           f"(draftVersion={draft_version}): {first_error}")


def _should_fill(old_clips: dict[str, dict[str, Any]], field: str, current_value: Any, new_text: str) -> bool:
    """Có nên ghi audio vào ô này không: ô trống thì điền; ô đã có thì chỉ khi đúng là audio
    script cũ tự ghi và text đã đổi (replace-from). `old_clips` rỗng -> chỉ điền ô trống (như cũ)."""
    if is_blank(current_value):
        return True
    return replace_allowed(old_clips.get(field), current_value, new_text)


def _result(content: dict[str, Any], status: str, detail: str, fields: list[str] | None = None) -> dict[str, Any]:
    return {
        "kind": content["kind"], "contentId": content["contentId"],
        "title": content.get("title", ""), "status": status, "detail": detail,
        "fields": fields or [],
    }


def _apply_one(
    client: Any,
    content: dict[str, Any],
    *,
    dry_run: bool,
    logger: Callable[[str], None],
    actor_id: str | None,
    old_clips: dict[str, dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """Xử lý một nội dung; tự cô lập lỗi và trả kết quả (không ném lên trên)."""
    old_clips = old_clips or {}
    kind = content["kind"]
    content_id = content["contentId"]
    title = content.get("title", "")

    uploaded = [clip for clip in content.get("clips", []) if clip.get("url")]
    if not uploaded:
        return _result(content, "skipped", "chưa có clip nào được upload")

    try:
        current = client.get_content(kind, content_id)
    except _PER_CONTENT_ERRORS as exc:
        return _result(content, "error", f"đọc nội dung lỗi: {exc}")

    live = current.get("live") if isinstance(current, dict) else None
    draft = current.get("draft") if isinstance(current, dict) else None

    if draft and draft.get("state") == "editing":
        logger(f"[BỎ QUA] {kind} {content_id} ({title}): đang có nháp dở của người khác.")
        return _result(content, "skipped", "đang có nháp 'editing' của người khác")
    if not live:
        return _result(content, "skipped", "chưa có bản live để gắn audio")

    live_payload = live.get("payload", {})
    pending = [
        clip for clip in uploaded
        if _should_fill(old_clips, clip["field"], get_by_path(live_payload, clip["field"]), clip.get("text", ""))
    ]
    if not pending:
        return _result(content, "skipped", "mọi ô đích đã có audio")

    # M-1: với clip có mốc lyrics (truyện), kiểm mốc còn khớp lyrics hiện tại. Nháp từ start_draft
    # sao chép từ live nên kiểm trên live_payload là đủ và tránh mở nháp thừa khi phải bỏ qua.
    for clip in pending:
        if clip.get("lineTimes") is not None:
            reason = _lyrics_mismatch(live_payload, clip)
            if reason:
                logger(f"[BỎ QUA] {kind} {content_id} ({title}): {reason}")
                return _result(content, "skipped", f"mốc lyrics lệch: {reason}")

    fields = [clip["field"] for clip in pending]
    logger(f"[{'DRY-RUN' if dry_run else 'ÁP DỤNG'}] {kind} {content_id} ({title}): "
           f"gắn {len(fields)} audio -> {', '.join(fields)}")
    if dry_run:
        return _result(content, "planned", f"sẽ gắn {len(fields)} audio", fields)

    # ---- ghi thật: mở nháp ----
    base_content_version = live.get("contentVersion", 0)
    prior_version = draft["draftVersion"] if draft else None
    try:
        started = client.start_draft(kind, content_id, prior_version)
    except _PER_CONTENT_ERRORS as exc:
        return _result(content, "error", f"mở nháp lỗi: {exc}")

    # I-2: xác nhận nháp trả về đúng là nháp script vừa mở. Nếu server trả nháp 'editing' của
    # người khác (mở chen vào ngay sau get_content) thì KHÔNG đụng vào: bỏ qua và báo, tuyệt đối
    # không discard nháp của họ.
    expected_version = 1 if prior_version is None else prior_version + 1
    ownership = _draft_ownership_issue(started, actor_id, expected_version)
    if ownership:
        logger(f"[BỎ QUA] {kind} {content_id} ({title}): {ownership}")
        return _result(content, "skipped", f"nháp trả về không chắc của script: {ownership}")

    # ---- sửa nháp -> lưu -> xuất bản (cô lập lỗi; dọn nháp khi lỗi) ----
    current_version = started["draftVersion"]
    try:
        draft_payload = copy.deepcopy(started.get("payload", {}))
        applied_fields: list[str] = []
        for clip in pending:
            field = clip["field"]
            # Kiểm lại trên draft: chỉ ghi nếu ô vẫn đáng ghi (trống, hoặc đúng audio script cũ
            # tự ghi và text đã đổi với replace-from); audio người khác thêm vào thì không đụng.
            if not _should_fill(old_clips, field, get_by_path(draft_payload, field), clip.get("text", "")):
                continue
            set_by_path(draft_payload, field, clip["url"])
            if clip.get("lineTimes") is not None:
                _apply_lyric_times(draft_payload, clip)
            applied_fields.append(field)

        if not applied_fields:
            client.discard_draft(kind, content_id, current_version)
            return _result(content, "skipped", "nháp đã có đủ audio, bỏ nháp vừa mở")

        saved = client.save_draft(kind, content_id, draft_payload, current_version)
        current_version = saved["draftVersion"]
        published = client.publish(
            kind, content_id, current_version,
            started.get("baseContentVersion", base_content_version),
        )
        detail = f"đã xuất bản v{published.get('contentVersion', '?')}" if isinstance(published, dict) else "đã xuất bản"
        return _result(content, "applied", detail, applied_fields)
    except _PER_CONTENT_ERRORS as exc:
        # Dọn nháp script vừa mở để không để lại 'editing' chặn lần chạy lại (I-1 idempotent).
        _discard_quietly(client, kind, content_id, current_version, actor_id, logger)
        logger(f"[LỖI] {kind} {content_id} ({title}): {exc}. Đã dọn nháp, tiếp tục nội dung sau.")
        return _result(content, "error", f"ghi/xuất bản lỗi: {exc}")


def apply_manifest(
    client: Any,
    manifest: dict[str, Any],
    *,
    dry_run: bool = True,
    logger: Callable[[str], None] = print,
    actor_id: str | None = None,
    replace_from: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Duyệt manifest, gắn audio vào các ô trống. Trả danh sách kết quả theo từng nội dung.

    Lỗi của một nội dung được cô lập (status='error') và không làm dừng các nội dung còn lại.
    `actor_id` là id admin đang đăng nhập (client.user_id), dùng để xác nhận nháp là của script.
    `replace_from` là manifest của lần chạy cũ: khi có, cho phép THAY audio script cũ tự ghi (giá
    trị live khớp url cũ và text đã đổi); không có thì chỉ điền ô trống như trước.
    """
    old_index = index_clips_by_field(replace_from)
    return [
        _apply_one(
            client, content, dry_run=dry_run, logger=logger, actor_id=actor_id,
            old_clips=old_index.get((content["kind"], str(content["contentId"])), {}),
        )
        for content in manifest.get("contents", [])
    ]
