"""Thư viện hỗ trợ cho script sinh audio edge-tts của Vietverse.

Các module thuần (naming, timing, manifest, apply) không phụ thuộc edge-tts hay mạng
nên test được độc lập. Module synth import edge-tts trễ (lazy) để các lệnh/khâu khác
chạy được khi chưa cài edge-tts.
"""
