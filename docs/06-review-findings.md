# 06 — Kết quả review senior BA/code

Ngày review: 2026-10-01. Phạm vi: toàn bộ `client/src`, `server/src`, seed, route, model, config và README; không chạy test/build trong lượt review này.

## P0 — cần xử lý trước khi coi là an toàn nghiệp vụ

### P0.1 — Server tin điểm và đáp án từ client

- Bằng chứng: `server/src/modules/lessons/lessons.validation.ts`, `server/src/modules/lessons/lessons.service.ts`, `client/src/features/lesson-player/LessonPlayerPage.tsx`.
- Client gửi `scorePercent` và `answers`; service dùng score để tính sao và ghi completed nhưng không tự đối chiếu activity/correctAnswer.
- Tác động: request thủ công có thể hoàn thành bài, nhận sao và +10/+20/+50 mà không học hoặc không mở khóa.
- Hướng xử lý: server load lesson, validate activity IDs, chấm từ đáp án chuẩn; kiểm tra stage/plan/lesson sequence trước khi ghi progress.

### P0.2 — Đổi quà chưa nhất quán và bỏ qua stock

- Bằng chứng: `server/src/modules/points/points.service.ts`, `server/src/models/ShopItem.ts`.
- Service trừ điểm trước, sau đó tạo transaction và redemption bằng các thao tác độc lập; `stock` không được decrement/kiểm tra.
- Tác động: lỗi giữa chừng có thể mất điểm không có đơn; hai request đồng thời có thể bán vượt tồn.
- Hướng xử lý: MongoDB session transaction hoặc outbox/compensation; atomic decrement `{ active: true, stock: { $gte: 1 } }` cho physical; chốt chính sách mua lặp.

### P0.3 — CORS đang cho phép mọi origin

- Bằng chứng: `server/src/app.ts` callback CORS gọi `callback(null, true)` cả nhánh không nằm allowlist.
- Tác động: credentialed browser request từ origin lạ được chấp nhận; tăng nguy cơ CSRF/cross-site abuse.
- Hướng xử lý: production deny origin lạ, allowlist rõ; thêm CSRF strategy nếu dùng cookie credential.

### P0.4 — Parent gate chỉ là UX client

- Bằng chứng: `client/src/features/parent/ParentGateModal.tsx`, `client/src/app/layouts/ParentLayout.tsx`; API parent chỉ yêu cầu JWT.
- Tác động: ai có access token đều gọi trực tiếp parent API; sessionStorage không bảo vệ dữ liệu.
- Hướng xử lý: coi gate là UX; nếu cần kiểm soát thật, tạo server-side parent session/step-up auth và bắt buộc ở API nhạy cảm.

## P1 — rủi ro cao về vận hành và tính đúng

### P1.1 — Refresh token không rotation/revocation

- Bằng chứng: `server/src/modules/auth/auth.service.ts`, `auth.controller.ts`.
- Refresh JWT 7 ngày không lưu phiên/token family; logout chỉ clear cookie nên token bị lộ vẫn replay được.
- Hướng xử lý: lưu refresh session hash, rotation mỗi lần refresh, revoke khi logout/đổi mật khẩu.

### P1.2 — Unlock/subscription chưa được enforce khi complete

- Bằng chứng: `GET /lessons/:id` và `POST /lessons/:id/complete` chỉ có auth; unlock logic nằm ở `StagesService`.
- Tác động: gọi trực tiếp lesson ID bất kỳ để complete, kể cả bài/chặng chưa đủ điều kiện.
- Hướng xử lý: dùng một policy service chung cho read/start/complete; kiểm tra plan active, expiry, previous lesson.

### P1.3 — Quiz và exploration thiếu idempotency chắc chắn

- Bằng chứng: `ExplorationLog` compound index không `unique: true`; `CultureService` tạo transaction và increment child tách rời.
- Tác động: retry/concurrency có thể nhân bản log hoặc làm sổ cái và số dư lệch khi có lỗi giữa các bước.
- Hướng xử lý: unique index đúng mục tiêu, transaction, và test concurrency.

