# 06 — Kết quả review senior BA/code

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

## Thanh toán PayOS — rà soát và triển khai 2026-10-03

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
