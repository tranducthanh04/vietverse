"""Đưa thư mục scripts/tts vào sys.path để test import được package `ttslib`.

Nhờ pytest.ini cạnh file này, rootdir = scripts/tts nên conftest.py luôn được nạp dù
chạy `python -m pytest scripts/tts/tests` từ gốc repo.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
