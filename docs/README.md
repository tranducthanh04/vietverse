# Vietverse Docs — nguồn chuẩn trước khi code

## Mục đích

Thư mục này là nguồn chuẩn cho nghiệp vụ, phạm vi tính năng, quyền truy cập, dữ liệu và các ràng buộc kỹ thuật của Vietverse. Mọi thay đổi làm ảnh hưởng đến người dùng, điểm ViVi, quyền, API, model hoặc luồng màn hình phải đọc tài liệu liên quan trước khi code.

## Thứ tự đọc bắt buộc

1. Tài liệu này.
2. [`01-product-overview.md`](./01-product-overview.md) để hiểu sản phẩm và vai trò.
3. [`02-business-rules.md`](./02-business-rules.md) cho mọi thay đổi nghiệp vụ.
4. [`03-feature-inventory.md`](./03-feature-inventory.md) để biết tính năng hiện có và trạng thái triển khai.
5. [`04-system-architecture.md`](./04-system-architecture.md) và [`05-api-and-data-contracts.md`](./05-api-and-data-contracts.md) khi chạm vào code hoặc dữ liệu.
6. [`06-review-findings.md`](./06-review-findings.md) để tránh tái tạo lỗi và hiểu các khoản nợ cần xử lý.
7. [`07-change-workflow.md`](./07-change-workflow.md) trước khi mở PR hoặc giao việc.

## Quy tắc cập nhật

- Một nghiệp vụ mới phải có mục tiêu, actor, tiền điều kiện, luồng chính, luồng lỗi, dữ liệu thay đổi và tiêu chí chấp nhận.
- Một tính năng mới phải cập nhật feature inventory, API/data contract nếu có, và review findings nếu tạo rủi ro mới.
- Khi code và tài liệu khác nhau, phải ghi nhận chênh lệch trong PR và cập nhật tài liệu trong cùng thay đổi.
- Không dùng `TODO`, `TBD` hoặc mô tả mơ hồ làm yêu cầu đã chốt. Nếu còn câu hỏi, ghi rõ người quyết định và trạng thái chờ xử lý trong issue/PR.
- Mọi điểm thưởng, trừ điểm, mở khóa hoặc quyền xem dữ liệu phải được kiểm tra ở server; UI chỉ hiển thị trạng thái.

## Bản đồ tài liệu

| Tài liệu | Dùng khi |
| --- | --- |
| `01-product-overview.md` | Onboarding, persona, journey, phạm vi MVP |
| `02-business-rules.md` | Điểm, subscription, unlock, quiz, đổi quà, parent/admin |
| `03-feature-inventory.md` | Kiểm tra tính năng đã có, thiếu, khung hoặc placeholder |
| `04-system-architecture.md` | Frontend, backend, auth, storage, deploy, vận hành |
| `05-api-and-data-contracts.md` | Endpoint, payload, quyền, lỗi, idempotency |
| `06-review-findings.md` | Ưu tiên xử lý và bằng chứng review |
| `07-change-workflow.md` | Checklist BA/dev/reviewer trước và sau khi code |
| `cms-operations.md` | Quy tắc vận hành CMS, import nháp và publish riêng |
| `vercel-deployment.md` | Rollout BE Vercel, signed upload, indexes additive, các gate môi trường và rollback Render |
| `content-image-credits.md` | Ghi công/giấy phép ảnh bìa demo story/culture và script gán ảnh |
| `superpowers/plans/2026-10-09-customer-data-deployment.md` | Bàn giao deploy: staging → backup/restore → dry-run → import → đối soát → production |
| `superpowers/plans/2026-10-09-customer-activity-types.md` | Kế hoạch đã duyệt bốn loại hoạt động mới: server, màn bé, session/offline, CMS và catalog; trạng thái QA local ở `08-customer-alignment.md`, không import DB thật |
| `superpowers/specs/2026-10-09-customer-activity-types-design.md` | Contract đã duyệt, self-report/điểm/quyền, rollout tương thích và giới hạn nguồn |
| `adr/` | Quyết định kiến trúc có ảnh hưởng dài hạn |

## Trạng thái baseline

Đợt đối chiếu khách hàng và sửa luồng ngày 2026-10-08 được ghi tại [`08-customer-alignment.md`](./08-customer-alignment.md). Đọc bổ sung tài liệu này khi làm việc với seed, session bé và admin đổi quà; các giới hạn nghiệm thu được nêu riêng, không suy ra từ nhãn “hoàn thiện” trong baseline.

Review này phản ánh code tại ngày 2026-10-01 trên nhánh `main`. Tại thời điểm review có thay đổi chưa commit ở `client/src/app/router.tsx`, `client/src/features/auth/LoginPage.tsx` và file mới `client/src/components/ui/ProtectedRoute.tsx`; tài liệu không giả định các thay đổi đó đã được phát hành.

