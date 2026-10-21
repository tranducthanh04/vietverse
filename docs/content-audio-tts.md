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
| Bài học | `activities[].audioUrl` | **theo loại hoạt động** — xem bảng ngay dưới |
| Bài học | `activities[].options[].audioUrl` | `text` của lựa chọn (chỉ khi lựa chọn có chữ) |
| Bài học | `vocabulary[].audioUrl` | `word` của từ vựng |
| Truyện | `audioUrl` (một file cho cả truyện) | toàn bộ `lyrics[].text` |
| Truyện | `lyrics[].timeSec`, `durationSec` | mốc tính từ WordBoundary của edge-tts |
| Văn hoá | `audioUrl` | `intro` |

### Text của `activities[].audioUrl` theo loại hoạt động

Trong trình chơi, nút nghe của mỗi hoạt động khi **không** có `audioUrl` sẽ đọc một chuỗi
`textToSpeak` dự phòng. Audio sinh ra cho `audioUrl` phải đọc **đúng chuỗi đó**, nếu không thì
"nghe" sẽ khác "đọc". Bảng dưới rút **trực tiếp từ các component** (quyết định phản chiếu code,
không phải suy đoán):

| `type` | Text đọc (trường trong payload) | Component phản chiếu |
| --- | --- | --- |
| `word_card` | `targetWord` | `WordCardActivity.tsx` — nút "Nghe đọc"; thẻ to thường là **cả đoạn đọc** |
| `listen_choose` | `targetWord` nếu có, **không thì** `prompt` | `ListenChooseActivity.tsx` — nút loa đọc `targetWord \|\| prompt` |
| `fill_blank` | `prompt` | `WrongAnswerFeedback` (trong `FillBlankActivity.tsx`) |
| `sort_order` | `prompt` | `WrongAnswerFeedback` (trong `SortOrderActivity.tsx`) |
| `review` | `prompt` | `WrongAnswerFeedback` (trong `ReviewActivity.tsx`) |
| `multi_select` | `prompt` + `subPrompt` | `NewActivityFrame.tsx` (`MultiSelectActivity`) |
| `group_sort` | `prompt` + `subPrompt` | `NewActivityFrame.tsx` (`GroupSortActivity`) |
| `fill_blanks` | `prompt` + `subPrompt` | `NewActivityFrame.tsx` (`FillBlanksActivity`) |
| `follow_steps` | `prompt` + `subPrompt` + từng `steps[].text` | `NewActivityFrame.tsx` (`FollowStepsActivity`) |
| `drag_match` | — (**không sinh clip**) | `DragMatchActivity.tsx` — không phát `activities[].audioUrl` |
| `record_voice` | — (**không sinh clip**) | `RecordVoiceActivity.tsx` — không phát `activities[].audioUrl` |

- Các phần được **nối bằng `". "`** sau khi bỏ phần rỗng (giống `.filter(Boolean).join(". ")`
  trong `NewActivityFrame.tsx`).
- **Sửa lỗi production**: trước đây công cụ dùng `prompt` cho **mọi** loại, nên `word_card` đọc
  câu hướng dẫn ("Cùng đọc và tìm hiểu.") thay vì đoạn đọc trong `targetWord`. Nay đã theo bảng này.
- **`listen_choose` (bài nghe-rồi-chọn)**: nút loa phải phát **đoạn audio cần nghe**, không phải
  câu hỏi. Đoạn audio được lưu ở `targetWord` (ví dụ B1 HĐ1 lưu "Đây là mẹ."), nên công cụ đọc
  `targetWord` khi có, không thì `prompt`. Dữ liệu cũ trên prod đặt cả đoạn đọc vào `prompt` và
  không có `targetWord`, nên vẫn rơi về `prompt` — hành vi cũ không đổi. Các bài đọc hiểu
  (`targetWord` trống, ví dụ "Con nào sống dưới nước?") vẫn đọc `prompt` như trước.
- **Loại không phát `activities[].audioUrl`** (`drag_match`, `record_voice`) **không sinh clip**
  cho ô đó — tránh sinh audio không ai nghe. Bảng phủ đủ 11 loại trong enum server
  (`content.validation.ts`).
