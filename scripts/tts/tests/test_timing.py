"""Test tính mốc lyrics từ dữ liệu WordBoundary giả."""
from ttslib.timing import compute_lyric_times, TICKS_PER_SECOND


def boundary(offset_sec, dur_sec=0.3, text="x"):
    return {"offset": int(offset_sec * TICKS_PER_SECOND), "duration": int(dur_sec * TICKS_PER_SECOND), "text": text}


def test_line_start_equals_first_word_offset():
    lines = ["Con cò bé bé", "Nó đậu cành tre"]  # 4 từ + 4 từ
    boundaries = [boundary(i * 0.5) for i in range(8)]
    times, duration = compute_lyric_times(lines, boundaries)
    assert times[0] == 0.0
    assert times[1] == 2.0  # từ đầu dòng 2 là boundary thứ 4 -> 4 * 0.5
    assert duration >= times[-1]


def test_times_strictly_increasing_with_empty_line():
    lines = ["một hai", "", "ba"]  # 2, 0, 1 từ
    boundaries = [boundary(0.0), boundary(0.4), boundary(1.0)]
    times, _ = compute_lyric_times(lines, boundaries)
    assert times[0] < times[1] < times[2]


def test_explicit_duration_is_used():
    lines = ["a b"]
    boundaries = [boundary(0.0), boundary(0.5)]
    _, duration = compute_lyric_times(lines, boundaries, audio_duration_sec=5.0)
    assert duration == 5.0


def test_duration_extended_when_not_past_last_line():
    lines = ["a", "b"]
    boundaries = [boundary(0.0), boundary(5.0)]
    times, duration = compute_lyric_times(lines, boundaries, audio_duration_sec=1.0)
    assert duration > times[-1]


def test_no_boundaries_degrades_gracefully():
    lines = ["a", "b"]
    times, duration = compute_lyric_times(lines, [])
    assert times[0] == 0.0
    assert times[1] > times[0]
    assert duration >= times[-1]
