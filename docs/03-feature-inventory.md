# 03 — Feature inventory và trạng thái baseline

| Nhóm | Tính năng | UI | API/server | Dữ liệu chính | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Auth | Đăng ký/đăng nhập | Có | Có JWT + refresh cookie | User, Subscription | Đang dùng |
| Auth | Refresh/logout | Ẩn trong client | Có | Cookie refresh | Có, cần rotation/revocation |
| Auth | Google SSO | Chưa có flow thật | Placeholder `/auth/google` | User.googleId | Chưa hoàn thiện |
| Onboarding | Tạo hồ sơ bé | Có wizard 4 bước | `POST /children` | Child | Đang dùng |
| Child | Chuyển hồ sơ | Có dropdown | `PATCH /children/:id/select` | Child | Đang dùng |
| Map | Bản đồ 5 chặng | Có | `GET /stages` | Stage, LessonProgress | Đang dùng |
| Lesson | Lesson player | Có 7 activity types | `GET /lessons/:id`, `POST /lessons/:id/complete` | Lesson, LessonProgress | Có, server trust client score |
| Lesson | Tim/gợi ý/offline session | Có | IndexedDB client | lesson session | Có, chưa có sync/conflict |
| Recording | Thu âm | Có MediaRecorder | `POST /recordings` | Recording, StorageService | Có, cần quota/retention |
| Stories | Kho truyện/đồng dao | Có | GET public, mark explored auth | Story, ExplorationLog | Đang dùng |
| Culture | Bài văn hóa/narration | Có | GET public, quiz auth | CultureArticle, ExplorationLog | Đang dùng |
| Culture | Quiz +5 điểm | Có | `POST /culture/:id/quiz` | PointTransaction, Child | Có, cần validation/transaction |
| Points | Lịch sử điểm | Có | `GET /points/children/:childId` | PointTransaction | Đang dùng |
| Shop | Kho vật phẩm | Có | `GET /points/shop/items` | ShopItem | Có |
| Shop | Đổi quà ảo/vật lý | Có | `POST /points/shop/redeem` | Child, PointTransaction, Redemption | Có, thiếu stock/transaction |
| Parent | Dashboard năng lực | Có | `GET /parent/progress/:childId` | LessonProgress, Recording, ExplorationLog | Heuristic MVP |
| Parent | Bản thu âm | Có | `GET /recordings/children/:childId` | Recording | Đang dùng |
| Parent | Screen time | Có | `PATCH /parent/screen-time` | Child | Lưu cấu hình, chưa enforce |
| Admin | KPI | Có | `GET /admin/kpi` | Nhiều collection | Đang dùng |
| Admin | Learners | Có | `GET /admin/learners` | Child/User | Có, giới hạn 100 |
| Admin | Lessons | Có | GET/POST/PUT admin | Lesson | Có, thiếu validation |
| Admin | Redemptions | Có | GET/PATCH admin | Redemption | Có, thiếu workflow/audit |
| Platform | Health/deploy | Có config Render/Vercel | `/health`, `render.yaml` | Env | Đang dùng |

## Mức hoàn thiện nội dung seed

- README mô tả bài 1–4 đầy đủ.
- Seed hiện log bài 1–8 đầy đủ hơn và tạo bài 9–20 dạng khung; tài liệu sản phẩm cần dùng một mốc thống nhất.
- Stories seed 5 mẫu.
- Culture seed 5 mẫu.
- Shop seed 5 item, trong đó 3 virtual và 2 physical.

## Khoảng trống UX cần xử lý trước khi gọi là hoàn thiện

- Lỗi mạng khi complete lesson/culture quiz đang có thể hiển thị thành công dù server chưa ghi nhận.
- Admin route có client redirect theo role nhưng guard server mới là ranh giới quyền thật.
- Parent gate chưa tạo phiên server-side.
- Screen time chưa có bộ đếm hoặc chặn phiên.