### P1.4 — Screen time chưa được thực thi

- Bằng chứng: `ParentService.updateScreenTime` chỉ cập nhật field; không có timer/guard trong KidsLayout hoặc lesson session.
- Tác động: phụ huynh tưởng đã giới hạn nhưng bé vẫn học không giới hạn.
- Hướng xử lý: định nghĩa rõ “mỗi phiên” hay “mỗi ngày”, server cấp session expiry, client hiển thị cảnh báo và chặn hành động.

### P1.5 — Offline fallback có thể báo thành công giả

- Bằng chứng: `LessonPlayerPage.tsx` và `CultureDetailPage.tsx` catch lỗi rồi vẫn mở victory/result.
- Tác động: bé thấy đã hoàn thành nhưng điểm/progress không có trên server; không có queue sync.
- Hướng xử lý: phân biệt `saved`, `pending sync`, `failed`; chỉ hiển thị điểm server xác nhận.

### P1.6 — Xóa child không có cascade/data-retention policy

- Bằng chứng: `ChildrenService.deleteChild` chỉ `findOneAndDelete` Child.
- Tác động: recording, progress, point history, redemption và exploration log mồ côi; rủi ro riêng tư và KPI sai.
- Hướng xử lý: soft delete + ẩn dữ liệu, hoặc transaction cascade có retention/audit rõ.

### P1.7 — Admin mutation nhận payload quá tự do

- Bằng chứng: `AdminService.createLesson(data: any)`, `updateLesson(data: any)`; controller không schema.
- Tác động: overposting, dữ liệu lesson hỏng, thay đổi stage/order/activities không kiểm soát.
- Hướng xử lý: Zod schema theo create/update, whitelist field, validate stage/order/activity type, audit log.

## P2 — nợ chất lượng, trải nghiệm và khả năng mở rộng

### P2.1 — Seed/README mô tả mức hoàn thiện không thống nhất

- `README.md` nói bài 1–4 đầy đủ; seed log bài 1–8 đầy đủ và bài 9–20 khung.
- Cần một nguồn chuẩn để sales, QA và product không hứa sai phạm vi nội dung.

### P2.2 — Stock quà physical có field nhưng không có nghiệp vụ

- `ShopItem.stock` và seed stock tồn tại nhưng không có decrement hoặc out-of-stock UX.

### P2.3 — Upload recording cho phép video dù thông điệp chỉ nhận audio

- `recordings.routes.ts` chấp nhận `video/mp4` và `video/webm`; cần chốt media policy, duration/quota và retention.

### P2.4 — Fallback Data URI không phù hợp production

- `storage.service.ts` lưu base64 vào MongoDB khi thiếu Cloudinary; cần giới hạn môi trường và dung lượng.

### P2.5 — API listing thiếu pagination/giới hạn query

- Stories, culture, points history và admin learners/redemptions trả danh sách trực tiếp; search dùng regex không có max length/page.
- Tác động: response phình, query chậm và khó vận hành khi dữ liệu tăng.

### P2.6 — Plan expiry/active và env secret mặc định chưa an toàn

- `StagesService` chỉ nhìn plan; `config/env.ts` có default JWT secret đủ để app khởi động.
- Production cần reject default secret và kiểm tra subscription active/expiry.

### P2.7 — `googleAuthPlaceholder` dễ gây hiểu nhầm

- Endpoint trả success message như đã sẵn sàng dù chưa có OAuth flow.
- Nên gắn rõ feature flag/404 hoặc tài liệu trạng thái chưa phát hành.

## Ưu tiên thực hiện đề xuất

1. P0.1, P0.2, P0.3, P0.4.
2. P1.1, P1.2, P1.3, P1.5.
3. P1.4, P1.6, P1.7.
4. P2 theo tốc độ tăng dữ liệu và kế hoạch thương mại hóa.

