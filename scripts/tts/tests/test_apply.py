"""Test khâu apply: dry-run không ghi, bỏ qua ô đã có audio, gắn đúng audio + mốc lyrics,
cô lập lỗi theo từng nội dung (I-1/M-2), xác nhận nháp là của script (I-2), kiểm mốc lyrics (M-1)."""
import copy

from ttslib.api import ApiError
from ttslib.apply import apply_manifest

WRITE_CALLS = {"start_draft", "save_draft", "publish", "discard_draft"}
SELF_ID = "admin-self"


class FakeClient:
    """Client giả mô phỏng hợp đồng server: ghi lại mọi lệnh gọi, hỗ trợ tiêm lỗi/nháp lạ.

    - `fail`: map tên method -> ngoại lệ, ném MỘT lần khi method đó được gọi.
    - `injected_started`: nếu set, start_draft trả về nháp này (mô phỏng server trả nháp
      'editing' của người khác chen vào sau get_content — TOCTOU).
    """

    def __init__(self, store, user_id=SELF_ID):
        self.store = store
        self.user_id = user_id
        self.calls = []
        self.fail = {}
        self.injected_started = None

    def get_content(self, kind, content_id):
        self.calls.append(("get_content", kind, content_id))
        if "get_content" in self.fail:
            raise self.fail.pop("get_content")
        return copy.deepcopy(self.store[(kind, content_id)])

    def start_draft(self, kind, content_id, expected=None):
        self.calls.append(("start_draft", kind, content_id, expected))
        if "start_draft" in self.fail:
            raise self.fail.pop("start_draft")
        if self.injected_started is not None:
            return copy.deepcopy(self.injected_started)
        entry = self.store[(kind, content_id)]
        existing = entry.get("draft")
        live = entry["live"]
        if existing and existing.get("state") == "editing":
            return copy.deepcopy(existing)  # server trả nháp của người khác nguyên trạng
        prior = existing["draftVersion"] if existing else None
        version = 1 if prior is None else prior + 1
        draft = {
            "payload": copy.deepcopy(live["payload"]), "draftVersion": version,
            "baseContentVersion": live["contentVersion"], "state": "editing", "updatedBy": self.user_id,
        }
        entry["draft"] = draft
        return copy.deepcopy(draft)

    def save_draft(self, kind, content_id, payload, expected):
        self.calls.append(("save_draft", kind, content_id, payload, expected))
        if "save_draft" in self.fail:
            raise self.fail.pop("save_draft")
        entry = self.store[(kind, content_id)]
        if entry.get("draft"):
            entry["draft"]["draftVersion"] = expected + 1
            entry["draft"]["payload"] = copy.deepcopy(payload)
        return {"draftVersion": expected + 1, "payload": payload}

    def publish(self, kind, content_id, expected, base):
        self.calls.append(("publish", kind, content_id, expected, base))
        if "publish" in self.fail:
            raise self.fail.pop("publish")
        return {"contentId": content_id, "contentVersion": (base or 0) + 1}

    def discard_draft(self, kind, content_id, expected):
        self.calls.append(("discard_draft", kind, content_id, expected))
        if "discard_draft" in self.fail:
            raise self.fail.pop("discard_draft")
        entry = self.store.get((kind, content_id))
        if entry and entry.get("draft") and entry["draft"].get("draftVersion") == expected:
            entry["draft"] = None
        return {}

    def writes(self):
        return [c for c in self.calls if c[0] in WRITE_CALLS]

    def saved_payload(self):
        return next(c[3] for c in self.calls if c[0] == "save_draft")


def lesson_manifest(has_url=True):
    return {"contents": [{"kind": "lesson", "contentId": "L1", "contentVersion": 1, "title": "Bài 1", "clips": [
        {"field": "activities.0.audioUrl", "text": "Nghe", "file": "a.mp3",
         "url": "/api/v1/media/audio/aaaaaaaaaaaaaaaa.mp3" if has_url else None},
    ]}]}


def store_empty():
    return {("lesson", "L1"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "Nghe", "audioUrl": ""}]}}, "draft": None}}


def test_dry_run_makes_no_write_calls():
    client = FakeClient(store_empty())
    results = apply_manifest(client, lesson_manifest(), dry_run=True)
    assert client.writes() == []
    assert results[0]["status"] == "planned"
    assert results[0]["fields"] == ["activities.0.audioUrl"]


def test_apply_fills_empty_field_and_publishes():
    client = FakeClient(store_empty())
    results = apply_manifest(client, lesson_manifest(), dry_run=False, actor_id=client.user_id)
    names = [c[0] for c in client.calls]
    assert "start_draft" in names and "save_draft" in names and "publish" in names
    assert results[0]["status"] == "applied"
    assert client.saved_payload()["activities"][0]["audioUrl"] == "/api/v1/media/audio/aaaaaaaaaaaaaaaa.mp3"


