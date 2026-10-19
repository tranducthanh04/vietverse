"""Tính mốc thời gian (timeSec) cho từng dòng lyrics từ sự kiện WordBoundary của edge-tts.

edge-tts phát sự kiện WordBoundary cho từng từ khi đọc cả bài, với 'offset' và 'duration'
tính bằng đơn vị 100 nano-giây (tick). Ta đọc cả truyện trong MỘT file MP3, thu các boundary
theo đúng thứ tự, rồi gán mốc bắt đầu của mỗi dòng = offset của từ đầu tiên thuộc dòng đó.

Hàm ở đây thuần (không gọi mạng/edge-tts) nên test được bằng dữ liệu boundary giả.
"""
from __future__ import annotations

from typing import Sequence, TypedDict

TICKS_PER_SECOND = 10_000_000
# Khoảng cách tối thiểu giữa hai dòng khi phải nới cho mốc tăng nghiêm ngặt.
# validatePublish của BE yêu cầu lyrics[i].timeSec > lyrics[i-1].timeSec khi có audioUrl.
MIN_GAP_SEC = 0.01


class Boundary(TypedDict):
    offset: int  # tick (100 ns)
    duration: int  # tick (100 ns)
    text: str


def ticks_to_seconds(ticks: int) -> float:
    return round(ticks / TICKS_PER_SECOND, 3)


def _word_count(line: str) -> int:
    """Số 'từ' trong một dòng, xấp xỉ theo cách tách từ của edge-tts (theo khoảng trắng)."""
    return len([w for w in line.split() if w])


def compute_lyric_times(
    lines: Sequence[str],
    boundaries: Sequence[Boundary],
    audio_duration_sec: float | None = None,
) -> tuple[list[float], float]:
    """Trả về (danh sách timeSec theo từng dòng, durationSec).

    - Mốc của mỗi dòng = offset (giây) của từ đầu tiên của dòng trong luồng boundary.
    - Nếu một dòng không có từ nào (dòng rỗng) thì lấy mốc của dòng kế tiếp rồi được nới
      ở bước đảm bảo tăng nghiêm ngặt phía dưới.
    - Mốc luôn tăng nghiêm ngặt; durationSec >= mốc dòng cuối (để qua validate của BE).
    """
    starts: list[float] = []
    cursor = 0
    total = len(boundaries)
    for line in lines:
        if cursor < total:
            starts.append(ticks_to_seconds(int(boundaries[cursor]["offset"])))
        elif starts:
            starts.append(starts[-1])
        else:
            starts.append(0.0)
        cursor = min(total, cursor + _word_count(line))

    # Bảo đảm tăng nghiêm ngặt: dòng rỗng hoặc trùng mốc được nới thêm MIN_GAP_SEC.
    for i in range(1, len(starts)):
        if starts[i] <= starts[i - 1]:
            starts[i] = round(starts[i - 1] + MIN_GAP_SEC, 3)

    duration = audio_duration_sec
    if duration is None:
        if boundaries:
            last = boundaries[-1]
            duration = ticks_to_seconds(int(last["offset"]) + int(last.get("duration", 0)))
        else:
            duration = 0.0
    # durationSec phải lớn hơn mốc dòng cuối (BE coi timeSec > durationSec là lỗi).
    if starts and duration <= starts[-1]:
        duration = round(starts[-1] + MIN_GAP_SEC, 3)
    return starts, round(float(duration), 3)
