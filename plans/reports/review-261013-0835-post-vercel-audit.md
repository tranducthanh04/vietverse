# Review sau khi chuyển backend sang Vercel — 2026-10-13

Phạm vi: 32 commit `a012ead..8182840` trên `main` (backend Vercel, upload audio trực tiếp, narration, Google sign-in, admin provisioning, bootstrap, nhiều ngôn ngữ đồng hành, giá gói, báo cáo doanh thu, upload ảnh CMS). Chỉ đọc, không sửa code.

## Kết quả kiểm tra tự động

| Kiểm tra | Kết quả |
|---|---|
| Typecheck | Sạch |
| Test server | 426/427 — `recordingFinalize.test.ts` fail (chính là lỗi A1 bên dưới, tái hiện 2/4 lần chạy) |
| Test client | 217/219 — 2 test `cmsContentEditors` lỗi `AbortSignal` do Node 26 local; CI Node 20 không bị |
| Build client | OK, nhưng 1 chunk JS 722 KB (215 KB gzip), Vite cảnh báo > 500 KB |

## Ưu tiên sửa (tổng hợp)

| # | Mức | Vấn đề | Loại |
|---|---|---|---|
| S1 | **Critical — đã xác nhận trên production** | CORS tin `https://vietverse.vercel.app` (site của người khác) kèm credentials | Bảo mật |
| P1 | **Nghiêm trọng** | Function chạy ở `iad1` (Mỹ), mỗi lượt DB ~200 ms | Hiệu năng |
| A1 | High — đã tái hiện | Finalize bản thu đồng thời trả 503 thay vì receipt | Audio |
| A2 | High | Audio của bé vẫn công khai sau khi xóa hồ sơ, trái docs/02 | Audio / nghiệp vụ |
| S2 | High (nghi ngờ) | Rate limit có thể bị gộp IP sau rewrite FE → BE | Bảo mật / vận hành |
| A-S1 | High nếu đúng | WebM của Chrome có thể thiếu duration → finalize từ chối mọi bản thu | Audio, cần test thiết bị thật |
| P2 | Cao | Font Material Symbols 4 MB cho ~12 icon | Hiệu năng client |
| P3 | Cao | Không chia nhỏ route, JS 722 KB | Hiệu năng client |
| P4 | Cao | `GET /stages` N+1 + tải nguyên lesson | Hiệu năng DB |

## 1. Bảo mật và tính đúng đắn

### S1 — Critical, đã xác nhận
- `server/src/httpApp.ts:41-60` allowlist cứng `https://vietverse.vercel.app` và `localhost`, `credentials: true`. Cookie refresh `SameSite=None` (`auth.controller.ts:16,41,66,84`, `google.controller.ts:8`).
- Đã kiểm tra: `https://vietverse.vercel.app` là site khác ("VietVerse - Explore Vietnamese Heritage Through AI & Community"). Preflight tới `https://vietverse-nine.vercel.app/api/v1/auth/refresh` với Origin đó trả `Access-Control-Allow-Origin: https://vietverse.vercel.app` + `Allow-Credentials: true`.
- Hệ quả: chủ site đó có thể gọi `/auth/refresh` từ trình duyệt nạn nhân đang đăng nhập, đọc access token, chiếm phiên (kể cả admin). Repo đang **public**.
- Sửa: allowlist production chỉ từ `CLIENT_ORIGIN`; bỏ origin cứng và localhost ở production; cookie `SameSite=Lax` (FE đã proxy `/api` cùng origin); kiểm Origin cho `/auth/refresh`, `/auth/logout`. Origin lạ hiện trả 500, nên trả 403.

### S2 — High (nghi ngờ)
- `server/src/middlewares/clientIp.ts:21`: key rate limit từ `x-vercel-forwarded-for`; sau rewrite FE → BE có thể là IP egress của FE. Agent hiệu năng đo bằng 1 IP thấy cùng bucket, chưa thử 2 IP. Nếu gộp: `authLimiter` 30/15 phút thành giới hạn toàn hệ thống.
- Sửa: đo bằng 2 IP khác nhau; thêm limiter theo email/tài khoản cho login/link.