def test_skip_when_field_already_has_audio():
    store = {("lesson", "L1"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "Nghe", "audioUrl": "/api/v1/media/audio/existing0.mp3"}]}}, "draft": None}}
    client = FakeClient(store)
    results = apply_manifest(client, lesson_manifest(), dry_run=False, actor_id=client.user_id)
    assert client.writes() == []
    assert results[0]["status"] == "skipped"


def test_skip_when_someone_else_has_editing_draft():
    store = {("lesson", "L1"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "Nghe", "audioUrl": ""}]}}, "draft": {"state": "editing", "draftVersion": 3, "updatedBy": "other"}}}
    client = FakeClient(store)
    results = apply_manifest(client, lesson_manifest(), dry_run=False, actor_id=client.user_id)
    assert client.writes() == []
    assert results[0]["status"] == "skipped"
    assert "nháp" in results[0]["detail"]


def test_skip_when_no_uploaded_clip():
    client = FakeClient(store_empty())
    results = apply_manifest(client, lesson_manifest(has_url=False), dry_run=False, actor_id=client.user_id)
    assert client.writes() == []
    assert results[0]["status"] == "skipped"


def story_store(lyrics):
    return {("story", "S1"): {"live": {"contentVersion": 2, "payload": {
        "audioUrl": "", "durationSec": 0, "lyrics": lyrics,
    }}, "draft": None}}


def story_manifest(line_times, lyric_lines):
    return {"contents": [{"kind": "story", "contentId": "S1", "contentVersion": 2, "title": "Truyện", "clips": [
        {"field": "audioUrl", "text": "\n".join(lyric_lines), "file": "s.mp3",
         "url": "/api/v1/media/audio/ssssssssssssssss.mp3",
         "lyricLines": lyric_lines, "durationSec": 4.2, "lineTimes": line_times},
    ]}]}


def test_apply_sets_story_lyrics_times_and_duration():
    client = FakeClient(story_store([{"text": "a", "timeSec": 0}, {"text": "b", "timeSec": 0}]))
    results = apply_manifest(client, story_manifest([0.0, 2.1], ["a", "b"]), dry_run=False, actor_id=client.user_id)
    payload = client.saved_payload()
    assert payload["audioUrl"] == "/api/v1/media/audio/ssssssssssssssss.mp3"
    assert payload["durationSec"] == 4.2
    assert payload["lyrics"][0]["timeSec"] == 0.0
    assert payload["lyrics"][1]["timeSec"] == 2.1
    assert results[0]["status"] == "applied"


# ---- M-1: mốc lyrics lệch thì bỏ qua và báo, không mở nháp ----

def test_skip_story_when_lyric_count_changed():
    client = FakeClient(story_store([{"text": "a", "timeSec": 0}]))  # live chỉ còn 1 dòng
    results = apply_manifest(client, story_manifest([0.0, 2.1], ["a", "b"]), dry_run=False, actor_id=client.user_id)
    assert client.writes() == []  # bỏ qua trước khi mở nháp
    assert results[0]["status"] == "skipped"
    assert "mốc lyrics" in results[0]["detail"]


def test_skip_story_when_lyric_text_changed():
    client = FakeClient(story_store([{"text": "a", "timeSec": 0}, {"text": "ĐỔI", "timeSec": 0}]))
    results = apply_manifest(client, story_manifest([0.0, 2.1], ["a", "b"]), dry_run=False, actor_id=client.user_id)
    assert client.writes() == []
    assert results[0]["status"] == "skipped"
    assert "mốc lyrics" in results[0]["detail"]


# ---- I-2: xác nhận nháp trả về là của script ----

def test_skip_when_start_draft_returns_other_editing_draft():
    """TOCTOU: get_content không thấy nháp, nhưng start_draft trả nháp 'editing' của người khác."""
    client = FakeClient(store_empty())
    client.injected_started = {
        "payload": {"activities": [{"prompt": "Nghe", "audioUrl": ""}]},
        "draftVersion": 1, "baseContentVersion": 1, "state": "editing", "updatedBy": "someone-else",
    }
    results = apply_manifest(client, lesson_manifest(), dry_run=False, actor_id=client.user_id)
    names = [c[0] for c in client.calls]
    assert "start_draft" in names
    # Tuyệt đối không đụng nháp của người khác: không save/publish/discard.
    assert not any(c[0] in ("save_draft", "publish", "discard_draft") for c in client.calls)
    assert results[0]["status"] == "skipped"
    assert "không chắc" in results[0]["detail"]


