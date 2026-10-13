# 06 — Kết quả review senior BA/code

## Bảo mật sau chuyển BE sang Vercel — 2026-10-13, local

Nguồn: [review 2026-10-13](../plans/reports/review-261013-0835-post-vercel-audit.md). Sửa trên nhánh `fix/post-vercel-audit`, chưa deploy; cần operator cấu hình env bên dưới trước khi phát hành.

- **S1 (Critical) — đã sửa local.** Bỏ origin cứng `https://vietverse.vercel.app` (site của bên thứ ba) và `localhost` khỏi allowlist production; CORS chỉ tin `CLIENT_ORIGIN` + `CLIENT_ORIGINS` (`server/src/middlewares/originPolicy.ts`). Origin lạ nhận 403 `ORIGIN_NOT_ALLOWED` thay vì 500, không có header CORS. Refresh/Google cookie chuyển `SameSite=Lax` (production giữ `Secure`); `/auth/refresh`, `/auth/logout` kiểm `Origin` khi có. Phiên đã phát hành trước bản sửa không bị thu hồi tự động; *quyết định chờ owner*: có xoay `JWT_REFRESH_SECRET`/thu hồi toàn bộ refresh token sau deploy hay không, vì không loại trừ được việc site kia đã đọc token.
- **Bootstrap auth** — `POST /auth/refresh` trả thêm `user`/`subscription`; F5 còn một request auth thay vì 2–3 (xem `05` mục Phiên, cookie và origin).
- **M1 — đã sửa trong code/docs.** Host Atlas, DB user và DB name không còn trong script/seed/docs; launcher đọc `VIETVERSE_DB_HOST`/`VIETVERSE_DB_USER`/`VIETVERSE_DB_NAME` từ phiên shell operator và CLI con chỉ nhận URI khớp đúng target khai báo. Lịch sử git (repo public) vẫn chứa giá trị cũ: owner cần siết Atlas network allowlist, quyền tối thiểu của DB user và cân nhắc đổi DB user.
- **M2 — đã sửa.** Wrapper transaction (`lessons.service`, `children.service`, `google.service`) chỉ map lỗi driver tạm thời (network/server selection/timeout, nhãn `TransientTransactionError`/`UnknownTransactionCommitResult`, WriteConflict hết lượt retry) thành 503; Zod/CastError/lỗi có `statusCode` đi tới error handler (400/404), Mongoose ValidationError thành 400, lỗi lập trình còn lại là 500. `lessonId` và `childId` của bài học được kiểm ObjectId ở boundary.
- **Báo cáo doanh thu (Low) — đã sửa.** `totalRevenue`/`byPlan` dùng cùng bộ lọc với `series` (chỉ đơn có `paidAt` kiểu ngày), tổng luôn bằng Σ series; đơn thiếu ngày chỉ hiện ở `undatedOrders`.
- **Ticket ảnh CMS / token mục đích riêng (Low) — đã sửa.** `authMiddleware` từ chối JWT có `aud` hoặc `purpose` và yêu cầu `id`/`role` hợp lệ; ticket ảnh CMS (`aud: cms-cover-image`) và Parent Gate token (`purpose: parent_gate`) không dùng được làm access token. Access token hiện có không mang các claim này nên không ai bị đăng xuất.
- **PIN Parent Gate mặc định (Low) — chưa sửa, câu hỏi mở.** Không chỉ user Google mà mọi user tạo qua đăng ký đều nhận hash PIN `1234` từ default của `User.parentGatePin`; chỉ `provisionAdmin` đặt PIN ngẫu nhiên. Chưa có luồng "đặt/đổi PIN" nào cho phụ huynh, nên đặt PIN ngẫu nhiên sẽ chỉ khóa lựa chọn PIN mà không có cách đặt lại. Parent Gate còn cho qua bằng phép nhân và mật khẩu, nên PIN không phải lớp yếu duy nhất. *Cần owner quyết định*: thêm luồng đặt PIN (bắt buộc khi lần đầu mở gate) hay bỏ phương thức PIN.
- **L1 Pre-account hijack — mở, cần quyết định nghiệp vụ.** Đăng ký email không xác minh email, nên người khác có thể đăng ký trước bằng email của nạn nhân; khi nạn nhân đăng nhập Google, server yêu cầu mật khẩu Vietverse (do kẻ tấn công đặt) để liên kết, khiến nạn nhân bị khóa khỏi Google sign-in cho email của chính mình. Lựa chọn: xác minh email khi đăng ký, hoặc cho Google (email_verified) chiếm quyền tài khoản chưa xác minh kèm thu hồi phiên/mật khẩu cũ. Người quyết định: owner sản phẩm. Chưa triển khai.

## Audio sau chuyển BE sang Vercel — 2026-10-13, local

Nguồn: mục 2 của [review 2026-10-13](../plans/reports/review-261013-0835-post-vercel-audit.md). Sửa trên nhánh `fix/post-vercel-audit`, chưa deploy, chưa gọi Cloudinary thật. Không đổi điểm, quyền, ownership hay quy tắc publish.

