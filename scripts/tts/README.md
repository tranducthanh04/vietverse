# Script sinh audio tiếng Việt bằng edge-tts

Công cụ chạy ở **máy dev** để sinh giọng đọc tiếng Việt (MP3) cho nội dung Vietverse
(bài học, truyện/đồng dao, văn hoá), upload lên backend và gắn `audioUrl` qua luồng
draft → publish của CMS.

> **Lưu ý giấy phép:** `edge-tts` dùng dịch vụ Đọc-to-văn-bản của Microsoft Edge theo
> cách **không chính thức**. Audio sinh ra chỉ nên coi là **audio tạm**; khi có điều kiện
> nên thay bằng giọng thu thật được cấp phép. Xem `docs/content-audio-tts.md`.
> Theo quyết định của user: edge-tts **chỉ dùng để sinh file**, **không** nhúng vào runtime
> backend và không đưa vào image Docker.

## Cài đặt

```bash
cd scripts/tts
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux
```

Cần có `ffmpeg`/`ffprobe` trong PATH để đo thời lượng audio (không bắt buộc; thiếu thì
script vẫn chạy, chỉ kém chính xác hơn ở phần thời lượng truyện).

## Biến môi trường

| Biến | Ý nghĩa |
| --- | --- |
| `VIETVERSE_ADMIN_EMAIL` | Email tài khoản admin (dùng để đăng nhập API) |
| `VIETVERSE_ADMIN_PASSWORD` | Mật khẩu admin |
| `VIETVERSE_API_BASE` | URL gốc API, vd `http://localhost:5093` (mặc định) |

Tài khoản admin **chỉ** đọc từ biến môi trường, **không bao giờ** được ghi ra file hay log.
Không tạo `.env` trong repo.

## Bốn lệnh (chạy đúng thứ tự)

```bash
# 1) export: đọc nội dung đã xuất bản, ghi các ô audioUrl trống ra out/manifest.json
python tts.py export

# 2) generate: sinh MP3 bằng edge-tts (giọng vi-VN-HoaiMyNeural, --rate=-10%), có cache
python tts.py generate --manifest out/manifest.json --out out

# 3) upload: đẩy MP3 lên BE, lưu URL trả về vào manifest
python tts.py upload --manifest out/manifest.json --out out

# 4) apply: gắn audioUrl (và mốc lyrics) qua draft -> publish. MẶC ĐỊNH là dry-run.
python tts.py apply --manifest out/manifest.json              # dry-run: chỉ in kế hoạch
python tts.py apply --manifest out/manifest.json --apply --i-have-backup   # ghi thật
```

### Đổi giọng / tốc độ

```bash
python tts.py generate --voice vi-VN-NamMinhNeural --rate=-5% --manifest out/manifest.json --out out
```

Liệt kê giọng tiếng Việt: `.venv/Scripts/python.exe -m edge_tts --list-voices | grep vi-VN`.

## Cách hoạt động

- **Đặt tên file & cache:** mỗi clip audio đặt tên theo `sha256(voice|rate|text)`. Đã sinh rồi
  thì bỏ qua (cache nằm trong `out/`). (Backend lại đặt tên theo hash *nội dung file* khi upload.)
- **Truyện:** đọc cả truyện trong **một** MP3; mốc thời gian từng dòng lyrics tính từ sự kiện
  `WordBoundary` của edge-tts (yêu cầu `boundary="WordBoundary"`). Mốc luôn tăng nghiêm ngặt và
  `durationSec` ≥ mốc dòng cuối để qua được `validatePublish` của backend.
- **apply an toàn:**
  - Mặc định **dry-run**, chỉ in những gì sẽ đổi; chỉ ghi khi có `--apply`.
  - Chỉ điền ô `audioUrl` **đang trống**, không ghi đè audio có sẵn (kiểm cả ở live lẫn draft).
  - Nội dung đang có **nháp dở của người khác** (`state = editing`) thì **bỏ qua** và báo lại.
  - `--apply` bắt buộc kèm `--i-have-backup` (script in nhắc backup DB trước).

## Chạy test

```bash
# từ gốc repo
scripts/tts/.venv/Scripts/python.exe -m pytest scripts/tts/tests -q
```

## Hợp đồng API đang dùng

- Đăng nhập: `POST /api/v1/auth/login` → `{ data: { accessToken } }`.
- CMS nội dung (admin): `GET/POST/PUT /api/v1/admin/content/{lessons|stories|culture}[/:id[/draft|/publish|/discard-draft]]`.
- Upload audio nội dung: `POST /api/v1/admin/content/audio` (multipart `audio`) → `{ url: "/api/v1/media/audio/<sha>.<ext>" }`.

> Endpoint upload audio (`/admin/content/audio`) và route phát (`/media/audio/:name`) do phase 01
> xây. Script này bám đúng "Hợp đồng chung" của plan nên **không** chạy `upload`/`apply` lên
> production; chỉ chạy thật sau khi phase 01 + 02 đã lên prod và đã backup DB.
