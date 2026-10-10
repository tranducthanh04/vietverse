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
| Lesson | Lesson player | 7 loại cũ + multi_select/group_sort/fill_blanks/follow_steps | `GET /lessons/:id?activityContract=2`, `POST /lessons/:id/complete` | Lesson, LessonProgress | Triển khai local 2026-10-09; loại mới ghi nhận trung tính, chấm server; chưa xác nhận deploy/content production |
| Lesson | Tim/gợi ý/offline session | Có | IndexedDB + Offline Sync Queue localStorage | lesson session, queue | Hoàn thiện (P1.5) |
| Recording | Thu âm | MediaRecorder elapsed auto-stop179s margin1s/background, upload trực tiếp production, guard phiên/retry finalize/explicit expired resend | Multipart legacy; `/recordings/upload-intent`, `/recordings/finalize` | Recording, RecordingUploadIntent, Cloudinary | Triển khai local, review2026-10-10; server strict180s, metadata/preset thật và rollout production chưa nghiệm thu |
| Stories | Kho truyện/đồng dao | Có | GET public, mark explored auth | Story, ExplorationLog | Hoàn thiện (P1.3 idempotency, P2.5 safe search) |
| Culture | Bài văn hóa/narration | Có | GET public, quiz auth | CultureArticle, ExplorationLog | Hoàn thiện (P2.5 safe search) |
| Culture | Quiz +5 điểm | Có | `POST /culture/:id/quiz` | PointTransaction, Child | Hoàn thiện (P1.3 idempotency & compensation) |
| Points | Lịch sử điểm | Bảng cộng/trừ, Hôm nay/Hôm qua, Xem thêm | `GET /points/children/:childId` | PointTransaction | Mở rộng 2026-10-09: phân trang cursor, `totalEarned` |
| Points | Điểm theo hoạt động | +1 mỗi hoạt động đạt lần đầu | Nộp bài | PointTransaction, Child | Mới 2026-10-09 (giả định chỉ khi đỗ) |
| Points | Quy tắc điểm cấu hình | Trang admin `/admin/quy-tac-diem` | `GET/PATCH /admin/point-rules` | PointRule, AdminAuditLog | Mới 2026-10-09 |
| Shop | Loại vật phẩm và dùng avatar/khung | Tab lọc 4 loại + quà hiện vật; Phòng báu vật có Dùng/Đang dùng; header khu bé | `/points/children/:childId/collection`, `/equip`, `POST /admin/inventory` | ShopItem, Child | Mới 2026-10-09 |
| Shop | Kho vật phẩm | Có hiển thị tồn kho | `GET /points/shop/items` | ShopItem | Hoàn thiện (P0.2 stock display) |
| Shop | Đổi quà ảo/vật lý | Có | `POST /points/shop/redeem` | Child, PointTransaction, Redemption | Hoàn thiện (P0.2 atomic stock decrement & rollback) |
| Parent | Dashboard tiến độ và năng lực | Chặng hiện tại, tiến độ theo catalog, 10 hoạt động, số dư/liên kết kho điểm, 4 năng lực tham khảo | `GET /parent/progress/:childId` | Stage, Lesson, LessonProgress, Recording, ExplorationLog | Mở rộng 2026-10-09; giữ Parent Gate và ownership, chưa phải đánh giá chuyên môn |
| Parent | Bản thu âm | Có | `GET /recordings/children/:childId` | Recording | Hoàn thiện |
| Parent | Screen time | Có Modal nhắc nhở mắt + đếm giờ | `PATCH /parent/screen-time` | Child | Hoàn thiện (P1.4 real-time enforcement & override) |
| Parent | Parent Gate | Có Modal toán / PIN | `GET /challenge`, `POST /verify` | Step-up Token 15m | Hoàn thiện (P0.4 server-side token) |
| Admin | KPI | Có | `GET /admin/kpi` | Nhiều collection | Hoàn thiện |
| Admin | Learners | Có | `GET /admin/learners` | Child/User | Hoàn thiện (Limit 100) |
| Admin | CMS lesson/story/culture | List/filter, form đầy đủ, nháp, preview độc lập, publish/ẩn có xác nhận | `/admin/content/:kind` | ContentDraft, ContentRevision, live, AdminAuditLog | Đã triển khai local 2026-10-09; publish mặc định tắt, chưa import production |
| Admin | Redemptions | Có | GET/PATCH admin | Redemption | Hoàn thiện (P1.7 Zod validation, P2.5 limit 100) |
| Platform | Health/deploy | FE Vercel giữ proxy hiện hữu; BE có native Express config | `/health`, `/ready`, Mongo rate limit chung; Render giữ rollback | Env, RateLimitBucket | Triển khai local 2026-10-09; chưa chuyển traffic production. Xem runbook Vercel |

