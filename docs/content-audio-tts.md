# Sinh audio giọng đọc tiếng Việt bằng edge-tts

Ngày 2026-10-19. Tài liệu này mô tả công cụ sinh **giọng đọc tiếng Việt** cho nội dung
Vietverse (bài học, truyện/đồng dao, văn hoá) bằng `edge-tts`, chạy ở **máy dev**. Công cụ
nằm ở [`scripts/tts/`](../scripts/tts/README.md).

## Quyết định nghiệp vụ (owner/user chốt)

- **Audio của nội dung được lưu trên ổ đĩa của backend** (không còn Cloudinary cho audio);
  ảnh bìa vẫn ở Cloudinary. Xem "Hợp đồng chung" trong plan `audio-be-storage`.
- **edge-tts chỉ dùng để sinh file audio**, **không** nhúng vào runtime backend và **không**
  đưa vào image Docker. Việc sinh/upload/gắn audio là một bước vận hành thủ công ở máy dev.
- **Không dùng Kokoro** vì Kokoro không có tiếng Việt (đã kiểm ngày 2026-10-19).

## Lưu ý giấy phép (bắt buộc đọc)

`edge-tts` gọi dịch vụ Text-to-Speech của Microsoft Edge theo cách **không chính thức** (không
có hợp đồng/giấy phép thương mại cho mục đích này). Vì vậy:

- Audio sinh ra chỉ nên coi là **audio tạm** để nội dung có giọng đọc ngay, **không** phải
  giọng thu studio và **không** cam kết chất lượng/âm sắc/hát.
- Khi có điều kiện, **nên thay bằng giọng thu thật** được cấp phép (hoặc nhà cung cấp TTS có
  hợp đồng). Việc thay thế đi qua đúng luồng CMS (draft → publish), không ghi thẳng DB.
- Không phụ thuộc edge-tts ở runtime: nếu dịch vụ đổi/chặn, sản phẩm vẫn chạy vì audio đã là
  file tĩnh trên ổ đĩa backend.

## Giọng và tốc độ mặc định

- Giọng: `vi-VN-HoaiMyNeural` (nữ). Có thể đổi bằng cờ `--voice` (vd `vi-VN-NamMinhNeural`).
- Tốc độ: `--rate=-10%` (chậm hơn 10% cho bé dễ nghe). Đổi bằng cờ `--rate`.
- Liệt kê giọng tiếng Việt: `python -m edge_tts --list-voices | grep vi-VN`.

## Quy trình chạy (ở máy dev)

Chi tiết cài đặt và lệnh ở [`scripts/tts/README.md`](../scripts/tts/README.md). Tóm tắt bốn bước:

1. `export` — đăng nhập admin (tài khoản lấy từ biến môi trường), đọc nội dung **đã xuất bản**,
   ghi các ô `audioUrl` đang trống ra `scripts/tts/out/manifest.json` (kèm id, đường dẫn trường,
   text cần đọc).
2. `generate` — sinh MP3 bằng edge-tts, có **cache** theo `sha256(voice|rate|text)`.
3. `upload` — đẩy MP3 lên `POST /api/v1/admin/content/audio`, lưu URL (`/api/v1/media/audio/<sha>.<ext>`)
   vào manifest.
4. `apply` — gắn `audioUrl` (và mốc lyrics cho truyện) qua đúng luồng **draft → publish** của CMS.

## Các trường audio được phủ

| Loại | Trường được gắn | Text đọc |
| --- | --- | --- |
| Bài học | `activities[].audioUrl` | `prompt` của hoạt động |
| Bài học | `activities[].options[].audioUrl` | `text` của lựa chọn (chỉ khi lựa chọn có chữ) |
| Bài học | `vocabulary[].audioUrl` | `word` của từ vựng |
| Truyện | `audioUrl` (một file cho cả truyện) | toàn bộ `lyrics[].text` |
| Truyện | `lyrics[].timeSec`, `durationSec` | mốc tính từ WordBoundary của edge-tts |
| Văn hoá | `audioUrl` | `intro` |

## Mốc thời gian cho truyện

`Story.lyrics` có mốc `timeSec` cho **từng dòng**. Công cụ đọc cả truyện trong **một** MP3, thu các
sự kiện `WordBoundary` của edge-tts (phải đặt `boundary="WordBoundary"`; mặc định của thư viện là
`SentenceBoundary`) rồi gán mốc bắt đầu mỗi dòng = offset của từ đầu tiên thuộc dòng đó. Mốc được
đảm bảo **tăng nghiêm ngặt** và `durationSec` ≥ mốc dòng cuối, để qua `validatePublish` của backend
(backend coi `timeSec` không tăng dần hoặc vượt `durationSec` là lỗi khi có `audioUrl`).

Nếu một giọng không trả `WordBoundary`, công cụ nhận `SentenceBoundary` làm phương án dự phòng;
nếu không có mốc nào thì vẫn sinh audio cả truyện và điền mốc tăng dần tối thiểu.

## An toàn khi `apply`

- **Mặc định dry-run**: chỉ in những gì sẽ đổi; chỉ ghi khi có cờ `--apply`.
- Chỉ điền ô `audioUrl` **đang trống**; **không ghi đè** audio có sẵn (kiểm cả ở bản live lẫn draft).
- Nội dung đang có **nháp dở của người khác** (`state = editing`) thì **bỏ qua** và báo lại, tránh
  đụng công việc biên tập đang diễn ra.
- `--apply` bắt buộc kèm `--i-have-backup`; công cụ in nhắc backup DB (`deploy/selfhost/backup-now.sh`)
  trước khi cho ghi.
- Gắn audio qua API draft → publish nên giữ đúng versioning và lịch sử nội dung; không ghi thẳng DB.

## Giới hạn và giả định

- **Chưa chạy thật trên production trong thay đổi này.** Theo plan, chỉ chạy `generate` thử ở máy dev;
  `upload`/`apply` chỉ thực hiện sau khi phase 01 (BE lưu trữ audio) và phase 02 (FE + CMS) đã lên prod
  và đã backup DB.
- Endpoint `POST /api/v1/admin/content/audio` và route phát `GET /api/v1/media/audio/:name` do **phase 01**
  xây; công cụ này bám đúng "Hợp đồng chung" của plan, không tự định nghĩa lại.
- **Giả định chờ duyệt**: chất lượng/âm sắc giọng edge-tts cho trẻ em cần content owner nghe và duyệt;
  bản quyền/giấy phép cho mục đích thương mại chưa được xác nhận. Đây là audio tạm, không thay cho giọng
  thu thật đã duyệt.