- **A1 (High) — đã sửa.** Finalize trước tiên giành quyền intent `pending → finalizing` (lease 45 giây, `claimToken`) bằng `findOneAndUpdate` rồi mới gọi `inspect`; request đồng thời không gọi provider mà chờ (backoff có jitter, tối đa 15 giây) để trả **cùng receipt**. Mọi nhánh lỗi có `intentId` đều tra receipt trước khi ném lỗi; lỗi nghiệp vụ/provider trả claim về `pending`. Retry transaction có backoff jitter (tối đa 4 lượt). Nếu sau 15 giây chủ claim vẫn chưa xong thì trả `409 UPLOAD_FINALIZE_IN_PROGRESS` (không phải 503); claim bị bỏ rơi được chiếm lại sau lease. `recordingFinalize.test.ts` chạy 6 lần liên tiếp đều qua, có thêm ca 4 request song song.
- **A2 (High) — đã sửa.** Xóa hồ sơ bé đọc publicId (Recording + intent chưa hoàn tất) **trong** transaction xóa, sau commit mới `destroy` với `invalidate: true` và đúng `resource_type`: direct là `video`; legacy dùng `Recording.resourceType` (mới lưu từ kết quả upload `auto`), nếu không có thì suy từ URL, cuối cùng thử lần lượt `video → raw → image`. Lỗi provider, thiếu cấu hình hoặc vượt ngân sách thời gian (8 giây, 4 luồng) ghi vào collection mới `AudioCleanupTask` (publicId, resourceType, source, childId, lastError, attempts); không làm hỏng thao tác xóa. Data URI local được bỏ qua. Xem [quy tắc cascade](./02-business-rules.md) và [runbook](./vercel-deployment.md#audio-ops--sửa-local-2026-10-13-chưa-deploy).
- **M1 — đã sửa.** `POST /recordings` (multipart cũ) tắt mặc định ở production, trả `410 LEGACY_RECORDING_UPLOAD_DISABLED` trước khi nhận file; bật lại bằng `LEGACY_RECORDING_UPLOAD_ENABLED=true`. Dev/test mặc định bật vì client dev (không có `VITE_DIRECT_RECORDING_UPLOAD=true`) vẫn dùng endpoint này; client build production chỉ dùng direct upload. Bù xóa khi bị từ chối nghiệp vụ dùng đúng `resource_type` provider trả về; bù xóa thất bại vào `AudioCleanupTask`. *Giả định*: không còn client production cũ nào gọi multipart (bundle cũ trong cache sẽ nhận 410 và cần tải lại trang).
- **M2 — đã sửa phần phân loại.** Admin API trả 420/429 → `503 UPLOAD_STORAGE_RATE_LIMITED` kèm header `Retry-After` (số giây tới đầu giờ kế tiếp, tối thiểu 30 — *giả định* hạn mức Admin API reset theo giờ), log riêng `op: recording_inspect`. Xác minh không cần Admin API (dùng chữ ký trong response upload) **chưa làm**: chữ ký đó chỉ phủ `public_id`/`version`, không phủ codec/duration/bytes nên không thay được bước kiểm metadata; cần client gửi thêm dữ liệu và đổi contract finalize.
- **M3 — đã sửa.** `upload-intent` có limiter theo tài khoản 10/phút và 200/ngày (Mongo store dùng chung ở production, key `user:<id>`), 429 `RATE_LIMIT_EXCEEDED`. Chữ ký Cloudinary không cấu hình được thời hạn; server ký với `timestamp` lùi 45 phút để quyền upload hết sau khoảng 15 phút (intent 10 phút + biên upload). *Giả định cần nghiệm thu staging*: Cloudinary từ chối timestamp cũ hơn đúng 1 giờ ("Stale request"). `max_file_size`/`allowed_formats` của preset là bước ops trong console.
- **M4 — đã sửa.** Upload provider có timeout 60 giây (`AbortSignal.timeout`, fallback `AbortController` cho trình duyệt cũ); Axios mặc định `timeout: 30000`. Sau timeout, lần bấm "Thử gửi lại" hỏi finalize trước, chỉ upload lại khi server trả `UPLOAD_ASSET_NOT_FOUND`; nút spinner được nhả, cho phép gửi lại hoặc thu lại, có thông báo tiếng Việt cho timeout/mất mạng.
- **A-S1 WebM/iOS — sửa phía server, chưa nghiệm thu thiết bị.** `inspect` chấp nhận audio thiếu/0 duration khi có codec audio, định dạng cho phép và bytes ≤ 5 MiB (`durationSec` lưu 0, log cảnh báo); duration có giá trị vẫn phải ≤ 180. Luồng video placeholder (không kích thước, không frame) được coi là audio-only **chỉ khi** Cloudinary đánh dấu `is_audio: true`; video thật/oversize vẫn bị từ chối. Bản thu thiếu duration không còn chứng minh được giới hạn 180 giây bằng metadata; trần thực tế là 5 MiB và auto-stop 179 giây ở client.
- **Narration — đã sửa, chưa nghiệm thu thiết bị.** Chuẩn hóa `vi_VN → vi-VN` khi chọn giọng; watchdog 2,5 giây sau `speak` không có `onstart` thì dừng, nhả trạng thái "Dừng đọc" và hiện lỗi; trên iOS `toggle` phát một utterance rỗng đồng bộ trong thao tác chạm để mở khóa TTS. *Rủi ro*: trình duyệt phát tiếng nhưng không bắn `onstart` sẽ bị watchdog dừng.
- **Low — đã sửa.** Trang bản thu phụ huynh dừng audio khi rời trang, `play()` bị chặn thì trả nút về trạng thái phát, và dùng chung cơ chế "một trình phát" với narration. Admin xem học viên dùng `rec.url` (đúng field server). `GET /recordings/children/:childId` dùng `.lean()` và giới hạn 200 bản mới nhất, giữ nguyên shape response.
- **S5 orphan — quyết định kỹ thuật.** Intent chưa hoàn tất giữ 30 ngày (`deleteAt`), intent đã hoàn tất 7 ngày kể từ lúc hoàn tất, để publicId còn tra được trước khi TTL xóa. Intent tạo trước bản sửa vẫn giữ `deleteAt` 7 ngày cũ (không migrate). Truy vấn đối soát nằm trong [runbook](./vercel-deployment.md#audio-ops--sửa-local-2026-10-13-chưa-deploy).
- **Thay đổi API cần đồng bộ vào `05`** (chưa sửa `05` trong lượt này vì file thuộc phạm vi khác): mã lỗi mới `410 LEGACY_RECORDING_UPLOAD_DISABLED`, `409 UPLOAD_FINALIZE_IN_PROGRESS`, `503 UPLOAD_STORAGE_RATE_LIMITED` + `Retry-After`, `429` cho `upload-intent`; `durationSec` có thể là `0` khi provider không trả duration; intent có trạng thái `finalizing`, `claimToken`, `claimedAt`; `Recording.resourceType` (select:false); collection `AudioCleanupTask`; danh sách bản thu tối đa 200.
- **Câu hỏi mở (nghiệp vụ, người quyết định: owner/content owner):** `listen_choose` không có audio nguồn hiện chỉ hiển thị thông báo "Chưa có audio nguồn" và cho giọng thiết bị đọc câu hỏi; chưa quyết định chặn publish, bắt buộc audio, hay cho TTS đọc đáp án. Quy tắc publish **không đổi** trong lượt này.
- **Còn mở:** `type: authenticated` + URL ký cho audio (URL hiện vẫn công khai cho tới khi bị xóa); worker xử lý `AudioCleanupTask` tự động; cập nhật `deploy:indexes` nếu cần index cho collection mới (hiện không khai báo index).

## Hiệu năng sau chuyển BE sang Vercel — 2026-10-13, local

Nguồn: mục 3 của `plans/reports/review-261013-0835-post-vercel-audit.md`. Sửa local, chưa deploy; bước vận hành ở [vercel-deployment — Region và hiệu năng](./vercel-deployment.md).

- **P1 Region [ĐÃ SỬA, chờ deploy]:** Atlas ở AWS ap-east-1 (Hong Kong). `server/vercel.json` đặt `regions: ["hkg1"]` thay cho mặc định `iad1`. Project setting Function Region không được ghi đè.
- **P-N4 autoIndex/import nặng [ĐÃ SỬA MỘT PHẦN]:** Production kết nối với `autoIndex:false`, `autoCreate:false`, `socketTimeoutMS:45000`. Index chỉ tạo qua `deploy:indexes --apply`, script nay phủ mọi schema index (gồm PointTransaction `{childId, createdAt}` và partial unique, PointRule, ShopItem) cộng `paymentorders {status, paidAt}`. **Rủi ro mới:** nếu quên `--apply` trước deploy thì index mới không tồn tại trên Production (unique/TTL không được thực thi). PayOS SDK chỉ nạp khi có thao tác thanh toán. **Còn tồn:** `cloudinary` vẫn import tĩnh ở module audio (`storage.service.ts`, `directAudioStorage.ts`, `audioAssetCleanup.ts`) và `contentImageStorage.sign()` đồng bộ; `google-auth-library` import tĩnh trong `google.service.ts` (auth). Cả hai cần đổi trong module sở hữu (lazy `import()` trong hàm verify/inspect).
- **P4 `GET /stages` [ĐÃ SỬA]:** 5 query chạy song song, lesson tải một lần bằng aggregate chỉ lấy `stageId order title description freeInStarterPlan` và số activity (`$size`). Số query cố định, không còn tăng theo số chặng; response giữ nguyên. Test `stagesMap.test.ts` khóa số query.
- **P-N5 mở/nộp bài [ĐÃ SỬA]:** `assertLessonUnlocked` chạy song song các read độc lập khi không có session (vẫn kiểm theo thứ tự cũ nên mã lỗi không đổi), tuần tự trong transaction. Child, progress, subscription và danh sách bài trong chặng chỉ lấy field cần. `readPublished` nhận lesson đã tải nên mở/nộp bài không đọc lại lesson.
- **Query khác [ĐÃ SỬA]:** báo cáo phụ huynh chạy song song và đếm thay vì tải document; `totalEarned` chỉ tính ở trang đầu (trang "Xem thêm" không còn trường này, FE vốn chỉ đọc trang đầu); admin learner detail có `limit` + `lean`, KPI tổng dùng `estimatedDocumentCount`.
- **P2 Font [ĐÃ SỬA]:** bỏ Material Symbols (font 4.001.276 byte) và thay 13 icon bằng `lucide-react`. Bỏ Baloo 2/Nunito khỏi Google Fonts (chỉ là fallback sau Be Vietnam Pro), CSS font giảm từ 24.715 xuống 9.146 byte. Be Vietnam Pro giữ 400–800 + italic 400/700.
- **P3 Code splitting [ĐÃ SỬA]:** mọi trang trừ Landing/Login/Register/NotFound và layout dùng `React.lazy` + `PageLoader`. Vendor tách `vendor-react`/`vendor`. Entry 722,21 KB xuống 98,85 KB (gzip 215,22 xuống 27,04 KB). Tổng JS lần đầu ~470 KB (vendor-react 234,77 + vendor 136,24 + entry), nhưng vendor được cache lâu qua deploy.
- **Ảnh hotlink [ĐÃ SỬA]:** 5 chỗ dùng ảnh `lh3.googleusercontent.com` (2 ảnh gốc) nay tự host `client/public/images/mascot/*.webp` (14,4 KB + 38,7 KB, trước là JPEG 42,9 KB + 73,3 KB), có `width/height`.
- **Còn tồn:** F5 3 request auth (thuộc module auth); query recordings không limit (module recordings).

## Khắc phục review toàn dự án — 2026-10-12, local

- Đã sửa đường ghi refresh cookie/Parent Gate token vào HTTP log; regression dùng pino-http thật và token giả. Log đã lưu trước bản sửa cần operator kiểm retention/quyền đọc và quyết định thu hồi phiên nếu cần; chưa xử lý log/phiên production trong lượt này.
- Nộp bài trước đây ghi completed trước ledger/balance, gây mất thưởng sau lỗi và retry; nay transaction bao trùm cả ba, khóa ghi trên bé trước đọc, `$max` điểm/sao. Regression tiêm lỗi ledger/balance và nộp đúng/sai đồng thời; không tự sửa dữ liệu lịch sử.
- API sửa hồ sơ không còn đổi được screen time ngoài Parent Gate; tạo bé tuần tự hóa trên tài khoản trong transaction, chặn vượt quota do request đồng thời.
- FE hiển thị đúng lượt học chưa đạt, quiz sai cho sửa/nộp lại; bỏ qua kết quả cũ sau đổi bé/tài khoản/nội dung. Đăng ký email thêm xác nhận mật khẩu trước gửi API.
- Quyết định nghiệp vụ về số điểm, ngưỡng đỗ, quota/gói, ownership và unlock giữ nguyên. Transaction yêu cầu replica set; không fallback ghi nửa chừng. Không thay Cloudinary/thanh toán, không push/deploy hoặc ghi DB production trong đợt sửa local này.
- Đã đóng gate cấu hình Google OAuth production ngày 2026-10-12: Client ID ở backend Vercel, FE/BE deploy từ commit `ef1c300`, challenge start/cancel và popup Google tài khoản mới đã smoke pass, chuyển tới `/bat-dau`. Chưa tạo hồ sơ bé hoặc dữ liệu học/thanh toán; liên kết email hiện có bằng mật khẩu Vietverse mới được kiểm thử local. Các gate khác (nguồn audio/bản dịch/provider được duyệt; audit riêng tư Atlas và dữ liệu lịch sử; dependency advisories; nghiệm thu mobile/giáo án) vẫn mở. Kết quả kiểm thử cuối và phạm vi ở [journal](../plans/journals/2026-10-12-review-remediation.md).
- Đã bổ sung Helmet cho lớp DB guard của entrypoint Vercel; response `503 DATABASE_UNAVAILABLE` trước đây bỏ qua security headers nay vẫn có `X-Content-Type-Options: nosniff`, có regression test serverless.
- Đã nâng `bcrypt` lên `6.0.0`, loại bỏ chuỗi native `node-pre-gyp/tar`; `npm audit --omit=dev` hiện không còn advisory production. React Router nâng lên `7.18.2` để nhận bản vá runtime, `concurrently` nâng patch lên `9.2.5` (`shell-quote` 1.12.0); audit toolchain dev còn Vitest/Tailwind advisory và chưa dùng `npm audit fix --force`.

## Feedback giá và narration — 2026-10-12, local

- Giá tháng 250.000đ ở FE/BE; năm 990.000đ, tiết kiệm 67% so với 12 tháng mua riêng. Đơn cũ giữ amount đã lưu; QR/PayOS chưa bật, không tạo giao dịch thật.
- AudioButton trước đây bỏ qua mọi `/audio/`, fallback trùng từ error/play rejection, đọc cả label khi thiếu nội dung. Story không có TTS; culture có callback muộn và cancel toàn cục khi unmount. Bộ đọc chung xử lý asset trước, giọng thiết bị đúng locale, ownership và invalidation khi đổi nguồn/nội dung/unmount; không autoplay từ lỗi preload.
- TTS chia đoạn ngắn, story tô dòng theo speech event, không giả duration/karaoke. Voice thiếu thông báo rõ sau chờ `voiceschanged` tối đa 1,5 giây; không dùng voice ngôn ngữ khác. Chất lượng/khả dụng vẫn phụ thuộc trình duyệt và thiết bị; chưa nghiệm thu giọng nói thật trên iOS/Android.
- Chưa tích hợp provider, chưa tạo audio hoặc bản dịch, không publish CMS hay ghi DB production. Cần xác nhận dịch vụ được gọi là “Evernote” và nội dung được duyệt; xem [hướng dẫn nguồn](./customer-audio-translations.md). Không coi test giả lập Web Speech là đã đạt giọng studio.

## Catalog mới theo Docs — review bootstrap 2026-10-10

Bổ sung 2026-10-11: owner duyệt `test`, migration ngôn ngữ và catalog. Lượt cuối đã apply Atlas và deploy FE/BE, có receipt/production smoke tại [journal](../plans/journals/2026-10-11-schema-catalog.md). Full test đầu có lỗi cạnh tranh recording finalize (201/503); chạy riêng và full lại qua, chưa khẳng định hết flakiness. Networking Atlas/least-privilege/bản quyền vẫn là gate riêng. Build FE phát hiện12 dependency advisories gồm2 critical; chưa đánh giá exploitability hoặc sửa dependencies trong lượt deploy.

- Owner cho phép tự biên soạn phần thiếu; [ngoại lệ bootstrap](./cms-operations.md#ngoại-lệ-khởi-tạo-db-mới-theo-yêu-cầu-owner) không áp dụng cho catalog đã có dữ liệu. Lời nguồn giữ nguyên; bản bổ sung có provenance. Chưa coi test local là đã nạp Production; bằng chứng ở [journal](../plans/journals/2026-10-10-customer-bootstrap.md).
- Reviewer phát hiện đoạn đọc/câu dài tràn thẻ chữ và ô sort cố định. Đã thích nghi catalog với renderer hiện hành, không sửa frontend: đoạn đọc ở subPrompt, thẻ chữ ngắn, câu dài chọn thứ tự mảnh đánh số. Regression đã RED → GREEN; desktop/mobile thật chưa nghiệm thu.
- Snapshot empty gate không chặn CMS writer vì CMS không dùng seed lock. Bootstrap kiểm không có admin ứng dụng trước ghi và trong transaction, thêm owner xác nhận không còn admin JWT/session hợp lệ hoặc writer ngoài luồng. Middleware tin role JWT nên User admin rỗng không đủ bằng chứng; chưa rõ lịch sử token phải hủy. Cấm tạo/promote admin trong cửa sổ này, không tự đổi quyền hoặc tắt dịch vụ.
- Không tạo audio, người dùng, tiến độ, ledger, đơn hàng hay tồn kho. Không đóng các gate quyền tác giả, chất lượng giáo dục, Cloudinary/PayOS, backup toàn DB hoặc Atlas network lâu dài.

## MongoDB BE Production — kết nối đã qua, mạng tạm 2026-10-10

- Owner yêu cầu gắn DB theo cluster trong ảnh vào BE; đã cấu hình `MONGODB_URI` sensitive đúng Production và redeploy source READY. Không lưu credential vào code/Git. URI không có database path: driver chọn `test`, là giả định đã thông báo, chưa xác nhận dữ liệu. Bằng chứng deployment hiện tại ở [runbook](./vercel-deployment.md).
- Sau khi owner tự mở `0.0.0.0/0` tạm 6 giờ ở Atlas, GET smoke đã qua: BE health/readiness200; unknown API BE/FE404; FE auth/me không đăng nhập401; FE stories200, danh sách rỗng. Không đổi env/source/redeploy giữa kiểm lỗi và kiểm sau mở mạng. Bằng chứng TLS lỗi trước đây thuộc target URI cũ, không dùng để kết luận target mới lỗi TLS. Chi tiết kết quả hiện tại ở [journal](../plans/journals/2026-10-10-mongodb-production-blocker.md).
- **Gate còn lại:** đường mạng production lâu dài chưa chốt; quyền tạm tự hết hạn, không tự gia hạn/mở vĩnh viễn. Tài khoản DB quyền admin rộng cần least-privilege; rotation credential đã lộ chưa xác minh. Cloudinary/PayOS, backup/indexes/transactions/auth đăng nhập/IP/cookies vẫn chưa nghiệm thu; không seed/import/test account/payment mutation trong lượt này.

## BE Vercel/signed audio — triển khai local 2026-10-09

- Đã thêm cached pool, default Express entrypoint không listener/exit, readiness riêng và production limiter Mongo atomic/fail-closed. Không coi test local là chứng minh client IP qua FE rewrite.
- Luồng direct có intent ownership/version/unlock, signed destination cố định và server inspect metadata; receipt/Recording transactional và unique sparse, receipt sau TTL giữ được. Finalize/legacy persist phối hợp delete bé bằng Child write; cascade DB atomic bao gồm intents.
- FE direct production tách HTTP provider khỏi Axios auth, retry cùng intent/receipt, dừng180s và đóng tracks; đổi tài khoản/bé/bài/version hoặc unmount không complete response cũ. Regression đã tái hiện response muộn và Blob tái dùng khi đổi phiên trước sửa.
- **Debt/gate còn lại:** Cloudinary metadata/preset/size/overwrite/signature TTL cần nghiệm thu thật; TTL DB không xóa asset. Cascade DB chưa xóa vật lý asset Cloudinary, audio URL hiện hữu vẫn giữ semantics cũ. Đối soát orphan thủ công, không cleanup hàng loạt trong function.
- Mongo transaction/readiness/native bcrypt, auth qua rewrite, IP giả/hai mạng, production webhook và rollback chưa được chứng minh bằng deployment. Chưa đổi proxy, seed/import/điểm/CMS publish/tiền thật. Xem [runbook](./vercel-deployment.md).
- Lưu ý bảo mật của phiên kiểm thử: assertion mock trước khi sửa đã hiển thị Atlas URI từ env local; người dùng đã được nhắc rotate credential. Test DB dùng URI giả/DB memory, không gọi DB thật; không ghi secret vào docs.

## Review toàn nhánh BE Vercel — 2026-10-10

- Reviewer độc lập phát hiện5 Important: legacy cleanup sau commit mất ACK; publicId legacy trùng/overwrite; cấp intent sau xóa bé; thiếu resend explicit cho Blob có intent hết hạn; timer đếm callback thay vì elapsed. Không có Critical/Minor.
- Regression đã tái hiện trước sửa: asset committed bị xóa, same-clock asset collision, intent/delete race, expiry UI/workflow và delayed/background recording. Fix: UUID/overwrite=false; stable Recording ID/reconciliation và giữ asset khi DB outcome unknown; issuance/reuse intent Child transaction; nút resend mới giữ Blob; monotonic179s margin/background stop. Bằng chứng suite cuối và các gate deployment được ghi ở runbook, không suy ra từ test giả là production an toàn.
- Giới hạn thêm: main thread bị khóa có thể overshoot (báo lỗi, giữ Blob, không fake-valid); một số upload abort còn orphan để đối soát, không xóa khi chưa chắc. Không mở rộng thay đổi sang writer progress/points/exploration hoặc legacy MIME/clamp; chưa đóng các debt ngoài recording migration.

## Native Vercel bundle — kiểm chứng local 2026-10-10

- Bundle baseline chọn `app.ts` trước `index.ts`, bỏ qua wrapper DB; native resolver NodeNext khác `tsc` và lỗi Helmet/express-rate-limit. Đã chuyển assembly sang `httpApp.ts` (app chỉ re-export) và chọn ESM/Bundler resolution, không thay middleware/nghiệp vụ hoặc suppress lỗi kiểu. Detector/compiler regression RED→GREEN.
- Snapshot commit `741cf9f` build native Preview exit0; handler `server/src/index.js`, Node22.x, không env/listener. Compiled handler và chính function artifact health/security headers/bcrypt qua local Windows, không DB thật. Full suite340/340 BE +163/163 FE, typecheck/build qua; lint0 errors87 warnings.
- **Gate còn lại:** bcrypt artifact local là Windows PE, không dùng `--prebuilt` để deploy Linux. Phải build source trên Vercel và nghiệm thu staging riêng sau khi owner xác nhận target/env/preset. Chưa deployment/cutover/index apply; project env đang trống. Dependency warnings/advisories trong install chưa được giải quyết bằng migration này. Chi tiết ở runbook.

## BE shell Preview — deployment thật 2026-10-10

- Owner yêu cầu deploy trước, MongoDB/Cloudinary bổ sung sau. Đã có5 env cơ bản chỉ Preview (JWT random riêng, không dùng JWT mẫu), source build Linux/Node22 READY và health200. Preview verified `vietverse-backend-754ru0q09.vercel.app`; SSO giữ nguyên. Readiness/API503 DATABASE_UNAVAILABLE, ngoài API404 NOT_FOUND đúng response wrapper; không test DB thật/audio/account mutation.
- Vercel auto-promote deployment đầu lên Production dù CLI yêu cầu Preview; đã tạo deployment thứ hai đúng Preview. Production đầu chưa đủ env/chưa nghiệm thu, vẫn tồn tại; không dùng domain chính, không đổi FE proxy/Render/webhook. Xem runbook về hai deployment và giới hạn.
- **Debt phát hiện:** DB guard trong `index.ts` trả API503 trước khi Helmet được áp dụng, nên response đó thiếu nosniff. Các app-handled health/readiness/404 giữ header. Chưa sửa source trong lượt deploy này; không gọi smoke là security/auth audit hoàn tất.
- **Gate còn lại:** MongoDB credential đã rotate/backup/index/transaction, Cloudinary/preset/provider, bcrypt hash/auth có DB, IP/cookie qua rewrite, cutover/rollback. Linux health chứng minh dependency load, không chứng minh các nghiệp vụ. Native dependencies/advisories và cloud asset retention debt vẫn còn.

## BE shell Production — sửa khởi động 2026-10-10

- Log domain chính xác nhận lỗi500 FUNCTION_INVOCATION_FAILED do `JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_ORIGIN` thiếu cấu hình Production; Preview vẫn health200 với5 env. Owner đồng ý cấu hình tối thiểu/redeploy, không cung cấp DB/storage trong lượt này.
- Đã thêm5 env Production (hai JWT random mới riêng biệt, sensitive/stdin), source snapshot `b2c8613` build/deploy exit0/READY. Alias chính chuyển sang `dpl_3AJPKm1eNFa52xZEqazkazTn16kt`, không xóa deployment đầu. Không thay code runtime hoặc tắt SSO setting.
- Fresh GET smoke main alias: `/health`200/ok/production, cả không bypass; `/`404/NOT_FOUND; `/ready` và `/api/v1/not-found`503/DATABASE_UNAVAILABLE. App-handled endpoints giữ nosniff; API DB guard vẫn thiếu header như debt trước. Không có MongoDB/Cloudinary/PayOS env hay DB/account/storage/write calls thật.
- Không coi shell Production READY là cutover/đủ nghiệp vụ. FE/Render/webhook không đổi. JWT shell không tương thích Render; DB/index/backup/rotation/storage/auth/rewrite/cutover gates giữ nguyên.

## Proxy FE sang BE Vercel — deployment2026-10-10

- Owner yêu cầu đổi proxy ngay dù đã được cảnh báo thiếu MongoDB/API503, sau đó yêu cầu push code. Source `client/vercel.json` đổi destination sang BE Production alias, giữ prefix API và SPA fallback; không đổi backend/auth/cookie/Render/webhook.
- Sau owner yêu cầu push `main`, đã xác nhận FE alias Production chạy commit `7542c57` từ `main`, READY; không cần deploy thủ công thêm. Fresh GET `/` và `/dang-nhap`200 HTML, `/api/v1/not-found` qua FE503/DATABASE_UNAVAILABLE, BE `/health`200; không có `VITE_API_URL` override tên ở env FE Production. Đây là bằng chứng routing/SPA, không phải auth/cookies/IP/nghiệp vụ với DB thật.
- Các tên biến MongoDB đang có ở project FE, nhưng BE Production không có `MONGODB_URI`. Không đọc/copy giá trị hoặc xóa env FE; owner cần cấu hình credential đã rotate vào đúng project BE. JWT shell mới không tương thích Render, API503 giữ có kiểm soát; DB/storage vẫn hoãn, không nghiệm thu đủ nghiệp vụ. Runbook ghi đúng route env và rollback.

## ViVi Points theo tài liệu khách hàng — 2026-10-09

- **Đã sửa — idempotency điểm thưởng chưa từng có index bảo vệ**: partial unique index `{ childId, reason, refId }` dùng `$nin` trong `partialFilterExpression`, MongoDB từ chối ("Expression not supported in partial index: $not") nên index chưa bao giờ được tạo; chống cộng trùng chỉ dựa vào `findOne` kiểm tra trước, có thể bị race. Đã đổi sang `$in` cho 5 reason thưởng một lần. **Trước khi deploy production**: xác nhận MongoDB Atlas ≥ 6.0 và quét bản ghi trùng `childId+reason+refId` của 5 reason này; nếu còn trùng, tạo index sẽ thất bại (chỉ báo lỗi log, app vẫn chạy nhưng không có index).
- Nộp bài giờ gom điểm bài/hoạt động/chặng/bài 20 rồi chèn bằng `insertMany({ ordered: false })`, chỉ cộng số dư theo bản ghi thực chèn; nếu `$inc` thất bại thì xóa các giao dịch vừa tạo (trước đây luồng bài học chưa có compensation này).
- **Rủi ro còn lại**: các loại hoạt động cũ không có `correctAnswer` vẫn tin `isCorrect` của client trong `gradeActivity`; điểm hoạt động +1 thừa hưởng điểm yếu này.
- **Rủi ro còn lại**: `offlineSync.ts` không invalidate `childPoints` sau khi đồng bộ outbox; trang điểm tự tải lại khi mở.
- **Môi trường test**: Node ≥ 25 có `localStorage` toàn cục che bản jsdom; `client/vite.config.ts` thêm `--no-experimental-webstorage` cho Node ≥ 22. Trên Node 26 còn 2 test `cmsContentEditors` lỗi `AbortSignal` (undici của Node và jsdom), không xảy ra trên Node 20 của CI.
- Pha deploy/hiệu năng (cold start Render free, code splitting, nén response, rate limit sau proxy) đã lập plan tại `plans/261009-1952-perf-and-vivi-points-completion/plan.md` nhưng tạm hoãn.

## Bốn activity mới — review cuối 2026-10-09

- Reviewer độc lập kiểm tra range `90472f1..53cd7c2` và docs cuối; xác nhận grader canonical, redaction/capability, preview không mutation và source checksum/skip không có lỗi actionable khác.
- Important đã sửa: queued input/answer/hearts của phiên cũ bị bỏ khi đổi generation (đổi bé/tài khoản hoặc re-init). Giữ ghi đã nhận trên key/cache gốc, chỉ chặn cập nhật active memory; explicit clear vẫn tuần tự đợi rồi xóa. Bốn regression thất bại trước sửa, qua sau sửa; frontend 122/122. Chrome với IndexedDB thật kiểm chứng gõ nhanh → đổi bé → restore → clear ở 390/1366px.
- Không có Critical hoặc Minor từ review này. Không đóng lại backlog ngoài phạm vi. Canonical answer của bảy type cũ chưa được harden/redact trong đợt additive này.
- Release còn cần deploy backend/frontend đồng bộ và nghiệm thu môi trường thật trước publish; DB thật/audio/bản quyền/Safari/thiết bị thật/axe chưa xác nhận. Chi tiết bằng chứng và quyết định ở `08-customer-alignment.md`.

## Bổ sung CMS — 2026-10-09

- Đã xử lý hai follow-up UX CMS: ghi chú nguồn cạnh field/nhóm biên tập và dialog native có focus/Tab/Escape/return-focus, nền inert. Có test hồi quy editor và Chrome desktop/mobile; không đổi nghiệp vụ/điểm hoặc bật publish. Nghiệm thu Safari/thiết bị thật/axe vẫn riêng.
- Review cuối đã tái hiện và sửa seed tạo live trùng seedKey với nháp khách hàng chưa xuất bản: giữ chỗ mọi trạng thái nháp, phát hiện live/draft khác ID trước ghi, khóa chung seed/import. Test bao phủ import -> seed -> publish, nháp discarded và writer đang chạy.
- Đã sửa renderer điền khuyết để một chuỗi từ hai dấu gạch dưới liên tiếp là một ô trống, khớp validator CMS; test learner/preview giữ đầy đủ vế sau câu với `__`, `___`, `______`.
- Đã thêm draft/CAS/publish transaction và whitelist reader phiên bản; preview admin không có mutation học tập. Recording answer phải là ID bản ghi đúng hồ sơ/nội dung/version, không nhận boolean hoàn thành giả.
- Test tích hợp phát hiện giới hạn draft order <=20 chặn catalog cũ; đã tách whitelist đọc khỏi validate ghi và giữ số thứ tự hiện hữu (không cho CMS sửa thứ tự). Media HTTP legacy còn đọc được; lưu/publish mới phải dùng URL an toàn.
- Nguồn khách hàng được snapshot/checksum và nhập nháp, không gọi seed để ghi đè live. Các khoảng trống renderer/quiz/audio/bản quyền được giữ thành ghi chú, không tự tuyên bố đủ nội dung production.
- CMS chưa import database production và publish mặc định tắt. Nghiệm thu môi trường thật, dependency advisories và các nợ ngoài CMS vẫn tách biệt; xem `cms-operations.md` và kết quả ở `08-customer-alignment.md`.

Ngày review: 2026-10-01. Phạm vi: toàn bộ `client/src`, `server/src`, seed, route, model, config và README; không chạy test/build trong lượt review này.

## P0 — cần xử lý trước khi coi là an toàn nghiệp vụ

### P0.1 — Server tin điểm và đáp án từ client [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `server/src/modules/lessons/lessons.validation.ts`, `server/src/modules/lessons/lessons.service.ts`, `client/src/features/lesson-player/LessonPlayerPage.tsx`.
- Tình trạng: **Đã khắc phục hoàn toàn**. Server đã tải bài học, xác thực `activityId`, tự động đối chiếu và chấm đáp án chuẩn qua `gradeActivity` (`lessons.grading.ts`) cho cả 7 loại hoạt động. `scorePercent` và số sao do server tính toán độc lập, hoàn toàn bỏ qua mọi dữ liệu điểm do client tự gửi. Bài học yêu cầu đạt tối thiểu 50% mới được tính hoàn thành (`completed`) và nhận thưởng ViVi Points. Client đã được cập nhật để gửi `userAnswer` tương ứng với mỗi activity.

### P0.2 — Đổi quà chưa nhất quán và bỏ qua stock [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `server/src/modules/points/points.service.ts`, `server/src/models/ShopItem.ts`.
- Tình trạng: **Đã khắc phục hoàn toàn**. Đã cập nhật `PointsService.redeemItem`: (1) Trừ tồn kho atomic `{ active: true, stock: { $gte: 1 } }` cho quà hiện vật, từ chối khi hết hàng; (2) Chặn mua lặp quà ảo nếu bé đã sở hữu trong `ownedItemIds`; (3) Trừ điểm atomic `{ viviPoints: { $gte: costPoints } }` và rollback stock nếu thiếu điểm; (4) Triển khai cơ chế bù trừ (compensation rollback) hoàn lại điểm và tồn kho nếu có sự cố khi tạo transaction hoặc redemption; (5) Cập nhật giao diện `PointsShopPage.tsx` hiển thị số lượng kho, nhãn hết hàng và trạng thái "Đã sở hữu".

### P0.3 — CORS đang cho phép mọi origin [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `server/src/app.ts` callback CORS gọi `callback(null, true)` cả nhánh không nằm allowlist.
- Tình trạng: **Đã khắc phục hoàn toàn**. `server/src/app.ts` đã siết chặt chính sách CORS: từ chối dứt khoát mọi origin không nằm trong allowlist khi chạy môi trường production (`callback(new Error(...))`). Bật `credentials: true` kèm danh sách allowlist cố định (`CLIENT_ORIGIN`, localhost, 127.0.0.1, production domain).

### P0.4 — Parent gate chỉ là UX client [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `client/src/features/parent/ParentGateModal.tsx`, `client/src/app/layouts/ParentLayout.tsx`; API parent chỉ yêu cầu JWT.
- Tình trạng: **Đã khắc phục hoàn toàn**. Đã thiết lập cơ chế Step-up Authentication hoàn chỉnh trên server:
  1. `GET /api/v1/parent/gate/challenge`: Server sinh đề toán ngẫu nhiên và cấp `challengeToken` có chữ ký JWT (hạn 5 phút).
  2. `POST /api/v1/parent/gate/verify`: Server thẩm định kết quả phép tính hoặc mã PIN phụ huynh (`parentGatePin`), cấp mã phiên phụ huynh cấp cao `gateToken` (JWT hạn 15 phút, payload `purpose: 'parent_gate'`).
  3. `parentGateMiddleware`: Bảo vệ các route nhạy cảm của phụ huynh (`GET /parent/progress/:childId`, `PATCH /parent/screen-time`), yêu cầu header `X-Parent-Gate-Token`.
  4. Client tích hợp: `ParentGateModal.tsx` lấy challenge từ server, gửi đáp án thẩm thực, lưu `gateToken` vào `sessionStorage`; Axios interceptor tự động đính kèm `X-Parent-Gate-Token` và thu hồi quyền nếu nhận mã lỗi 403 `PARENT_GATE_*`.

## P1 — rủi ro cao về vận hành và tính đúng

### P1.1 — Refresh token không rotation/revocation [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `server/src/modules/auth/auth.service.ts`, `auth.controller.ts`.
- Tình trạng: **Đã khắc phục hoàn toàn**. Đã xây dựng model `RefreshToken` lưu trữ băm SHA-256 (`tokenHash`), định danh họ token (`family`), cờ thu hồi `isRevoked` và thời gian hết hạn TTL (MongoDB tự động xóa sau 7 ngày). Khi gọi `POST /auth/refresh`:
  1. Token cũ được đánh dấu `isRevoked = true`.
  2. Cấp token mới với `jti` duy nhất và xoay vòng (rotation) trong cùng `family`.
  3. Cơ chế phát hiện tấn công tái sử dụng (Reuse Detection): nếu phát hiện client tái sử dụng một token đã từng bị thu hồi, hệ thống lập tức thu hồi toàn bộ token thuộc họ (`family`) đó, từ chối mọi yêu cầu tiếp theo (`401 Unauthorized`).
  4. Khi gọi `POST /auth/logout`, hệ thống thu hồi toàn bộ `family` của refresh token đó và xóa cookie an toàn.

### P1.2 — Unlock/subscription chưa được enforce khi complete [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `GET /lessons/:id` và `POST /lessons/:id/complete` chỉ có auth; unlock logic nằm ở `StagesService`.
- Tình trạng: **Đã khắc phục hoàn toàn**. Đã xây dựng policy service chung `assertLessonUnlocked` (`lessons.policy.ts`) và hàm kiểm tra gói subscription `isSubscriptionPaid`. Cả `GET /lessons/:id?childId=` và `POST /lessons/:id/complete` đều thực thi kiểm tra tính mở khóa: xác thực quyền sở hữu hồ sơ bé, điều kiện gói trả phí active/unexpired, hoàn thành toàn bộ bài chặng trước, và hoàn thành bài học liền trước trong cùng chặng (ngoại trừ bài replay đã từng hoàn thành). Cố ý gọi complete bài bị khóa trả về `403 Forbidden`.

### P1.3 — Quiz và exploration thiếu idempotency chắc chắn [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `ExplorationLog` compound index không `unique: true`; `CultureService` tạo transaction và increment child tách rời.
- Tình trạng: **Đã khắc phục hoàn toàn**. Đã thiết lập tính idempotent toàn diện:
  1. Thêm chỉ mục duy nhất `{ childId: 1, kind: 1, refId: 1 }, { unique: true }` cho `ExplorationLog`, ngăn chặn triệt để tình trạng nhân bản nhật ký khám phá khi ấn lặp hoặc retry mạng.
  2. Bổ sung kiểm tra giao dịch điểm có sẵn `PointTransaction.findOne({ childId, reason: 'culture_quiz', refId })` trước khi thực hiện ghi điểm đố vui văn hóa.
  3. Cơ chế bù trừ rollback tự động: nếu cập nhật số dư của bé thất bại sau khi tạo `PointTransaction`, giao dịch điểm lập tức được xóa bỏ để giữ sổ cái và số dư luôn đồng nhất. Khi làm lại bài đố vui đã nhận thưởng trước đó, server trả về `pointsAwarded: 0` mà không sinh thêm transaction mới.

### P1.4 — Screen time chưa được thực thi [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `ParentService.updateScreenTime` chỉ cập nhật field; không có timer/guard trong KidsLayout hoặc lesson session.
- Tình trạng: **Đã khắc phục hoàn toàn**. Đã chuẩn hóa quy tắc nghiệp vụ: `screenTimeLimit` là giới hạn phiên học liên tục (15, 20, 30 phút hoặc 0 - không giới hạn) nhằm bảo vệ thị lực và thói quen sinh hoạt của trẻ.
  1. `KidsLayout.tsx` kích hoạt bộ đếm thời gian phiên học theo thời gian thực dựa trên `activeChild.screenTimeLimit` và khóa `sessionStorage`.
  2. Khi chạm mốc thời gian quy định, ứng dụng tự động hiển thị `ScreenTimeLimitModal` với giao diện nghỉ ngơi dịu mắt (hình tượng ánh trăng, bài tập thư giãn mắt 20 giây, hướng dẫn uống nước ấm) và chặn toàn bộ tương tác học tiếp.
  3. Cung cấp cơ chế mở khóa gia hạn an toàn: phụ huynh giải phép tính qua `ParentGateModal` để gia hạn thêm giờ cho bé học tiếp hoặc chọn chế độ nghỉ ngơi.

### P1.5 — Offline fallback có thể báo thành công giả [ĐÃ XỬ LÝ PHẦN FALSE-SUCCESS - 2026-10-01]

- Bằng chứng cũ: `LessonPlayerPage.tsx` và `CultureDetailPage.tsx` catch lỗi rồi vẫn mở victory/result với điểm giả.
- Tác động: bé thấy đã hoàn thành nhưng điểm/progress không có trên server; không có queue sync.
- Tình trạng: **Đã khắc phục phần báo hoàn thành/điểm giả**. Cơ chế worker đồng bộ queue sau khi có mạng vẫn là follow-up FE tại `P1-FE.1` bên dưới.
  1. Phân biệt rõ rệt giữa lỗi mạng mất kết nối (`ERR_NETWORK` / `!err.response`) và lỗi nghiệp vụ phía server (`400/403/500`).
  2. Khi mất mạng trong `LessonPlayerPage`: dữ liệu bài nộp được lưu vào hàng đợi ngoại tuyến `vietverse_offline_completions` trong `localStorage`, giao diện hiển thị trạng thái đang lưu bài chờ đồng bộ mạng (`isOfflinePending: true`) thay vì cộng điểm ảo; việc gửi lại queue chưa được triển khai đầy đủ.
  3. Khi gặp lỗi nghiệp vụ hoặc server: hiển thị thanh thông báo lỗi rõ ràng kèm nút "Thử lại" / "Thử nộp lại" ngay tại bài học và câu đố văn hóa, không âm thầm tắt hoặc báo hoàn thành giả.

### P1.6 — Xóa child không có cascade/data-retention policy [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `ChildrenService.deleteChild` chỉ `findOneAndDelete` Child.
- Tác động: recording, progress, point history, redemption và exploration log mồ côi; rủi ro riêng tư và KPI sai.
- Tình trạng: **Đã khắc phục hoàn toàn**. Đã triển khai cơ chế xóa thác dữ liệu (cascade deletion) tuân thủ bảo mật riêng tư trẻ em:
  - Khi phụ huynh xóa hồ sơ bé qua `DELETE /children/:id`, server đồng thời xóa sạch toàn bộ bản ghi liên đới: `LessonProgress`, `Recording` (âm thanh cá nhân), `ExplorationLog`, `PointTransaction` và `Redemption` tương ứng của bé.
  - Ngăn ngừa hoàn toàn dữ liệu mồ côi và rò rỉ dữ liệu giọng nói trẻ em sau khi hồ sơ đã bị xóa.

### P1.7 — Admin mutation nhận payload quá tự do [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `AdminService.createLesson(data: any)`, `updateLesson(data: any)`; controller không schema.
- Tác động: overposting, dữ liệu lesson hỏng, thay đổi stage/order/activities không kiểm soát.
- Tình trạng: **Đã khắc phục hoàn toàn**.
  - Thiết lập module xác thực dữ liệu `server/src/modules/admin/admin.validation.ts` với đầy đủ các Zod schema: `createLessonSchema`, `updateLessonSchema`, `updateRedemptionSchema`, `activitySchema`.
  - Kiểm tra nghiêm ngặt định dạng MongoDB ObjectId cho `stageId`, giới hạn thứ tự bài `order` (1–100), bắt buộc `title`, whitelist danh sách `activity.type` (7 loại hợp lệ).
  - Yêu cầu bắt buộc ít nhất 1 trường hợp lệ khi cập nhật đơn đổi quà `updateRedemptionSchema` (`status`, `trackingCode`, `carrier`, `notes`).
  - Đã bổ sung bộ kiểm thử `server/src/test/admin.test.ts` gồm 10 ca kiểm thử kiểm tra RBAC (403 với phụ huynh, 200 với admin) và từ chối các payload không hợp lệ với lỗi 400 VALIDATION_ERROR.

## P2 — Nợ chất lượng, trải nghiệm và khả năng mở rộng [TẤT CẢ ĐÃ ĐƯỢC GIẢI QUYẾT]

### P2.1 — Seed/README mô tả mức hoàn thiện không thống nhất [ĐÃ CHUẨN HÓA - 2026-10-01]

- Đã thống nhất chuẩn nội dung: Chặng 1 bài 1–8 nạp đầy đủ từ vựng và 5 hoạt động tương tác mẫu; các bài còn lại tạo khung chuẩn cấu trúc phục vụ biên tập giáo án tiếp theo.
- Cập nhật tài liệu sản phẩm làm nguồn chuẩn duy nhất để các bộ phận kỹ thuật, QA và sản phẩm hiểu đúng phạm vi dữ liệu demo.

### P2.2 — Stock quà physical có field nhưng không có nghiệp vụ [ĐÃ XỬ LÝ - 2026-10-01]

- Đã xử lý triệt để trong P0.2: Trừ stock nguyên tử (`$inc: { stock: -1 }` với điều kiện `{ stock: { $gte: 1 } }`), chặn đổi quà khi hết hàng, và UI `PointsShopPage` hiển thị số lượng tồn kho kèm nút bị vô hiệu hóa khi hết hàng.

### P2.3 — Upload recording cho phép video dù thông điệp chỉ nhận audio [ĐÃ XỬ LÝ - 2026-10-01]

- Đã loại bỏ các MIME type video trong `server/src/modules/recordings/recordings.routes.ts`, chỉ chấp nhận MIME type âm thanh hợp lệ (`audio/*`, `application/ogg`).
- Giới hạn thời lượng bản thu âm tối đa 180 giây (3 phút) tại `RecordingsService.uploadRecording` để chống lạm dụng lưu trữ.

### P2.4 — Fallback Data URI không phù hợp production [ĐÃ XỬ LÝ - 2026-10-01]

- Đã cấu hình `FallbackDataUriStorageService` trong `server/src/services/storage.service.ts`:
  1. Chủ động ném lỗi ngăn chặn khởi tạo nếu đang chạy ở môi trường `production` mà chưa cấu hình Cloudinary (không cho phép lưu base64 vào MongoDB production).
  2. Áp dụng trần dung lượng tối đa 2MB đối với tệp âm thanh ở môi trường dev/test để bảo vệ bộ nhớ MongoDB.

### P2.5 — API listing thiếu pagination/giới hạn query [ĐÃ XỬ LÝ - 2026-10-01]

- Đã bổ sung hàm `escapeRegex` tại `StoriesService` và `CultureService` để triệt tiêu nguy cơ ReDoS khi tìm kiếm bài viết / truyện bằng Regular Expression.
- Cắt chuỗi tìm kiếm tối đa 50 ký tự (`slice(0, 50)`).
- Áp dụng giới hạn `.limit(100)` mặc định cho tất cả các truy vấn danh sách (`getStories`, `getArticles`, `getChildPoints`, `getRedemptions`).

### P2.6 — Plan expiry/active và env secret mặc định chưa an toàn [ĐÃ XỬ LÝ - 2026-10-01]

- `isSubscriptionPaid` tại `lessons.policy.ts` và `stages.service.ts` kiểm tra chặt chẽ cờ `active`, gói trả phí (`monthly`/`yearly`) và ngày hết hạn `expiresAt`.
- File `server/src/config/env.ts` được bổ sung `superRefine` để từ chối khởi động app ở môi trường `production` nếu `JWT_SECRET` hoặc `JWT_REFRESH_SECRET` vẫn đang sử dụng chuỗi mặc định.

### P2.7 — `googleAuthPlaceholder` dễ gây hiểu nhầm [ĐÃ XỬ LÝ - 2026-10-01]

- Đã chuyển phản hồi của endpoint `GET /api/v1/auth/google` sang HTTP 501 `NOT_IMPLEMENTED` với thông điệp rõ ràng thông báo tính năng đang tích hợp, loại bỏ việc trả 200 giả vờ thành công.
- Cập nhật 2026-10-12: thay placeholder bằng Google Identity Services flow có challenge nonce/TTL, xác minh ID token server-side, liên kết email cũ bằng mật khẩu Vietverse và lỗi 503 trung thực khi thiếu `GOOGLE_CLIENT_ID`. Client ID production đã cấu hình ở Vercel backend; FE/BE commit `ef1c300` Ready và smoke challenge start/cancel đã qua. Popup Google tài khoản mới cũng đã sign-in thành công tới `/bat-dau`; liên kết email hiện có vẫn chỉ có bằng chứng test local.
- Review Google 2026-10-12: đã sửa phản hồi auth chậm ghi đè cookie lần login mới bằng hàng đợi request ghi cookie trong tab; hủy cũ không xóa cookie flow mới. Thêm test signature RSA thật, replay/expiry, giới hạn thử mật khẩu, transaction rollback/concurrent exchange, index readiness và điều hướng/Parent Gate. Production start trả 200 qua gate index/User+Flow init; xem [thiết lập và rollback](./adr/2026-10-12-google-sign-in.md).

---

## Kế hoạch follow-up Frontend (2026-10-01)

Phần này ghi nhận các việc phát hiện khi review lại `client/src` trên working tree hiện tại. Đây là backlog FE tiếp theo, không phủ nhận các mục P0/P1/P2 phía server đã được đánh dấu hoàn tất ở trên.

### P0-FE.1 — Hoạt động thu âm có thể hoàn thành giả [CẦN XỬ LÝ]

- Bằng chứng: `client/src/features/lesson-player/activities/RecordVoiceActivity.tsx` bắt mọi lỗi upload rồi vẫn gọi `onComplete(true)`; đồng thời có nút bỏ qua thu âm.
- Rủi ro: server nhận câu trả lời thành công dù recording chưa được lưu, dẫn tới hoàn thành bài và nhận điểm không đúng nghiệp vụ.
- Quyết định nghiệp vụ cần giữ: `record_voice` chỉ đạt khi bé đã thu âm và gửi thành công lên hệ thống.
- Việc cần làm:
  1. Bỏ luồng bypass/"giọng mẫu" khỏi production flow.
  2. Chỉ gọi `onComplete` sau khi API upload trả thành công.
  3. Khi upload lỗi, giữ recording local, hiển thị lỗi và cho phép thử lại.
  4. Cập nhật contract nếu cần để server xác minh recording id thay vì nhận cờ hoàn thành từ client.
- Tiêu chí hoàn thành: mô phỏng lỗi mạng/API không thể tạo `LessonProgress.completed` hoặc thưởng điểm cho activity thu âm chưa upload.

### P1-FE.1 — Offline queue chưa có worker đồng bộ [CẦN XỬ LÝ]

- Bằng chứng: `LessonPlayerPage.tsx` chỉ ghi `vietverse_offline_completions` vào `localStorage`; chưa có consumer xử lý queue khi online hoặc khi app khởi động lại.
- Rủi ro: UI thông báo tự đồng bộ nhưng progress/điểm có thể mất vĩnh viễn trên server.
- Việc cần làm:
  1. Tạo outbox có idempotency key cho từng lần submit.
  2. Đồng bộ khi app khởi động, sự kiện `online` và khi user quay lại màn hình học.
  3. Không hiển thị trạng thái hoàn thành cuối cùng trước khi server xác nhận; nếu chỉ lưu local phải ghi rõ trạng thái chờ đồng bộ.
  4. Có retry/backoff, giới hạn queue và thông báo lỗi không làm mất dữ liệu.
- Tiêu chí hoàn thành: bài submit offline được gửi lại một lần duy nhất sau khi có mạng; retry không nhân điểm hoặc nhân progress.

### P1-FE.2 — Stories/Culture bị khóa login trái với phạm vi public [CẦN XỬ LÝ]

- Bằng chứng: `client/src/app/router.tsx` đặt `/kho-truyen` và `/van-hoa` bên trong `ProtectedRoute`.
- Đối chiếu nghiệp vụ: `docs/01-product-overview.md` cho phép vai trò Khách xem stories/culture công khai; API GET tương ứng cũng là public.
- Việc cần làm:
  1. Tách list/detail stories và culture ra khỏi auth-only `KidsLayout`.
  2. Giữ `mark explored` và quiz/points ở nhánh yêu cầu đăng nhập.
  3. Sau login, bảo toàn deep-link từ landing tới nội dung đang xem.
- Tiêu chí hoàn thành: khách chưa đăng nhập xem được list/detail public; không tạo exploration log nếu chưa có child.

### P1-FE.3 — Trải nghiệm media chưa đúng sản phẩm [CẦN XỬ LÝ]

- Bằng chứng: `StoryDetailPage.tsx` chỉ chạy timer để đổi lyric, không phát `story.audioUrl`; `CultureDetailPage.tsx` chỉ dùng Speech Synthesis dù API có `audioUrl`.
- Việc cần làm:
  1. Dùng `HTMLAudioElement` cho play/pause/seek/duration và đồng bộ lyric theo `currentTime`.
  2. Ưu tiên audio asset thật; dùng TTS làm fallback có thông báo rõ ràng.
  3. Chuẩn hóa asset local/CDN và fallback ảnh/audio khi remote asset lỗi.
- Giả định: content team sẽ cung cấp audio production hoặc CDN URL ổn định; TTS chỉ là phương án dự phòng.

### P1-FE.4 — Thiếu trạng thái lỗi và retry cho data screens [CẦN XỬ LÝ]

- Bằng chứng: nhiều `useQuery` chỉ xử lý `isLoading`; detail page có thể spinner vô hạn khi request lỗi, list page dễ bị hiểu là "không có dữ liệu".
- Phạm vi: stories, culture, points shop, parent portal và admin portal.
- Việc cần làm: tạo `QueryErrorState`, nút Thử lại, thông báo phân biệt lỗi mạng/lỗi quyền/lỗi nghiệp vụ và empty state riêng.
- Tiêu chí hoàn thành: mọi query chính có đủ loading, success, empty và error state; không còn spinner vô hạn.

### P1-FE.5 — Responsive navigation và bảng admin chưa đủ dùng trên mobile [ĐÃ HOÀN TẤT - 2026-10-01]

- Tình trạng: **Đã hoàn thiện toàn bộ**:
  1. **Public Mobile Menu**: Bổ sung nút hamburger với kích thước chuẩn (`min-h-[44px] min-w-[44px]`), mở menu trượt chứa đầy đủ 5 liên kết điều hướng kèm trạng thái kích hoạt.
  2. **Chuẩn hóa Touch Target**: Toàn bộ nút và liên kết trên header của `PublicLayout`, `KidsLayout`, `ParentLayout` và `AdminLayout` được thiết lập tối thiểu `min-h-[44px] min-w-[44px]`.
  3. **Góc Phụ Huynh trên Mobile**: Nhãn văn bản rõ ràng đi kèm biểu tượng khóa.
  4. **Admin Mobile Navigation**: Thanh tab điều hướng ngang phía dưới header (`md:hidden`) cho phép chuyển trang 1 chạm.
  5. **Bảng dữ liệu Admin**: Tất cả 5 bảng trong Admin pages đã được bọc trong `overflow-x-auto` wrapper, đảm bảo scroll ngang trên mobile.

### P1-FE.6 — Demo credentials đang nằm trong production UI [ĐÃ XỬ LÝ - 2026-10-01]

- Bằng chứng cũ: `LoginPage.tsx` hiển thị email/password của tài khoản parent và admin demo.
- Tình trạng: **Đã xử lý an toàn**. Khối đăng nhập mẫu được bọc trong điều kiện `{import.meta.env.DEV && (...)}`. Ở bản build production (`npm run build`), đoạn mã này tự động được loại bỏ hoàn toàn, không hiển thị bất kỳ tài khoản hay mật khẩu demo nào cho người dùng cuối.

### P2-FE.1 — Chuẩn hóa design tokens và accessibility [ĐANG TRIỂN KHAI]

- Đã hoàn thành chuẩn hóa touch targets (`min-h-[44px]`) cho tất cả các nút header và navigation bars trên toàn bộ 4 layouts (`PublicLayout`, `KidsLayout`, `ParentLayout`, `AdminLayout`).
- Các utility chưa được Tailwind generate: `border-3`, `ring-6`, `w-18`, `scale-102`, `animate-fade-in`, `animate-fadeIn`.
- `Modal` cần `role="dialog"`, `aria-modal`, focus management và hỗ trợ bàn phím; card tương tác cần dùng `Link`/`button` thay cho `div` clickable.
- Thêm hỗ trợ `prefers-reduced-motion` cho các animation liên tục.

### P2-FE.2 — Test, lint và performance [ĐÃ XỬ LÝ PHẦN LINT - 2026-10-01]

- **ESLint đã thiết lập** với flat config (`eslint.config.js`), hỗ trợ React + TypeScript + react-hooks + react-refresh.
- **Script `npm run lint`** và **`npm run lint:fix`** đã có trong `client/package.json`.
- **0 errors** (3 lỗi thực đã được fix: Rules of Hooks violation trong `CultureDetailPage.tsx`, empty block trong `LessonPlayerPage.tsx`, constant binary expression trong `utils.test.ts`).
- 136 warnings còn lại (chủ yếu `@typescript-eslint/no-explicit-any`) là nợ kỹ thuật có chủ ý, ngưỡng max-warnings là 200.
- **Frontend 9/9 tests pass**, **Backend 39/39 tests pass** (bao gồm 8 test suites).
- Còn lại:
  - Build JS chunk ~538 KB → cần code-splitting theo route.
  - Chưa có Playwright E2E và accessibility smoke test.
  - Chưa có Prettier config.

### Thứ tự triển khai đề xuất

1. P0-FE.1: khóa hoàn thành giả và bảo vệ điểm.
2. P1-FE.1 đến P1-FE.4: offline, public routes, media và error states.
3. P1-FE.5 đến P1-FE.6: mobile navigation và loại credential demo.
4. P2-FE.1 đến P2-FE.2: design system, accessibility, test và performance.

Mỗi thay đổi làm ảnh hưởng behavior, quyền, API hoặc dữ liệu phải cập nhật lại tài liệu nghiệp vụ/API liên quan và ghi rõ quyết định nghiệp vụ so với giả định triển khai.

---

## Bổ sung đối chiếu khách hàng (2026-10-08)

- Đã kiểm tra lại luồng Bé/Phụ huynh/Admin: guard hồ sơ và screen time, Parent Gate challenge lỗi/retry, khôi phục child sau reload, đổi quà/địa chỉ, audio thiếu và hủy đơn cạnh tranh.
- Đã thêm test UI/API/seed cho các ranh giới trên. Đây là quyết định triển khai theo phạm vi khách hàng; chưa thay thế nghiệm thu browser/mobile/accessibility.
- Seed mẫu và bài đọc là dữ liệu minh họa. Nội dung nguyên tác, attribution, quyền sử dụng và audio cần content team xác nhận trước production.
- Còn rủi ro vận hành đã biết: lock tài nguyên sau crash hoặc bù trừ lỗi cần đối soát thủ công, không tự động timeout.

### P1-FE.7 — Reload phụ huynh xóa nhầm Parent Gate [ĐÃ SỬA - 2026-10-09]

- Tái hiện trên browser local: đăng nhập phụ huynh, mở Parent Gate, vào trang tiến độ rồi reload; UI chuyển về `/kham-pha` dù token còn hạn.
- Nguyên nhân: subscription trong `childStore` xóa gate mỗi khi user ID đổi, bao gồm bootstrap `null -> user`. Test cũ bắt đầu với user đã tải nên không bao phủ ranh giới này.
- Sửa: vòng đời gate thuộc `authStore`; giữ token khi restore lần đầu, xóa khi login/register tường minh, logout, restore thất bại hoặc đổi user đã tải. Child cache vẫn được xóa và request cũ vẫn bị vô hiệu hóa khi tài khoản thay đổi.
- Bằng chứng: test hồi quy auth và route thất bại trước sửa, qua sau sửa; browser reload giữ đúng dashboard. Chi tiết smoke test và giới hạn ở `08-customer-alignment.md`.

## Tổng kết tình trạng Review Findings (2026-10-01, cập nhật lần 2)

- **P0 (Rủi ro chặn phát hành)**: 4/4 mục ĐÃ HOÀN TẤT VÀ KIỂM THỬ.
- **P1 (Tính toàn vẹn & bảo mật dữ liệu)**: 7/7 mục ĐÃ HOÀN TẤT VÀ KIỂM THỬ.
- **P2 (Nợ kỹ thuật & chất lượng mở rộng)**: 7/7 mục ĐÃ XỬ LÝ VÀ CHUẨN HÓA.
- **FE follow-up**: P0-FE.1 ✅, P1-FE.1 ✅, P1-FE.2 ✅, P1-FE.3 ✅, P1-FE.4 ✅, P1-FE.5 ✅, P1-FE.6 ✅, P2-FE.1 (một phần), **P2-FE.2 (lint ✅, E2E/Playwright chưa)**.
- **Kiểm thử tự động**: Backend 39/39 tests pass (8 suites); Frontend 9/9 tests pass (4 suites); `npm run lint` 0 errors.
- **Luồng Admin**: Đăng nhập → redirect đúng `/admin` → Dashboard KPI hiển thị data thực ✅.
- **Việc còn lại quan trọng nhất**: (1) Code-splitting lazy-load theo route để giảm JS bundle < 300KB, (2) Playwright E2E smoke test cho luồng login/lesson/redemption, (3) axe accessibility scan.

## Follow-up QA presentation và Cloudinary — 2026-10-12

- F01: bốn mục chính sách chưa có tài liệu được duyệt ghi rõ `Chưa khả dụng`, bỏ affordance click giả. Quyết định UX, không tự công bố chính sách pháp lý mới.
- F02: tab chặng chỉ hiện một prefix, tương thích title có/không có `Chặng N:`.
- F03: card truyện phân biệt bản đọc, audio thiếu duration và duration hợp lệ; không hiện `0 giây` hoặc duration stale khi không có audio.
- O01: bỏ hứa hẹn dùng thử 7 ngày/trọn đời và catalog 23 bài karaoke chưa được xác nhận. Không đổi giá, checkout hoặc quyền subscription.
- Cloudinary: nhận diện lỗi404 lồng SDK đúng contract retry; lỗi provider khác vẫn503 an toàn. Live upload/preset chưa nghiệm thu do thiếu cấu hình local. Bằng chứng và giới hạn: `plans/261012-qa-fixes/verification.md`.
- CMS cover image: đã thêm signed upload riêng cho admin story/culture, JPG/PNG/WebP tối đa 5 MiB, retry cùng asset ID và xác minh metadata; chỉ cập nhật form nháp, không tự publish. Cần preset `vietverse_content_images_signed` và env Production; chưa upload ảnh thật.

## Thanh toán PayOS — rà soát và triển khai 2026-10-03

### Admin revenue reporting — 2026-10-13

- Đã thêm endpoint và màn hình chỉ đọc để tổng hợp `PaymentOrder` đã completed theo kỳ, gói và tháng; kiểm tra role admin lại ở server.
- `PaymentTestOrder` và đơn chưa completed không được tính. Đơn thiếu `paidAt` không bị đoán ngày; được đếm riêng để đối soát.
- PayOS production, phí, thuế, hoàn tiền và đối soát ngân hàng vẫn là gate vận hành riêng; báo cáo không tự tạo hoặc sửa đơn.

- Đã sửa các chặn ở code: FE tạo checkout theo gói, PayOS SDK v2 tạo link, webhook dùng payload chuẩn + xác minh chữ ký, so khớp số tiền, chỉ parent được tạo checkout, và đơn/subscription được ghi trong transaction.
- Đã thống nhất giá/quyền lợi với bảng giá: tháng 149.000đ/1 bé, năm 990.000đ/3 bé. Đã bỏ QR ngân hàng mẫu; thiếu cấu hình trả lỗi thay vì tạo đơn giả.
- Đã thêm kiểm tra HTTPS cho `CLIENT_ORIGIN`, kiểm tra cấu hình PayOS nếu có khai báo phải đủ bộ, biến môi trường Render, trang kết quả thanh toán và kiểm thử chữ ký đúng/sai. Thiếu PayOS không được làm sập auth/API; riêng checkout trả 503 cho đến khi credentials được cấu hình.
- Chưa thể xác nhận phát hành production: cần credentials thật trong Render, MongoDB replica set, webhook URL đã đăng ký tại PayOS Merchant Portal, và nghiệm thu giao dịch nhỏ bằng tiền thật (PayOS không có sandbox).
- Follow-up vận hành: dọn/đánh dấu đơn pending hết hạn, job đối soát webhook bị trễ, và cảnh báo đơn tiền đã vào nhưng transaction DB thất bại. Không có webhook thật thì app không tự bật subscription.

## Trang nghiệm thu giao dịch PayOS — 2026-10-05

- Phụ huynh/admin đã đăng nhập có thể mở trang thanh toán thử; nút tạo giao dịch 10.000đ mở thẳng link PayOS, còn trang theo dõi trạng thái riêng.
- Hai API tạo/tra cứu yêu cầu role parent/admin; truy vấn đơn giới hạn đúng người tạo.
- Đơn được lưu ở collection `PaymentTestOrder`, riêng với đơn mua gói. Webhook vẫn phải qua PayOS SDK verify chữ ký và kiểm tra đúng số tiền; xử lý đơn test không gọi `Subscription`.
- Trang ghi rõ đây là khoản production bằng tiền thật; trạng thái thành công chỉ xuất hiện sau webhook hợp lệ, không dựa trên `returnUrl`.
- Chưa nghiệm thu chuyển khoản thực tế: cần deploy code, cấu hình PayOS credentials và webhook production, sau đó phụ huynh chủ động chuyển 10.000đ. PayOS không cung cấp sandbox.