## Mức hoàn thiện nội dung seed (đối chiếu 2026-10-08)

Bổ sung review recording2026-10-10: explicit resend intent mới giữ Blob, monotonic auto-stop179s margin1s/background, stable legacy asset/commit reconciliation, intent/delete transaction. Project BE đã tạo nhưng chưa deploy/cutover; metadata/device/native/IP/cookie/webhook vẫn chờ staging. Không thay điểm, business unlock hoặc nội dung.

Bổ sung CMS 2026-10-09: bộ nhập có nguồn 20 giáo án/21 bài đọc/tám nhóm văn hóa tạo draft, không ghi đè seed/live. Xem [coverage](./customer-source/2026-10-09/coverage.md). Hoạt động không hỗ trợ và nội dung/media thiếu vẫn cần biên tập; số draft không phải số bài đủ điều kiện phát hành.

- Seed insert-only tạo 5 chặng × 4 bài, 6 hoạt động/bài thông thường và 5 hoạt động ở bài 20.
- Stories seed 21 bài đọc biên tập có thể thiếu audio; không khẳng định là lời nguyên tác hoặc đã có quyền sử dụng.
- Culture seed 8 nhóm chủ đề, mỗi nhóm có dữ liệu minh họa và quiz mẫu.
- Shop seed 5 item; item physical mới mặc định inactive/stock 0 để không phát hành tồn kho giả.
- Database hiện có được giữ nguyên lesson, tài khoản, tiến độ, ledger, redemption và stock; migration nội dung là công việc riêng.

## Tình trạng khoảng trống kỹ thuật & UX đã khắc phục

- [x] Lỗi mạng khi complete lesson/culture quiz: Đã phân biệt lỗi mạng lưu vào offline queue `vietverse_offline_completions` và hiển thị trạng thái chờ đồng bộ, lỗi server hiển thị nút Thử lại (P1.5).
- [x] Admin route: Bảo vệ hoàn toàn bằng middleware RBAC server-side và Zod validation (P1.7).
- [x] Parent gate: Phiên step-up auth 15 phút với mã toán ký server-side và PIN bảo vệ qua header `X-Parent-Gate-Token` (P0.4).
- [x] Reload Parent portal (2026-10-09): đã sửa vòng đời token khi bootstrap auth, kiểm chứng bằng test từ trạng thái chưa tải user và reload trình duyệt thật; không chỉ kiểm tra khi user đã có sẵn trong store.
- [x] Screen time: `ChildSessionGuard` và `ScreenTimeGuard` dùng chung cho bản đồ, lesson trực tiếp và khám phá đã đăng nhập. Hết giờ thì unmount nội dung; gia hạn sau Parent Gate cập nhật timer đang chạy. Parent portal vẫn truy cập được khi hết giờ học.
- [x] Responsive navigation & Touch targets: Menu hamburger di động cho PublicLayout, thanh tab chuyển phân hệ di động cho AdminLayout, chuẩn hóa toàn bộ nút header đạt tối thiểu 44px và giữ nhãn chữ Góc Phụ Huynh trên mọi kích cỡ màn hình (P1-FE.5, P2-FE.1).
- [x] Loại bỏ demo credentials khỏi production: Gated bằng `import.meta.env.DEV` tại LoginPage (P1-FE.6).