### Medium
- **M1** Repo public lộ host Atlas, user DB và tên DB (`server/scripts/provision-admin.cjs:51`, `bootstrap-production.cjs:30`, `provisionAdmin.ts:104`, `bootstrapCustomer.ts:30`, docs). Không thấy mật khẩu. Cần siết network allowlist Atlas và quyền tối thiểu.
- **M2** Bọc transaction biến mọi lỗi thiếu `statusCode` thành 503 (`lessons.service.ts:72-75`, `children.service.ts:58-61,97-100`, `google.service.ts:51-58`). ID sai → 503 "DB chưa sẵn sàng", client retry vô ích. Validate ObjectId ở boundary, chỉ map lỗi transient thành 503.

### Low
- Pre-account hijack: đăng ký không xác minh email → nạn nhân bị khóa khỏi Google sign-in (cần quyết định nghiệp vụ).
- Báo cáo doanh thu: khi không lọc ngày, tổng gồm đơn thiếu `paidAt` nhưng chuỗi theo tháng thì không (`admin/revenue.ts:34-36`).
- Ticket ảnh CMS ký bằng `JWT_SECRET` và `authMiddleware` không kiểm `aud` (`contentImages.routes.ts:33`).
- Upload ảnh CMS có thể để asset mồ côi khi file lớn.
- User Google nhận PIN Parent Gate mặc định `1234` (`google.service.ts:104`).

