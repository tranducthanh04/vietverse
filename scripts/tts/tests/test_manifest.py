"""Test trích ô audioUrl trống và tiện ích đường dẫn chấm."""
from ttslib.manifest import (
    extract_clips,
    get_by_path,
    set_by_path,
    is_blank,
    index_clips_by_field,
    replace_allowed,
)


def test_extract_lesson_only_empty_and_with_text():
    # Activity phải có `type` thì mới sinh clip activities[].audioUrl (hành vi mới: text theo
    # loại; loại không phát thì bỏ qua). Trước đây dùng `prompt` cho MỌI loại — đó là gốc lỗi prod.
    payload = {
        "activities": [
            {"type": "listen_choose", "prompt": "Nghe và chọn", "audioUrl": "", "options": [
                {"text": "mèo", "audioUrl": ""},
                {"text": "chó", "audioUrl": "/api/v1/media/audio/abc0.mp3"},
                {"text": "", "audioUrl": ""},
            ]},
            {"type": "listen_choose", "prompt": "Đã có audio", "audioUrl": "/api/v1/media/audio/x0.mp3", "options": []},
        ],
        "vocabulary": [
            {"word": "táo", "audioUrl": ""},
            {"word": "", "audioUrl": ""},
        ],
    }
    fields = [c["field"] for c in extract_clips("lesson", payload)]
    assert "activities.0.audioUrl" in fields
    assert "activities.0.options.0.audioUrl" in fields
    assert "activities.0.options.1.audioUrl" not in fields  # đã có audio
    assert "activities.0.options.2.audioUrl" not in fields  # không có text
    assert "activities.1.audioUrl" not in fields  # đã có audio
    assert "vocabulary.0.audioUrl" in fields
    assert "vocabulary.1.audioUrl" not in fields  # không có từ


def test_word_card_uses_target_word_not_prompt():
    """word_card: audioUrl phản chiếu nút 'Nghe đọc' (fallback targetWord = cả đoạn đọc), KHÔNG
    phải prompt. Khẳng định text KHÁC prompt -> test này FAIL trên code cũ (code cũ dùng prompt)."""
    passage = "Trong sân có gà và chó. Dưới ao có cá. Trên trời có chim bay."
    payload = {"activities": [
        {"type": "word_card", "prompt": "Cùng đọc và tìm hiểu.", "targetWord": passage, "audioUrl": ""},
    ]}
    by_field = {c["field"]: c["text"] for c in extract_clips("lesson", payload)}
    assert by_field["activities.0.audioUrl"] == passage
    assert by_field["activities.0.audioUrl"] != "Cùng đọc và tìm hiểu."


def test_each_mapped_activity_type_uses_expected_text():
    """Một khẳng định cho mỗi loại được ánh xạ trong LESSON_ACTIVITY_AUDIO_TEXT."""
    payload = {"activities": [
        {"type": "listen_choose", "prompt": "P0", "audioUrl": ""},
        {"type": "fill_blank", "prompt": "P1", "audioUrl": ""},
        {"type": "sort_order", "prompt": "P2", "audioUrl": ""},
        {"type": "review", "prompt": "P3", "audioUrl": ""},
        {"type": "multi_select", "prompt": "P4", "subPrompt": "S4", "audioUrl": ""},
        {"type": "group_sort", "prompt": "P5", "subPrompt": "S5", "audioUrl": ""},
        {"type": "fill_blanks", "prompt": "P6", "subPrompt": "S6", "audioUrl": ""},
        {"type": "follow_steps", "prompt": "P7", "subPrompt": "S7", "audioUrl": "",
         "steps": [{"text": "B1"}, {"text": "B2"}]},
    ]}
    by_field = {c["field"]: c["text"] for c in extract_clips("lesson", payload)}
    assert by_field["activities.0.audioUrl"] == "P0"   # listen_choose -> prompt
    assert by_field["activities.1.audioUrl"] == "P1"   # fill_blank -> prompt
    assert by_field["activities.2.audioUrl"] == "P2"   # sort_order -> prompt
    assert by_field["activities.3.audioUrl"] == "P3"   # review -> prompt
    assert by_field["activities.4.audioUrl"] == "P4. S4"           # multi_select -> prompt+subPrompt
    assert by_field["activities.5.audioUrl"] == "P5. S5"           # group_sort
    assert by_field["activities.6.audioUrl"] == "P6. S6"           # fill_blanks
    assert by_field["activities.7.audioUrl"] == "P7. S7. B1. B2"   # follow_steps + text từng bước


def test_new_activity_instructions_skip_blank_parts():
    """NewActivityFrame nối bằng '. ' sau .filter(Boolean): thiếu subPrompt thì chỉ còn prompt."""
    payload = {"activities": [{"type": "multi_select", "prompt": "Chỉ có prompt", "audioUrl": ""}]}
    by_field = {c["field"]: c["text"] for c in extract_clips("lesson", payload)}
    assert by_field["activities.0.audioUrl"] == "Chỉ có prompt"


def test_drag_match_and_record_voice_skip_activity_audio():
    """drag_match và record_voice KHÔNG phát activities[].audioUrl -> không sinh clip cho ô đó."""
    payload = {"activities": [
        {"type": "drag_match", "prompt": "Kéo nối cho đúng", "audioUrl": ""},
        {"type": "record_voice", "prompt": "Đọc theo", "targetWord": "mèo", "audioUrl": ""},
    ]}
    fields = [c["field"] for c in extract_clips("lesson", payload)]
    assert "activities.0.audioUrl" not in fields
    assert "activities.1.audioUrl" not in fields


