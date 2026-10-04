# 03 — Feature inventory và trạng thái baseline

| Nhóm | Tính năng | UI | API/server | Dữ liệu chính | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Auth | Đăng ký/đăng nhập | Có | Có JWT + refresh cookie | User, Subscription | Hoàn thiện |
| Auth | Refresh/logout | Có Axios interceptor | Có rotation theo family + revoke DB | RefreshToken | Hoàn thiện (P1.1) |
| Auth | Google SSO | Nút UI | Trả 501 NOT_IMPLEMENTED | User.googleId | Đang phát triển |
| Subscription | Xem gói và tạo checkout | Bảng giá gọi checkout; trang cài đặt hiển thị gói hiện tại/trạng thái quay về | Tạo payment link PayOS; xác minh chữ ký + amount trên webhook; cập nhật subscription trong transaction | PaymentOrder, Subscription | Đã triển khai code; cần cấu hình credentials/webhook URL và kiểm thử giao dịch PayOS trước khi mở production |
| Phụ huynh | Thanh toán thử PayOS | `/phu-huynh/thanh-toan-thu`, nút tạo link cố định 10.000đ và theo dõi webhook | API yêu cầu đăng nhập parent/admin; ghi riêng `PaymentTestOrder`; webhook xác minh chữ ký và amount, không tác động subscription | PaymentTestOrder | Đã triển khai; khoản tiền là thật trên production, chỉ xác nhận end-to-end sau khi phụ huynh tự chuyển khoản |
| Onboarding | Tạo hồ sơ bé | Có wizard 4 bước | `POST /children` | Child | Hoàn thiện |
| Child | Chuyển/Xóa hồ sơ | Có dropdown & nút xóa | `PATCH /children/:id/select`, `DELETE /children/:id` | Child, Progress, Recording | Hoàn thiện (P1.6 cascade delete) |
| Map | Bản đồ 5 chặng | Có | `GET /stages` | Stage, LessonProgress | Hoàn thiện (P1.2 unlock policy) |
| Lesson | Lesson player | Có 7 activity types | `GET /lessons/:id`, `POST /lessons/:id/complete` | Lesson, LessonProgress | Hoàn thiện (P0.1 chấm điểm server, P1.5 offline queue) |
| Lesson | Tim/gợi ý/offline session | Có | IndexedDB + Offline Sync Queue localStorage | lesson session, queue | Hoàn thiện (P1.5) |
| Recording | Thu âm | Có MediaRecorder | `POST /recordings` | Recording, StorageService | Hoàn thiện (P2.3 audio only + 180s cap, P2.4 safe storage) |
| Stories | Kho truyện/đồng dao | Có | GET public, mark explored auth | Story, ExplorationLog | Hoàn thiện (P1.3 idempotency, P2.5 safe search) |
| Culture | Bài văn hóa/narration | Có | GET public, quiz auth | CultureArticle, ExplorationLog | Hoàn thiện (P2.5 safe search) |
| Culture | Quiz +5 điểm | Có | `POST /culture/:id/quiz` | PointTransaction, Child | Hoàn thiện (P1.3 idempotency & compensation) |
| Points | Lịch sử điểm | Có | `GET /points/children/:childId` | PointTransaction | Hoàn thiện (P2.5 limit 100) |
| Shop | Kho vật phẩm | Có hiển thị tồn kho | `GET /points/shop/items` | ShopItem | Hoàn thiện (P0.2 stock display) |
| Shop | Đổi quà ảo/vật lý | Có | `POST /points/shop/redeem` | Child, PointTransaction, Redemption | Hoàn thiện (P0.2 atomic stock decrement & rollback) |
| Parent | Dashboard năng lực | Có | `GET /parent/progress/:childId` | LessonProgress, Recording, ExplorationLog | Hoàn thiện (P0.4 bảo vệ bằng Parent Gate) |
| Parent | Bản thu âm | Có | `GET /recordings/children/:childId` | Recording | Hoàn thiện |
| Parent | Screen time | Có Modal nhắc nhở mắt + đếm giờ | `PATCH /parent/screen-time` | Child | Hoàn thiện (P1.4 real-time enforcement & override) |
| Parent | Parent Gate | Có Modal toán / PIN | `GET /challenge`, `POST /verify` | Step-up Token 15m | Hoàn thiện (P0.4 server-side token) |
| Admin | KPI | Có | `GET /admin/kpi` | Nhiều collection | Hoàn thiện |
| Admin | Learners | Có | `GET /admin/learners` | Child/User | Hoàn thiện (Limit 100) |
| Admin | Lessons | Có | GET/POST/PUT admin | Lesson | Hoàn thiện (P1.7 Zod validation & RBAC) |
| Admin | Redemptions | Có | GET/PATCH admin | Redemption | Hoàn thiện (P1.7 Zod validation, P2.5 limit 100) |
| Platform | Health/deploy | Có config Render/Vercel | `/health`, `render.yaml` | Env | Hoàn thiện (P0.3 CORS allowlist, P2.6 secret check) |

## Mức hoàn thiện nội dung seed

- Thống nhất toàn bộ tài liệu: Chặng 1 bài 1–8 nạp đầy đủ nội dung từ vựng và 5 hoạt động tương tác mẫu; các bài 9–20 tạo khung chuẩn bị giáo án.
- Stories seed 5 câu chuyện / đồng dao có karaoke lyrics.
- Culture seed 3 bài văn hóa và danh thắng tiêu biểu kèm bộ câu hỏi đố vui.
- Shop seed 5 item (3 virtual, 2 physical với số lượng tồn kho thực).

## Tình trạng khoảng trống kỹ thuật & UX đã khắc phục

- [x] Lỗi mạng khi complete lesson/culture quiz: Đã phân biệt lỗi mạng lưu vào offline queue `vietverse_offline_completions` và hiển thị trạng thái chờ đồng bộ, lỗi server hiển thị nút Thử lại (P1.5).
- [x] Admin route: Bảo vệ hoàn toàn bằng middleware RBAC server-side và Zod validation (P1.7).
- [x] Parent gate: Phiên step-up auth 15 phút với mã toán ký server-side và PIN bảo vệ qua header `X-Parent-Gate-Token` (P0.4).
- [x] Screen time: Bộ đếm thời gian thực `KidsLayout` kết hợp `ScreenTimeLimitModal` chặn màn hình khi hết giờ học, yêu cầu phụ huynh gia hạn hoặc cho mắt nghỉ ngơi (P1.4).
- [x] Responsive navigation & Touch targets: Menu hamburger di động cho PublicLayout, thanh tab chuyển phân hệ di động cho AdminLayout, chuẩn hóa toàn bộ nút header đạt tối thiểu 44px và giữ nhãn chữ Góc Phụ Huynh trên mọi kích cỡ màn hình (P1-FE.5, P2-FE.1).
- [x] Loại bỏ demo credentials khỏi production: Gated bằng `import.meta.env.DEV` tại LoginPage (P1-FE.6).



