# 05 — API và data contracts baseline

Base URL: `/api/v1`.

## Auth

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Tạo parent + free subscription |
| POST | `/auth/login` | Public | Nhận access token + refresh cookie |
| POST | `/auth/refresh` | Refresh cookie/body | Cấp access token mới |
| POST | `/auth/logout` | Public | Xóa refresh cookie |
| GET | `/auth/me` | Auth | Lấy user/subscription |
| GET | `/auth/google` | Public | Placeholder, chưa phải OAuth flow |

## Learning và child

| Method | Path | Auth | Ownership/role |
| --- | --- | --- | --- |
| GET | `/children` | Auth | Chỉ children của user |
| POST | `/children` | Auth | Kiểm tra subscription limit |
| GET/PUT/DELETE | `/children/:id` | Auth | `child.parentId === req.user.id` |
| PATCH | `/children/:id/select` | Auth | Ownership check |
| GET | `/stages?childId=` | Auth | Ownership khi có childId |
| GET | `/lessons/:id` | Auth | Baseline chưa enforce unlock/plan |
| POST | `/lessons/:id/complete` | Auth | Child ownership; cần server-side eligibility/chấm |

## Content và recording

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| GET | `/stories`, `/stories/:id` | Public | Đọc story |
| POST | `/stories/:id/explored` | Auth | Ghi exploration cho child |
| GET | `/culture`, `/culture/:id` | Public | Đọc bài văn hóa |
| POST | `/culture/:id/quiz` | Auth | Chấm quiz và thưởng |
| POST | `/recordings` | Auth + multipart | Upload audio/recording |
| GET | `/recordings/children/:childId` | Auth | Parent ownership |

## Points, parent, admin

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| GET | `/points/shop/items` | Auth | Item active |
| GET | `/points/children/:childId` | Auth | Số dư + history của child |
| POST | `/points/shop/redeem` | Auth | Trừ điểm và tạo redemption |
| GET | `/parent/progress/:childId` | Auth | Dashboard năng lực |
| PATCH | `/parent/screen-time` | Auth | Lưu limit |
| GET | `/admin/kpi` | Admin | KPI |
| GET | `/admin/learners` | Admin | Danh sách học viên |
| GET/PATCH | `/admin/redemptions`, `/admin/redemptions/:id` | Admin | Vận hành đơn |
| GET/POST/PUT | `/admin/lessons...` | Admin | Quản trị bài |

## Response và lỗi

- Success dùng wrapper `sendSuccess`; lỗi dùng `sendError`/central error handler.
- Mã thường dùng: `400` dữ liệu không hợp lệ, `401` chưa xác thực, `403` không quyền, `404` không tồn tại, `409` trùng.
- Zod error cần được chuẩn hóa thành lỗi người dùng hiểu được, không làm lộ stack hoặc dữ liệu nội bộ.

## Contract cần giữ ổn định

- `childId` luôn phải được kiểm tra ownership.
- Giao dịch điểm phải có `reason`, `delta`, `refId` và mô tả truy vết được.
- Với mutation có thể retry, client cần nhận kết quả idempotent thay vì tạo record mới.
- Không trả `passwordHash`, secret, refresh token hoặc dữ liệu admin nội bộ cho client.