def test_unknown_activity_type_skips_activity_audio():
    """Loại lạ / thiếu type: không sinh clip activities[].audioUrl (không đoán text)."""
    payload = {"activities": [
        {"type": "brand_new_type", "prompt": "X", "audioUrl": ""},
        {"prompt": "Thiếu type", "audioUrl": ""},
    ]}
    fields = [c["field"] for c in extract_clips("lesson", payload)]
    assert "activities.0.audioUrl" not in fields
    assert "activities.1.audioUrl" not in fields


# ---- replace-from ở tầng trích clip ----

OLD_URL = "/api/v1/media/audio/oldoldoldoldold0.mp3"


def _old_clips(field, text, url=OLD_URL):
    manifest = {"contents": [{"kind": "lesson", "contentId": "L1", "clips": [
        {"field": field, "text": text, "url": url}]}]}
    return index_clips_by_field(manifest)[("lesson", "L1")]


def test_replace_from_includes_field_when_url_matches_and_text_changed():
    old = _old_clips("activities.0.audioUrl", "Cùng đọc và tìm hiểu.")
    payload = {"activities": [
        {"type": "word_card", "prompt": "Cùng đọc và tìm hiểu.", "targetWord": "Trong sân có gà.", "audioUrl": OLD_URL},
    ]}
    clips = extract_clips("lesson", payload, old_clips=old)
    by_field = {c["field"]: c["text"] for c in clips}
    assert by_field["activities.0.audioUrl"] == "Trong sân có gà."  # có mặt, mang text đã sửa


def test_replace_from_leaves_admin_audio_alone():
    old = _old_clips("activities.0.audioUrl", "Cùng đọc và tìm hiểu.")
    payload = {"activities": [  # live là audio admin (url khác url lần cũ) -> giữ nguyên
        {"type": "word_card", "prompt": "x", "targetWord": "Trong sân có gà.",
         "audioUrl": "/api/v1/media/audio/adminadminadmin0.mp3"},
    ]}
    fields = [c["field"] for c in extract_clips("lesson", payload, old_clips=old)]
    assert "activities.0.audioUrl" not in fields


def test_replace_from_leaves_unchanged_text_alone():
    old = _old_clips("activities.0.audioUrl", "P")
    payload = {"activities": [  # text mới vẫn là "P" -> không sửa
        {"type": "listen_choose", "prompt": "P", "audioUrl": OLD_URL},
    ]}
    fields = [c["field"] for c in extract_clips("lesson", payload, old_clips=old)]
    assert "activities.0.audioUrl" not in fields


def test_replace_from_leaves_field_missing_from_old_run_alone():
    payload = {"activities": [  # ô có audio nhưng lần cũ KHÔNG ghi ô này -> giữ nguyên
        {"type": "listen_choose", "prompt": "P-mới", "audioUrl": "/api/v1/media/audio/somesomesome00.mp3"},
    ]}
    fields = [c["field"] for c in extract_clips("lesson", payload, old_clips={})]
    assert "activities.0.audioUrl" not in fields


def test_replace_allowed_rules():
    old = {"field": "f", "text": "cũ", "url": OLD_URL}
    assert replace_allowed(old, OLD_URL, "mới") is True          # khớp url cũ + text đổi
    assert replace_allowed(old, OLD_URL, "cũ") is False          # text không đổi
    assert replace_allowed(old, "/khac.mp3", "mới") is False     # url khác (audio admin)
    assert replace_allowed(None, OLD_URL, "mới") is False        # lần cũ không ghi ô này
    assert replace_allowed({"text": "cũ"}, OLD_URL, "mới") is False  # old clip thiếu url


def test_extract_story_whole_audio():
    payload = {"audioUrl": "", "lyrics": [{"text": "Con cò", "timeSec": 0}, {"text": "bé bé", "timeSec": 0}]}
    clips = extract_clips("story", payload)
    assert len(clips) == 1
    assert clips[0]["field"] == "audioUrl"
    assert clips[0]["lyricLines"] == ["Con cò", "bé bé"]
    assert "Con cò" in clips[0]["text"] and "bé bé" in clips[0]["text"]
    assert clips[0]["lineTimes"] is None and clips[0]["durationSec"] is None


def test_extract_story_skips_when_audio_present():
    payload = {"audioUrl": "/api/v1/media/audio/x0.mp3", "lyrics": [{"text": "a", "timeSec": 0}]}
    assert extract_clips("story", payload) == []


def test_extract_culture_intro():
    clips = extract_clips("culture", {"intro": "Tết là lễ lớn.", "audioUrl": ""})
    assert len(clips) == 1
    assert clips[0]["field"] == "audioUrl"
    assert clips[0]["text"] == "Tết là lễ lớn."


def test_path_get_and_set():
    obj = {"activities": [{"options": [{"audioUrl": ""}]}]}
    assert get_by_path(obj, "activities.0.options.0.audioUrl") == ""
    set_by_path(obj, "activities.0.options.0.audioUrl", "/x.mp3")
    assert obj["activities"][0]["options"][0]["audioUrl"] == "/x.mp3"
    assert get_by_path(obj, "activities.5.audioUrl") is None


def test_is_blank():
    assert is_blank("") and is_blank("   ") and is_blank(None)
    assert not is_blank("/api/v1/media/audio/a0.mp3")