### Đã kiểm, ổn
Google token (aud/iss/exp/email_verified/nonce, flow một lần), provisioning admin (chỉ CLI), bootstrap (chạy tay, không đụng CMS), migration nhiều ngôn ngữ, giá gói khớp FE/BE và webhook, ViVi Points (PR #2) không bị phá — `completeLesson` giờ gói trong transaction.

## 2. Audio

### A1 — High, đã tái hiện
`server/src/modules/recordings/recordings.persistence.ts:42,65`: hai finalize cùng intent → WriteConflict, retry 3 lần không backoff → 503; nhánh catch bỏ qua tìm receipt. Bé thấy lỗi dù bản thu đã lưu. Sửa: luôn `findOwnedRecordingReceipt(intentId)` trước khi ném lỗi, hoặc khóa intent `pending→finalizing`, thêm backoff.

### A2 — High
`children.service.ts:89` chỉ xóa document; `directAudioStorage.ts:17` upload `type: upload` (URL công khai). Xóa hồ sơ bé không xóa audio trên Cloudinary, trái `docs/02-business-rules.md` (cascade, "ngăn rò rỉ âm thanh của trẻ"). Sửa: destroy asset sau commit; lâu dài dùng `type: authenticated` + URL ký. Hoặc chủ dự án chấp nhận debt và sửa docs/02.

### Medium
- **M1** Endpoint cũ `POST /recordings` vẫn mở, upload `resource_type: 'auto'` — nhận file bất kỳ làm đáp án `record_voice`, và cho lưu nội dung tùy ý lên Cloudinary (`recordings.routes.ts:26`, `recordings.service.ts:25-43`). Tắt ở production.
- **M2** Finalize phụ thuộc Cloudinary Admin API (giới hạn số lần gọi mỗi giờ) — vượt hạn mức thì mọi bé không nộp được bài (`directAudioStorage.ts:27`).
- **M3** Chữ ký Cloudinary không ràng `resource_type`, sống ~1 giờ; `max_file_size` của preset chưa xác minh; `upload-intent` chỉ có limiter chung 120/phút.
- **M4** Upload trực tiếp không timeout → nút "Gửi" có thể quay mãi trên mạng yếu (`directRecordingUpload.ts:65`, `api.ts:5`).

### Cần test thiết bị thật
- WebM của Chrome thường thiếu duration → nếu Cloudinary không trả `duration`, finalize trả 422 cho **mọi** bản thu Chrome; `audio/mp4` iOS có thể bị chặn `hasVideo` (`directAudioStorage.ts:41,47`). Phải upload thật trên Chrome desktop, Android, iOS Safari.
- iOS có thể chặn TTS khi `speak()` chạy ngoài user gesture → nút kẹt "Dừng đọc" mà không có tiếng (`useNarration.ts:140-153,183-185`). Thêm watchdog.
- Android trả `vi_VN` → không tìm thấy giọng Việt (`useNarration.ts:122-125`). Chuẩn hóa `_` → `-`.
- `listen_choose` khi thiếu audio chỉ đọc câu hỏi, bé phải đoán (`ListenChooseActivity.tsx:42-48`) — cần quyết định nghiệp vụ.

### Low
- `ParentRecordingsPage.tsx:23-35` không dừng audio khi rời trang, `play()` không `.catch`.
- `AdminLearnersPage.tsx:341` dùng `rec.audioUrl` nhưng server trả `url` → admin không bao giờ thấy trình phát.

### Đã kiểm, ổn
Quyền sở hữu khi finalize, không lộ API secret, MediaStream/Object URL được dọn, `speechSynthesis` được cancel, nội dung `audioUrl: ""` hiển thị gọn.

## 3. Hiệu năng

### Đối chiếu plan cũ (`plans/261009-1952-perf-and-vivi-points-completion/plan.md`)

| Mục | Trạng thái |
|---|---|
| Cold start Render / keep-warm | Không còn áp dụng; Vercel vẫn cold start 2 s (`/health`), 6 s request API đầu (1 mẫu) |
| Region DB | **Còn, nặng hơn** — function ở `iad1` |
| Nén response | Đã có (Vercel tự `br`) |
| Rate limit sau proxy | Đã sửa (cần đo 2 IP) |
| Mongo pool/socketTimeout | Một phần |
| `submitLesson` tải cả chặng | Đã sửa |
| F5 3 request auth | Còn |
| Code splitting | Còn (722 KB) |
| Font | Còn (Material Symbols 4 MB) |
| Ảnh hotlink | Một phần (còn 5 chỗ) |
| Cache `/assets` | Còn (`max-age=0`) |

### Phát hiện (số đo từ máy ở Việt Nam, edge `hkg1`)
- **P1 Nghiêm trọng** — `server/vercel.json` không có `regions` → function ở `iad1`. Đo: `/health` 0,40–0,46 s; mỗi lượt Mongo thêm ~200 ms; `/culture` 0,8 s. Ước tính F5 ~3 s, mở bài ~2,5–3 s, nộp bài ~4–5 s. Sửa: xác nhận region Atlas, đặt `"regions": ["sin1"]` (nếu Atlas ở Singapore). Ước tính `/culture` còn 0,1–0,15 s.
- **P-N2 Cao** — rate limiter lưu trên Mongo: +1 lần ghi (~200 ms) cho mọi request. Hết vấn đề sau P1.
- **P4 Cao** — `GET /stages`: 4 query nối tiếp + 2S−1 `Lesson.find` tải nguyên document chỉ để đếm (`stages.service.ts:10-56`).
- **P-N4 Trung bình–Cao** — Mongoose `autoIndex` chạy mỗi cold start; import nặng (cloudinary, google-auth, payos, bcrypt) ngay khi khởi động.
- **P-N5 Trung bình–Cao** — `assertLessonUnlocked` tối đa 10 query nối tiếp; `readPublished` đọc lại lesson vừa tải (`lessons.policy.ts:36-97`).
- **P2 Cao** — Material Symbols 4.001.276 byte cho ~12 icon (`client/index.html:13`). Thay bằng `lucide-react` (đã có) và bỏ `<link>`.
- **P3 Cao** — không `React.lazy` trong `router.tsx`; chunk 722 KB gồm cả admin/CMS.
- **Trung bình** — F5 3 request auth; cache `/assets` `max-age=0`; query không limit ở recordings/parent/admin; `totalEarned` tính lại mỗi lần "Xem thêm".

## Thứ tự đề xuất
1. **S1** sửa CORS + SameSite (nhỏ, khẩn).
2. **P1** đổi region function cùng Atlas (chỉ cấu hình, lợi ích lớn nhất).
3. **A1** finalize trả receipt; test upload thật trên 3 nền tảng (A-S1); tắt `POST /recordings` cũ.
4. **P2, P3, cache `/assets`** (client, rủi ro thấp).
5. **P4, P-N5, autoIndex** (DB).
6. **A2** quyết định xóa audio khi xóa hồ sơ bé.
7. Còn lại theo mức.

## Câu hỏi còn mở
1. Atlas cluster nằm region nào? Gói Vercel có chọn được region function không, có bật Fluid compute không?
2. Chấp nhận "audio công khai sau khi xóa bé" là debt tạm hay chặn trước?
3. Preset Cloudinary production đã bật `max_file_size` chưa, và hạn mức Admin API của gói là bao nhiêu?
4. `listen_choose` thiếu audio: cho TTS đọc đáp án hay chặn publish?
