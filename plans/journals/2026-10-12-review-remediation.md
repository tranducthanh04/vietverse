# Review remediation — 2026-10-12

## Phạm vi

Xử lý tuần tự các lỗi đã xác minh trong review toàn dự án. Cloudinary và thanh toán
không nằm trong lượt này; không push, deploy, xoay secret hay ghi database production.

## Nguyên nhân và thay đổi

- Logger thiếu redaction cho `set-cookie` và `x-parent-gate-token`; đã bổ sung và kiểm
  tra qua pino-http/Express với token giả.
- `PUT /children/:id` có thể đổi screen time ngoài Parent Gate; schema nay loại trường
  này. Tạo bé khóa `User.__v` trong transaction trước khi đếm quota để hai request đồng
  thời không vượt giới hạn.
- Lesson progress được ghi trước ledger/số dư; đã gom progress, award ledger và balance
  vào một MongoDB transaction, khóa `Child.__v`, giữ score/stars/trạng thái completed
  theo hướng monotonic. Không backfill dữ liệu lịch sử.
- Màn lesson/culture nay phân biệt chưa đạt, cho retry quiz sai, bỏ qua response muộn
  sau đổi context. Replay cũng kiểm tra identity ngay sau khi xóa session; regression
  delayed IndexedDB delete đã tái hiện RED rồi GREEN.
- Đăng ký email có ô xác nhận mật khẩu ở client, vẫn giữ payload API cũ. Google OAuth
  vẫn là 501 vì chưa có cấu hình/provider được owner cấp.

## Bằng chứng

- RED/GREEN: logger 1/1; child gate/quota; lesson integrity 3/3; learning UI và
  registration; replay race 16/16 sau fix.
- Full backend: **376 tests passed / 41 files**.
- Full frontend: **187 tests passed / 24 files**.
- Typecheck server/client: exit 0.
- Production build: exit 0; bundle sau Router7 vẫn cảnh báo chunk JavaScript khoảng 706 kB (gzip210 kB).
- Client lint: **0 errors, 86 warnings** (nợ có sẵn/chưa thuộc scope).
- Independent simplifier chỉ dọn metadata/comment không dùng trong helper award;
  independent reviewer không còn Critical/Important trong diff hiện tại.
- Dependency follow-up: `bcrypt` 6.0.0 loại bỏ `@mapbox/node-pre-gyp` và `tar` khỏi
  production tree; React Router 7.18.2 đã qua toàn bộ test/build client. `npm audit
  --omit=dev` trả 0 advisory; audit đầy đủ vẫn còn cảnh báo toolchain dev
  (Vitest/Tailwind), còn `concurrently` đã nâng patch 9.2.5 để dùng `shell-quote`
  1.12.0. Audit đầy đủ cuối có10 advisory (3moderate/5high/2critical), đều dev;
  chưa nâng major Vitest/Tailwind hoặc chạy `audit fix --force`.
- Header503 regression đã RED (thiếu nosniff) rồi GREEN; login bằng hai public hash
  vectors2a/2b thành công, hash không bị viết lại, mật khẩu sai401. Independent reviewer
  chạy lại auth8/8 và không thấy lỗi quan trọng mới; scoped simplification ran clean.
  Full `npm test` cuối376 BE +187 FE; concurrently chạy hai subprocess thành công.

## Giới hạn còn lại

Chưa audit read-only Atlas các collection/index/ledger/stock/progress, chưa xử lý log
hoặc session production đã lưu, chưa bù điểm lịch sử, chưa có Google OAuth credentials,
audio/bản dịch/provider được duyệt, dependency advisories và nghiệm thu mobile/giáo án.
Các bước này cần quyền hoặc quyết định riêng, không tự động làm trong lượt này.

AgentKit CLI không có trên PATH nên không thể publish journal qua CLI; file local này là
nguồn ghi nhận phiên. AgentWiki publish skipped.
