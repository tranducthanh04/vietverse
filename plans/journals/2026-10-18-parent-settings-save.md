# Parent settings save - 2026-10-18

- Nguồn giao việc: chat điều phối PR, task F12 / Error state trong audit khách hàng mục 6. Tách từ `origin/main@35c51ca`; không thay PR #11, workspace chung hoặc phần offline/cache của chat phối hợp.
- Đọc AGENTS, docs index, product/feature/architecture, quy tắc screen time và Parent Gate, API và review findings. Giữ mức 0/15/20/30, quyền server và quy trình PATCH rồi chọn lại hồ sơ.
- RED: 12 test đầu có 11 thất bại, 5 unhandled rejections; thiếu alert, không khóa lựa chọn và callback cũ có thể tiếp tục select bé.
- GREEN: thêm bắt lỗi VI/EN, giữ lựa chọn/retry, bảo vệ lifecycle theo tài khoản/hồ sơ/lượt request, dọn timer. 16 test có cả response chồng nhau qua; toàn frontend 320/320, build TypeScript/Vite qua, lint các file thay đổi 0 lỗi/1 warning thanh toán có sẵn. Có warning act() sẵn trong audioPlayback.
- Browser: 4 ca VI/EN x 390/1280px, lỗi 503 rồi retry bằng Enter, đúng alert/status/giá trị 0, không lỗi runtime. Ảnh nằm trong thư mục tạm local `vietverse-settings-save-KJRzwk`, không được upload công khai.
- Delegation: một reviewer đọc độc lập, không có finding chặn; không sửa file. Git-manager chỉ đóng gói commit/PR sau kiểm chứng, không triển khai nghiệp vụ.
- Sai khác với yêu cầu: không có mở rộng nghiệp vụ; lỗi refresh sau PATCH cũng được bắt để không có unhandled rejection và không xác nhận giả. Không sửa shared store, backend, thanh toán hoặc offline worker.
- Giới hạn: chưa nghiệm thu thiết bị thật/screen reader/production; không hủy hoặc rollback mutation server đã nhận. Còn ca timer và sau-refresh-account/unmount chưa có test tách riêng; đã ghi trong tài liệu.
- Tài liệu quyết định/giả định: `docs/parent-settings-save.md`. PR riêng phải chờ chat điều phối review, không tự merge hoặc auto-merge.
