# 07 — Quy trình thêm nghiệp vụ hoặc tính năng

## Trước khi code

- [ ] Đọc `docs/README.md` và tài liệu domain liên quan.
- [ ] Xác định actor, mục tiêu, tiền điều kiện, hậu điều kiện và tiêu chí chấp nhận.
- [ ] Kiểm tra feature inventory để biết có thể mở rộng flow hiện tại hay đang tạo flow mới.
- [ ] Kiểm tra review findings để không tái tạo P0/P1.
- [ ] Chốt quyền: public, authenticated owner, parent, admin.
- [ ] Chốt nguồn sự thật: server state, client state hay derived view.
- [ ] Chốt idempotency, retry, concurrency và transaction boundary cho mọi mutation.

## Trong lúc thiết kế

- [ ] Cập nhật business rule nếu điểm, unlock, subscription, stock hoặc trạng thái thay đổi.
- [ ] Cập nhật API contract với method, path, request, response, lỗi và ownership.
- [ ] Cập nhật model/data lifecycle nếu thêm collection/field/index.
- [ ] Xác định migration/seed compatibility.
- [ ] Xác định trạng thái loading, empty, error, offline và retry ở UI.

## Trong lúc code

- [ ] Validate input ở server bằng schema.
- [ ] Ownership/role check ở server, không chỉ ở route/UI.
- [ ] Không tin điểm, quyền hoặc kết quả học do client tự khẳng định.
- [ ] Không để một nghiệp vụ nhiều bước ghi dữ liệu mà không có transaction hoặc cơ chế bù.
- [ ] Không làm lộ secret, đáp án chuẩn hoặc dữ liệu của child khác.
- [ ] Giữ response/error theo contract hiện tại hoặc cập nhật tài liệu đồng thời.

## Trước khi review/merge

- [ ] Cập nhật `03-feature-inventory.md`.
- [ ] Cập nhật `06-review-findings.md` nếu phát hiện rủi ro mới hoặc đã đóng finding.
- [ ] Cập nhật tài liệu API/data và ADR nếu có quyết định dài hạn.
- [ ] Chạy các kiểm tra phù hợp với phạm vi thay đổi và ghi lại kết quả thật.
- [ ] Kiểm tra diff chỉ chứa thay đổi đã được yêu cầu; không ghi đè thay đổi chưa commit của người khác.
- [ ] Ghi rõ giới hạn còn lại và cách rollback.

## Mẫu yêu cầu nghiệp vụ

```markdown
### Tên nghiệp vụ
- Actor:
- Mục tiêu:
- Tiền điều kiện:
- Luồng chính:
- Luồng lỗi/retry:
- Quyền và ownership:
- Dữ liệu/API thay đổi:
- Idempotency/concurrency:
- Tiêu chí chấp nhận:
```