- **Quyết định nghiệp vụ (phiên chính, 2026-10-19)**: vẫn **giữ sinh audio cho
  `options[].audioUrl` và `vocabulary[].audioUrl`** như trước. Việc này **nằm ngoài phạm vi** lỗi
  đang sửa (dù hiện chưa có component nào trong trình chơi phát hai ô đó), nên không gỡ trong lượt
  này để không phá hành vi/test đang xanh.

## Sửa audio mà công cụ đã tự sinh sai trước đó (`--replace-from`)

Dùng khi một lần chạy **cũ** đã ghi `audioUrl` bằng text **sai** (ví dụ `word_card` từng đọc
`prompt`) và nội dung đã lên production. Cờ `--replace-from <manifest-cũ>` cho phép công cụ **thay**
đúng những ô đó, đồng thời **vẫn chừa** audio do người khác tải lên.

Một ô chỉ được thay khi **đồng thời** thoả cả ba điều kiện:

- giá trị `audioUrl` hiện tại trên bản live **đúng bằng** `url` mà manifest cũ đã ghi cho **chính ô đó**;
- text mới (theo bảng loại hoạt động ở trên) **khác** với text cũ trong manifest cũ;
- clip mới đã có `url` (đã `upload`).

Mọi trường hợp khác **giữ nguyên**: audio admin tải lên (url khác url cũ), ô mà lần cũ **không**
ghi, và ô có text **không đổi**. Không có `--replace-from` thì cả `export` lẫn `apply` **giữ hành
vi cũ** (chỉ điền ô trống, không bao giờ đè).

Quy trình (cần giữ **manifest của lần chạy cũ** — chính file đã dùng để `apply` sai trước đây):

1. `export --replace-from out/manifest-cu.json` — manifest mới gồm cả ô cần sửa (ô trống **và** ô
   có live khớp url cũ & text đã đổi).
2. `generate` — sinh MP3 cho text mới.
3. `upload` — đẩy MP3, lưu url mới vào manifest.
4. `apply --replace-from out/manifest-cu.json` — **dry-run**, in kế hoạch thay; kiểm kỹ.
5. `apply --replace-from out/manifest-cu.json --apply --i-have-backup` — ghi thật (sau khi backup DB).

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
- **Ngoại lệ duy nhất là chế độ `--replace-from`** (xem mục riêng ở trên): chỉ thay đúng audio mà
  lần chạy cũ tự ghi (live khớp url cũ **và** text đã đổi), kiểm lại cả ở bản live lẫn draft; audio
  người khác tải lên không bao giờ bị đụng.
- Nội dung đang có **nháp dở của người khác** (`state = editing`) thì **bỏ qua** và báo lại, tránh
  đụng công việc biên tập đang diễn ra.
- **Nên chạy `--apply` vào lúc không ai biên tập.** Giữa lúc công cụ đọc nội dung và lúc mở nháp
  vẫn có khe hẹp (TOCTOU): nếu đúng khe đó một admin khác mở nháp, server sẽ trả về chính nháp
  của họ. Để không publish đè nhầm công việc dở của người khác, sau khi mở nháp công cụ **xác nhận
  nháp trả về đúng là của mình** (so `updatedBy` với admin đang đăng nhập và `draftVersion` với mức
  kỳ vọng); nếu không chắc thì **bỏ qua, không đụng** nháp đó và báo lại.
- **Cô lập lỗi theo từng nội dung**: một nội dung lỗi (vd xung đột version, lỗi tạm 5xx) **không làm
  dừng cả mẻ**. Nếu lỗi xảy ra sau khi đã mở nháp, công cụ **dọn (discard) nháp vừa mở** để lần chạy
  lại không bị chặn, ghi nội dung đó là `error` rồi tiếp tục. Cuối cùng in tổng kết (áp dụng / dự
  kiến / bỏ qua / lỗi) và **trả mã khác 0** nếu có nội dung lỗi.
