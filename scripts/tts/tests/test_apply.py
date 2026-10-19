"""Test khâu apply: dry-run không ghi, bỏ qua ô đã có audio, gắn đúng audio + mốc lyrics."""
import copy

from ttslib.apply import apply_manifest

WRITE_CALLS = {"start_draft", "save_draft", "publish", "discard_draft"}


class FakeClient:
    """Client giả: ghi lại mọi lệnh gọi để khẳng định dry-run không gọi API ghi."""

    def __init__(self, store):
        self.store = store
        self.calls = []

    def get_content(self, kind, content_id):
        self.calls.append(("get_content", kind, content_id))
        return copy.deepcopy(self.store[(kind, content_id)])

    def start_draft(self, kind, content_id, expected=None):
        self.calls.append(("start_draft", kind, content_id, expected))
        live = self.store[(kind, content_id)]["live"]
        return {"payload": copy.deepcopy(live["payload"]), "draftVersion": 5, "baseContentVersion": live["contentVersion"]}

    def save_draft(self, kind, content_id, payload, expected):
        self.calls.append(("save_draft", kind, content_id, payload, expected))
        return {"draftVersion": expected + 1, "payload": payload}

    def publish(self, kind, content_id, expected, base):
        self.calls.append(("publish", kind, content_id, expected, base))
        return {"contentId": content_id, "contentVersion": (base or 0) + 1}

    def discard_draft(self, kind, content_id, expected):
        self.calls.append(("discard_draft", kind, content_id, expected))
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
    results = apply_manifest(client, lesson_manifest(), dry_run=False)
    names = [c[0] for c in client.calls]
    assert "start_draft" in names and "save_draft" in names and "publish" in names
    assert results[0]["status"] == "applied"
    assert client.saved_payload()["activities"][0]["audioUrl"] == "/api/v1/media/audio/aaaaaaaaaaaaaaaa.mp3"


def test_skip_when_field_already_has_audio():
    store = {("lesson", "L1"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "Nghe", "audioUrl": "/api/v1/media/audio/existing0.mp3"}]}}, "draft": None}}
    client = FakeClient(store)
    results = apply_manifest(client, lesson_manifest(), dry_run=False)
    assert client.writes() == []
    assert results[0]["status"] == "skipped"


def test_skip_when_someone_else_has_editing_draft():
    store = {("lesson", "L1"): {"live": {"contentVersion": 1, "payload": {"activities": [{"prompt": "Nghe", "audioUrl": ""}]}}, "draft": {"state": "editing", "draftVersion": 3}}}
    client = FakeClient(store)
    results = apply_manifest(client, lesson_manifest(), dry_run=False)
    assert client.writes() == []
    assert results[0]["status"] == "skipped"
    assert "nháp" in results[0]["detail"]


def test_skip_when_no_uploaded_clip():
    client = FakeClient(store_empty())
    results = apply_manifest(client, lesson_manifest(has_url=False), dry_run=False)
    assert client.writes() == []
    assert results[0]["status"] == "skipped"


def test_apply_sets_story_lyrics_times_and_duration():
    store = {("story", "S1"): {"live": {"contentVersion": 2, "payload": {
        "audioUrl": "", "durationSec": 0,
        "lyrics": [{"text": "a", "timeSec": 0}, {"text": "b", "timeSec": 0}],
    }}, "draft": None}}
    client = FakeClient(store)
    manifest = {"contents": [{"kind": "story", "contentId": "S1", "contentVersion": 2, "title": "Truyện", "clips": [
        {"field": "audioUrl", "text": "a\nb", "file": "s.mp3",
         "url": "/api/v1/media/audio/ssssssssssssssss.mp3",
         "lyricLines": ["a", "b"], "durationSec": 4.2, "lineTimes": [0.0, 2.1]},
    ]}]}
    results = apply_manifest(client, manifest, dry_run=False)
    payload = client.saved_payload()
    assert payload["audioUrl"] == "/api/v1/media/audio/ssssssssssssssss.mp3"
    assert payload["durationSec"] == 4.2
    assert payload["lyrics"][0]["timeSec"] == 0.0
    assert payload["lyrics"][1]["timeSec"] == 2.1
    assert results[0]["status"] == "applied"
