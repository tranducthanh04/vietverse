"""Test trích ô audioUrl trống và tiện ích đường dẫn chấm."""
from ttslib.manifest import extract_clips, get_by_path, set_by_path, is_blank


def test_extract_lesson_only_empty_and_with_text():
    payload = {
        "activities": [
            {"prompt": "Nghe và chọn", "audioUrl": "", "options": [
                {"text": "mèo", "audioUrl": ""},
                {"text": "chó", "audioUrl": "/api/v1/media/audio/abc0.mp3"},
                {"text": "", "audioUrl": ""},
            ]},
            {"prompt": "Đã có audio", "audioUrl": "/api/v1/media/audio/x0.mp3", "options": []},
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