- **Chỉ tự retry trên thao tác an toàn**: `GET` và `publish` (server chống trùng publish bằng
  receipt) được tự thử lại khi mạng chập chờn / lỗi 5xx; `start_draft`/`save_draft` **không** tự
  retry (tránh conflict giả do gửi lại ghi không idempotent) — lỗi của chúng được xử lý ở lớp
  từng-nội-dung ở trên.
- **Mốc lyrics của truyện** chỉ được gắn khi còn **khớp lyrics hiện tại** (số dòng và nội dung từng
  dòng không đổi kể từ lúc `export`); nếu lệch thì **bỏ qua** nội dung đó và báo, tránh gắn mốc sai
  vị trí.
- `--apply` bắt buộc kèm `--i-have-backup`; công cụ in nhắc backup DB (`deploy/selfhost/backup-now.sh`)
  trước khi cho ghi.
- Gắn audio qua API draft → publish nên giữ đúng versioning và lịch sử nội dung; không ghi thẳng DB.

## Hoạt cảnh mở đầu chặng (`gen_stage_intro.py`)

Khác với bốn lệnh CMS ở trên (gắn `audioUrl` vào DB qua draft → publish), lời chào mở đầu chặng của
Sao Lí Lắc là **file tĩnh trong client**, không đụng DB/CMS. Công cụ riêng:
[`scripts/tts/gen_stage_intro.py`](../scripts/tts/README.md).

- **Nguồn lời (một nơi duy nhất):** `client/src/features/quest-map/stageIntroScripts.json` chứa lời
  5 chặng đã duyệt (trường `vi`) kèm bản dịch `en/ja/ko/zh/fr`, và cả `voice`/`rate`. Cả client
  (`stageIntroScripts.ts`) và script sinh audio đều đọc file này, nên lời không lệch hai nơi. Sửa
  lời thì sửa ở đây rồi sinh lại audio. Lời gốc khách: `docs/customer-source/2026-10-21/stage-intro.md`.
- **Sinh audio (ở máy dev, cần mạng):**
  ```bash
  cd scripts/tts
  python -m venv .venv                                        # nếu chưa có
  .venv/Scripts/python.exe -m pip install edge-tts mutagen    # Windows; mutagen chỉ để đo thời lượng khi thiếu ffprobe
  .venv/Scripts/python.exe gen_stage_intro.py
  ```
- **Kết quả:** 5 file `client/public/audio/stage-intro/stage-<n>.mp3`, giọng `vi-VN-HoaiMyNeural`,
  rate `-10%` (cùng giọng với bài học). Script in thời lượng từng file và **cảnh báo nếu vượt 16 giây**
  (mục tiêu 8–16 giây); trả mã khác 0 khi có cảnh báo để người chạy xem lại.
- **Triển khai:** file nằm trong `client/public` nên deploy cùng frontend, không cần `upload`/`apply`,
  không cần endpoint BE. Client phát qua thẻ `<audio>` riêng, không đụng luồng narration của bài học.
- Vượt 16 giây thì rút ngắn lời trong JSON rồi chạy lại; đây là audio tạm edge-tts như phần trên, nên
  thay bằng giọng thu thật khi có điều kiện.

## Giới hạn và giả định

- **Chưa chạy thật trên production trong thay đổi này.** Theo plan, chỉ chạy `generate` thử ở máy dev;
  `upload`/`apply` chỉ thực hiện sau khi phase 01 (BE lưu trữ audio) và phase 02 (FE + CMS) đã lên prod
  và đã backup DB.
- Endpoint `POST /api/v1/admin/content/audio` và route phát `GET /api/v1/media/audio/:name` do **phase 01**
  xây; công cụ này bám đúng "Hợp đồng chung" của plan, không tự định nghĩa lại.
- **Giả định chờ duyệt**: chất lượng/âm sắc giọng edge-tts cho trẻ em cần content owner nghe và duyệt;
  bản quyền/giấy phép cho mục đích thương mại chưa được xác nhận. Đây là audio tạm, không thay cho giọng
  thu thật đã duyệt.
