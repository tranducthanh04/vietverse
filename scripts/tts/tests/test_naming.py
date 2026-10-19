"""Test đặt tên file theo hash và cơ chế cache."""
import pytest

from ttslib.naming import clip_hash, audio_filename, is_cached, clip_path


def test_hash_deterministic_and_text_sensitive():
    a = clip_hash("vi-VN-HoaiMyNeural", "-10%", "Xin chào")
    b = clip_hash("vi-VN-HoaiMyNeural", "-10%", "Xin chào")
    c = clip_hash("vi-VN-HoaiMyNeural", "-10%", "Tạm biệt")
    assert a == b
    assert a != c
    assert len(a) == 64


def test_voice_and_rate_change_hash():
    base = clip_hash("vi-VN-HoaiMyNeural", "-10%", "x")
    assert base != clip_hash("vi-VN-NamMinhNeural", "-10%", "x")
    assert base != clip_hash("vi-VN-HoaiMyNeural", "+0%", "x")


def test_audio_filename_extension():
    assert audio_filename("v", "-10%", "x").endswith(".mp3")
    assert audio_filename("v", "-10%", "x", "wav").endswith(".wav")


def test_invalid_extension_rejected():
    with pytest.raises(ValueError):
        audio_filename("v", "-10%", "x", "flac")


def test_cache_hit_when_nonempty_file_exists(tmp_path):
    assert not is_cached(tmp_path, "v", "-10%", "hi")
    clip_path(tmp_path, "v", "-10%", "hi").write_bytes(b"\xff\xfb\x00")
    assert is_cached(tmp_path, "v", "-10%", "hi")


def test_empty_file_is_not_cache_hit(tmp_path):
    clip_path(tmp_path, "v", "-10%", "hi").write_bytes(b"")
    assert not is_cached(tmp_path, "v", "-10%", "hi")