def test_skip_when_start_draft_version_mismatch():
    """updatedBy đúng của script nhưng draftVersion không khớp kỳ vọng -> không chắc, bỏ qua."""
    client = FakeClient(store_empty())
    client.injected_started = {
        "payload": {"activities": [{"prompt": "Nghe", "audioUrl": ""}]},
        "draftVersion": 9, "baseContentVersion": 1, "state": "editing", "updatedBy": SELF_ID,
    }
    results = apply_manifest(client, lesson_manifest(), dry_run=False, actor_id=client.user_id)
    assert not any(c[0] in ("save_draft", "publish") for c in client.calls)
    assert results[0]["status"] == "skipped"


def test_skip_when_actor_id_unknown():
    """Không biết id admin của script -> không chắc nháp là của mình, bỏ qua để an toàn."""
    client = FakeClient(store_empty())
    results = apply_manifest(client, lesson_manifest(), dry_run=False, actor_id=None)
    assert not any(c[0] in ("save_draft", "publish") for c in client.calls)
    assert results[0]["status"] == "skipped"


# ---- I-1 / M-2: cô lập lỗi theo từng nội dung, dọn nháp, tiếp tục ----

def two_lesson_manifest():
    return {"contents": [
        {"kind": "lesson", "contentId": "LF", "contentVersion": 1, "title": "Hỏng", "clips": [
            {"field": "activities.0.audioUrl", "text": "X", "file": "x.mp3",
             "url": "/api/v1/media/audio/ffffffffffffffff.mp3"}]},
        {"kind": "lesson", "contentId": "LK", "contentVersion": 1, "title": "Tốt", "clips": [
            {"field": "activities.0.audioUrl", "text": "Y", "file": "y.mp3",
             "url": "/api/v1/media/audio/kkkkkkkkkkkkkkkk.mp3"}]},
    ]}


def two_lesson_store():
    return {
        ("lesson", "LF"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "X", "audioUrl": ""}]}}, "draft": None},
        ("lesson", "LK"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "Y", "audioUrl": ""}]}}, "draft": None},
    }


def test_publish_error_discards_draft_and_continues_batch():
    client = FakeClient(two_lesson_store())
    client.fail["publish"] = ApiError(400, "CONTENT_VALIDATION", "lỗi validate")  # chỉ nội dung đầu
    results = apply_manifest(client, two_lesson_manifest(), dry_run=False, actor_id=client.user_id)
    by_id = {r["contentId"]: r for r in results}
    assert by_id["LF"]["status"] == "error"          # nội dung đầu lỗi
    assert by_id["LK"]["status"] == "applied"         # nhưng mẻ KHÔNG dừng, nội dung sau vẫn chạy
    # Nháp của nội dung lỗi được dọn (discard) để lần chạy lại không bị chặn.
    assert any(c[0] == "discard_draft" and c[2] == "LF" for c in client.calls)
    # Nội dung lỗi KHÔNG còn nháp 'editing' treo lại.
    assert client.store[("lesson", "LF")]["draft"] is None


def test_set_by_path_error_is_isolated_and_cleaned():
    """M-2: đường dẫn trường không tồn tại trên payload -> IndexError được bắt, dọn nháp, báo error."""
    store = {("lesson", "L1"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "Nghe", "audioUrl": ""}]}}, "draft": None}}
    manifest = {"contents": [{"kind": "lesson", "contentId": "L1", "contentVersion": 1, "title": "Bài", "clips": [
        {"field": "activities.5.audioUrl", "text": "Nghe", "file": "a.mp3",
         "url": "/api/v1/media/audio/aaaaaaaaaaaaaaaa.mp3"}]}]}
    client = FakeClient(store)
    results = apply_manifest(client, manifest, dry_run=False, actor_id=client.user_id)
    assert results[0]["status"] == "error"
    assert any(c[0] == "start_draft" for c in client.calls)
    assert any(c[0] == "discard_draft" for c in client.calls)
    assert not any(c[0] in ("save_draft", "publish") for c in client.calls)
    assert client.store[("lesson", "L1")]["draft"] is None


def test_start_draft_error_reported_without_discard():
    """Lỗi ngay khi mở nháp: không có nháp nào để dọn, báo error và tiếp tục."""
    client = FakeClient(store_empty())
    client.fail["start_draft"] = ApiError(409, "CONFLICT", "xung đột")
    results = apply_manifest(client, lesson_manifest(), dry_run=False, actor_id=client.user_id)
    assert results[0]["status"] == "error"
    assert not any(c[0] in ("save_draft", "publish", "discard_draft") for c in client.calls)
