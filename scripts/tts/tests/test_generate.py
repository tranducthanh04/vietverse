"""Test khâu generate: gộp clip trùng để synth một lần (M-3) và điền mốc lyrics cho truyện."""
import ttslib.generate as gen


def test_duplicate_clips_synthesized_once(tmp_path, monkeypatch):
    calls = []

    async def fake_synth(text, voice, rate):
        calls.append(text)
        return b"\xff\xfb\x00\x00data", []

    monkeypatch.setattr(gen, "synthesize_with_retry", fake_synth)
    manifest = {"contents": [
        {"kind": "lesson", "contentId": "A", "clips": [{"field": "activities.0.audioUrl", "text": "Xin chào", "file": None, "url": None}]},
        {"kind": "lesson", "contentId": "B", "clips": [{"field": "vocabulary.0.audioUrl", "text": "Xin chào", "file": None, "url": None}]},
        {"kind": "lesson", "contentId": "C", "clips": [{"field": "vocabulary.1.audioUrl", "text": "Khác", "file": None, "url": None}]},
    ]}
    stats = gen.generate(manifest, tmp_path, voice="v", rate="-10%")

    assert len(calls) == 2  # "Xin chào" synth đúng 1 lần dù có 2 clip
    assert set(calls) == {"Xin chào", "Khác"}
    assert stats["generated"] == 2
    file_a = manifest["contents"][0]["clips"][0]["file"]
    file_b = manifest["contents"][1]["clips"][0]["file"]
    file_c = manifest["contents"][2]["clips"][0]["file"]
    assert file_a == file_b and file_a is not None  # clip trùng text -> cùng file
    assert file_c != file_a


def test_second_run_uses_cache(tmp_path, monkeypatch):
    calls = []

    async def fake_synth(text, voice, rate):
        calls.append(text)
        return b"\xff\xfb\x00\x00data", []

    monkeypatch.setattr(gen, "synthesize_with_retry", fake_synth)

    def manifest():
        return {"contents": [{"kind": "lesson", "contentId": "A", "clips": [
            {"field": "activities.0.audioUrl", "text": "Lặp lại", "file": None, "url": None}]}]}

    gen.generate(manifest(), tmp_path, voice="v", rate="-10%")
    stats2 = gen.generate(manifest(), tmp_path, voice="v", rate="-10%")
    assert len(calls) == 1  # lần hai dùng cache, không synth lại
    assert stats2["cached"] == 1 and stats2["generated"] == 0


def test_story_clip_fills_line_times(tmp_path, monkeypatch):
    async def fake_synth(text, voice, rate):
        return b"\xff\xfb\x00\x00", [
            {"offset": 0, "duration": 5_000_000, "text": "a"},
            {"offset": 20_000_000, "duration": 5_000_000, "text": "b"},
        ]

    monkeypatch.setattr(gen, "synthesize_with_retry", fake_synth)
    monkeypatch.setattr(gen, "probe_duration_sec", lambda path: 3.0)
    manifest = {"contents": [{"kind": "story", "contentId": "S", "clips": [
        {"field": "audioUrl", "text": "a\nb", "file": None, "url": None,
         "lyricLines": ["a", "b"], "durationSec": None, "lineTimes": None}]}]}
    gen.generate(manifest, tmp_path, voice="v", rate="-10%")
    clip = manifest["contents"][0]["clips"][0]
    assert clip["lineTimes"] == [0.0, 2.0]
    assert clip["durationSec"] == 3.0
