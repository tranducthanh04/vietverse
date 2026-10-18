# Parent settings save - 2026-10-18

- Nguồn giao việc: chat điều phối PR, task F12 / Error state trong audit khách hàng mục 6. Tách từ `origin/main@35c51ca`; không thay PR #11, workspace chung hoặc phần offline/cache của chat phối hợp.
- Đồng bộ trước bàn giao: merge `origin/main@0b8dd3c` (PR #11 đã được điều phối merge) vào nhánh riêng, không conflict; source/test F12 giữ nguyên, chỉ 9 file F12 khác main.
- Đọc AGENTS, docs index, product/feature/architecture, quy tắc screen time và Parent Gate, API và review findings. Giữ mức 0/15/20/30, quyền server và quy trình PATCH rồi chọn lại hồ sơ.
- RED: 12 test đầu có 11 thất bại, 5 unhandled rejections; thiếu alert, không khóa lựa chọn và callback cũ có thể tiếp tục select bé.
- GREEN: thêm bắt lỗi VI/EN, giữ lựa chọn/retry, bảo vệ lifecycle theo tài khoản/hồ sơ/lượt request, dọn timer. 16 test có cả response chồng nhau qua; toàn frontend 320/320, build TypeScript/Vite qua, lint các file thay đổi 0 lỗi/1 warning thanh toán có sẵn. Có warning act() sẵn trong audioPlayback.
- Browser: 4 ca VI/EN x 390/1280px, lỗi 503 rồi retry bằng Enter, đúng alert/status/giá trị 0, không lỗi runtime. Ảnh nằm trong thư mục tạm local `vietverse-settings-save-KJRzwk`, không được upload công khai.
- Delegation: một reviewer đọc độc lập, không có finding chặn; không sửa file. Git-manager chỉ đóng gói commit/PR sau kiểm chứng, không triển khai nghiệp vụ.
- Sai khác với yêu cầu: không có mở rộng nghiệp vụ; lỗi refresh sau PATCH cũng được bắt để không có unhandled rejection và không xác nhận giả. Không sửa shared store, backend, thanh toán hoặc offline worker.
- Giới hạn: chưa nghiệm thu thiết bị thật/screen reader/production; không hủy hoặc rollback mutation server đã nhận. Các khoảng trống timer và sau-refresh-account/unmount ở lần review đầu được bổ sung trong follow-up dưới đây.
- Tài liệu quyết định/giả định: `docs/parent-settings-save.md`. PR riêng phải chờ chat điều phối review, không tự merge hoặc auto-merge.

## Follow-up review PR #14 trên main có offline refresh

- Điều phối yêu cầu merge `origin/main@c7519c0`; đã merge thường thành `3abd0d0`, không conflict, giữ nguyên production source F12 và đúng 9 file scope. Không gộp NAV PR #16 hoặc sửa shared store/offline/audio.
- Thêm 8 ca: offline completion -> worker -> fetchChildren thật trong lúc lưu; cùng bé giữ input/loading; đổi bé lúc PATCH/select và offline response chồng nhau không reselect cũ; tài khoản đổi/unmount-remount khi refresh đã bắt đầu (cả resolve/reject); timer hết hạn đúng 3 giây và được dọn khi unmount. Tổng 24 test F12, focused cùng offline 34/34 qua.
- Fresh full client 338/338 test, 37 file; build TypeScript/Vite qua; lint 0 lỗi/1 warning thanh toán có sẵn, warning act() audio có sẵn không sửa. Browser chạy lại 4/4 qua; ảnh local `vietverse-settings-save-XPq00N`.
- Reviewer độc lập xác nhận không finding, tự chạy lại 34/34 và diff-check. Không coi adapter test là chứng minh production ordering/cancellation.
- Ship mode: PR riêng chờ điều phối review/CI rồi merge; không auto-merge. Nguồn là audit F12, không có GitHub issue riêng được xác nhận.
- Điều phối merge NAV PR #16 trong lúc CI F12 chạy và yêu cầu đồng bộ lần cuối `main@a8014ee`. Merge thường thành `b19903b`, không conflict, giữ 9 file F12 diff; NAV chỉ thuộc baseline. Fresh frontend 343/343 (38 file), TypeScript/Vite và browser 4/4 qua; ảnh `vietverse-settings-save-Vhr1Uf`. CI trung gian `c893c15d` / run `39142601025` đã xanh tự nhiên, không cancel/rerun. CI trên head bàn giao cuối vẫn phải hoàn tất trước merge.
