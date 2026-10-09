# 05 — API và data contracts baseline

Base URL: `/api/v1`.

## CMS — lớp dữ liệu đang triển khai (2026-10-09)

- Model nội dung bổ sung `contentVersion`, `publishedAt`, `publishedBy`; bản legacy thiếu version được hiểu là 0. Story/culture có `seedKey` và `visibility` tùy chọn, chưa đổi hành vi API đọc trong bước này.
- `ContentDraft` tách khỏi live, định danh duy nhất `{kind, contentId}` và tăng `draftVersion` khi lưu. `ContentRevision` lưu snapshot bất biến theo `{kind, contentId, contentVersion}`. Chưa bật publish hoặc chạy migration/import.
- Schema draft cho phép nội dung dở dang nhưng kiểm tra giới hạn và URL; publish kiểm tra tính khả dụng của bảy activity type, lyrics và quiz. Chi tiết ràng buộc tại thiết kế CMS; đây chưa phải xác nhận toàn bộ CMS đã phát hành.

API nháp `/admin/content/:kind` (kind: `lessons`, `stories`, `culture`) yêu cầu JWT + admin:

- `GET /`, `GET /:id`: danh sách phân trang hoặc live/draft; GET không tạo dữ liệu. Filter `search` tối đa 50 ký tự, `state`, `stageId`, `category`, `page` từ 1, `pageSize` 1–100.
- `POST /drafts`: tạo truyện/văn hóa nháp với `{payload, requestId}`; requestId của cùng admin không tạo bản trùng. Không tạo lesson mới.
- `POST /:id/draft`: bắt đầu nháp; mở lại bản đã bỏ/đã đồng bộ phải gửi `expectedDraftVersion` hiện tại.
- `PUT /:id/draft`: `{payload, expectedDraftVersion}`; lỗi cạnh tranh trả `409 CONTENT_CONFLICT`, không sửa live. Giữ stage/order; ID activity mới do server cấp.
- `POST /:id/discard-draft`: bỏ đúng phiên bản nháp, không xóa live/history.
- `GET /:id/preview?draftVersion=` và `POST /:id/validate` với `expectedDraftVersion`: chỉ đọc đúng version, trả lỗi field; không ghi tiến độ/điểm.
- `POST /:id/publish`: `{expectedDraftVersion, baseContentVersion}`; transaction ghi snapshot, live, trạng thái draft và audit cùng lúc. Retry đúng phiên bản đã xuất bản trả receipt cũ; bản legacy được giữ snapshot 0.
- `PATCH /:id/visibility`: `{visibility, expectedContentVersion}` cho truyện/văn hóa; tăng version, giữ lịch sử, làm nháp dựa trên version cũ bị conflict. Không áp dụng bài học.
- Quyết định triển khai: `CMS_PUBLISH_ENABLED` mặc định `false`; publish/visibility trả 503 khi tắt hoặc MongoDB không hỗ trợ transaction. Chưa bật trên production; phải hoàn tất reader/client hiểu phiên bản trước khi bật.
- POST/PUT `/admin/lessons` cũ từ chối payload hợp lệ bằng `409 CONTENT_CMS_REQUIRED`, không còn ghi thẳng live; payload sai vẫn trả 400.

Quyết định bảo vệ phiên học khi xuất bản:

- GET lesson bắt buộc `childId` sở hữu/mở khóa; thêm query `contentVersion` không âm để tiếp tục bản đã mở. Response lesson/story/culture có `contentVersion` (legacy = 0), không xuất metadata nội bộ CMS.
- Complete lesson và culture quiz nhận `contentVersion`; thiếu version chỉ tương thích khi live vẫn là 0. Live đã đổi trả `409 CONTENT_VERSION_REQUIRED`; version không tồn tại trả 404. Chấm snapshot nhưng giữ nguyên ID progress/khóa thưởng, không reset sao/điểm.
- Story/culture `withdrawn` bị loại khỏi list/detail và từ chối exploration/quiz mới, kể cả gửi version cũ; lịch sử cũ còn nguyên.
- Multipart recording dùng field `audio`, nhận `contentVersion`; `lessonId`/`activityId` phải đi cùng nhau. Server kiểm tra ownership, unlock và activity thu âm đúng version trước upload. Response có `id` dùng làm đáp án; thiếu version trên recording legacy chỉ khớp bài version 0. `true`, text hoặc ID bản thu khác bé/bài/activity/version không được tính đạt.
- Client đọc session IndexedDB trước GET lesson, giữ `contentVersion` xuyên reload/nộp bài/thu âm. Session legacy thiếu version cần người dùng chủ động bắt đầu lại; không tự gán đáp án cũ vào bài mới. Quiz giữ bản đã tải khi đổi focus/kết nối.
- Outbox lưu ID ổn định, chủ tài khoản, child và version; chỉ xóa đúng item đã xác nhận. Lỗi 400/403/404/409 giữ đáp án với trạng thái `needs_attention`, có thử lại chủ động; lỗi mạng/401 dừng nhưng giữ toàn bộ đuôi. JSON hỏng giữ nguyên để khôi phục. Nếu cả mạng và lưu local lỗi, không xóa session hoặc báo hoàn thành.
- Seed story dùng `story-01`…`story-21`, culture dùng `culture-<category>`; tra key trước tiêu đề. `npm run cms:metadata -w server` mặc định dry-run; `-- --apply` bổ sung key trong transaction và index unique sparse, không sửa payload/timestamps. Tiêu đề legacy khớp duy nhất sau chuẩn hóa NFC/case mới được ánh xạ; xung đột phải xử lý thủ công. Chưa chạy migration trên production.
- Seed tôn trọng seedKey của draft-only ở mọi trạng thái, không tự tạo live cho nội dung đang nhập nháp; key trùng nhưng ID khác báo conflict trước ghi. Import apply và seed dùng chung khóa writer, có thể dry-run khi khóa đang tồn tại. Khóa sau crash cần đối soát thủ công, không tự timeout.
- Activity `fill_blank` chỉ có một ô trống: mỗi chuỗi từ hai dấu `_` liền nhau được validator và renderer coi là một marker, không cắt mất phần câu phía sau.

## Auth

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Tạo parent + free subscription |
| POST | `/auth/login` | Public | Nhận access token + refresh cookie |
| POST | `/auth/refresh` | Refresh cookie/body | Cấp access token mới + xoay vòng (rotate) refresh token, phát hiện và ngăn chặn token reuse |
| POST | `/auth/logout` | Public | Thu hồi phiên refresh token / token family trên server và xóa refresh cookie |
| GET | `/auth/me` | Auth | Lấy user/subscription |
| GET | `/auth/google` | Public | Trả mã 501 `NOT_IMPLEMENTED` (tính năng đang phát triển) |

## Learning và child

| Method | Path | Auth | Ownership/role |
| --- | --- | --- | --- |
| GET | `/children` | Auth | Chỉ children của user |
| POST | `/children` | Auth | Kiểm tra subscription limit (free/monthly: 1, yearly: 3) |
| GET/PUT | `/children/:id` | Auth | `child.parentId === req.user.id` |
| DELETE | `/children/:id` | Auth | `child.parentId === req.user.id` — **Cascade Deletion**: Xóa đồng thời toàn bộ `LessonProgress`, `Recording`, `ExplorationLog`, `PointTransaction`, và `Redemption` của bé |
| PATCH | `/children/:id/select` | Auth | Ownership check |
| GET | `/stages?childId=` | Auth | Ownership khi có childId, trả trạng thái mở khóa theo điều kiện hoàn thành chặng trước + subscription |
| GET | `/lessons/:id?childId=&contentVersion=` | Auth | Bắt buộc child ownership/unlock; đọc live hoặc snapshot đã xuất bản |
| POST | `/lessons/:id/complete` | Auth | Child ownership; kiểm tra mở khóa, server tự chấm answers (bỏ qua client score), ghi nhận sao và thưởng ViVi Points (+10) |

## Content và recording

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| GET | `/stories`, `/stories/:id` | Public | Đọc story (query `type`, `search` được escape regex và cắt tối đa 50 ký tự; limit 100) |
| POST | `/stories/:id/explored` | Auth | Ghi exploration cho child (idempotent qua unique index `{childId, kind, refId}`) |
| GET | `/culture`, `/culture/:id` | Public | Đọc bài văn hóa (query `category`, `search` được escape regex; limit 100) |
| POST | `/culture/:id/quiz` | Auth | Chấm quiz và thưởng (+5 points idempotent, rollback tự động nếu lỗi) |
| POST | `/recordings` | Auth + multipart | Upload file âm thanh bé đọc (`audio/*`, `application/ogg`; max 5MB; duration capped 180s; Dev/Test fallback Base64 <= 2MB; Production bắt buộc Cloudinary) |
| GET | `/recordings/children/:childId` | Auth | Parent ownership |

## Subscription và thanh toán

| Method | Path | Auth | Mục đích / ràng buộc |
| --- | --- | --- | --- |
| POST | `/payments/create-checkout` | Auth | Body `{ planType: 'monthly' | 'yearly' }`; server chọn giá 149.000đ/990.000đ và trả `orderCode`, `checkoutUrl`; không cấu hình PayOS thì trả 503 |
| POST | `/payments/webhook` | Public, PayOS signature required | Nhận nguyên payload webhook PayOS (`code`, `desc`, `success`, `data`, `signature`); xác minh bằng SDK, so khớp số tiền; đơn và subscription cập nhật idempotent trong MongoDB transaction |
| GET | `/payments/history` | Auth | Lịch sử tối đa 50 đơn của tài khoản hiện tại |
| GET | `/payments/orders/:orderCode` | Auth | Chỉ trả đơn thuộc tài khoản hiện tại; UI dùng để đọc kết quả sau khi quay về từ PayOS, không dùng return URL làm chứng cứ đã thanh toán |
| POST | `/payments/test-checkout` | Parent/Admin | Tạo đơn test PayOS production cố định 10.000đ; không nhận amount từ client; lưu riêng `PaymentTestOrder`, không đăng ký gói |
| GET | `/payments/test-orders/:orderCode` | Parent/Admin | Chỉ người tạo đơn được xem trạng thái; chỉ webhook PayOS hợp lệ mới đổi trạng thái sang `completed` |

Để bật PayOS production cần cấu hình đủ `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `CLIENT_ORIGIN` HTTPS, MongoDB replica set, và khai báo webhook URL `https://<api-domain>/api/v1/payments/webhook` tại kênh thanh toán PayOS. Nếu chưa cấu hình PayOS, backend vẫn khởi động cho các API khác; riêng tạo checkout trả 503. PayOS không có sandbox; endpoint test tạo giao dịch thật 10.000đ cho parent/admin và webhook của loại đơn này không được phép sửa subscription.

## Points, parent, admin

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| GET | `/points/shop/items` | Auth | Item active (trả về cả `stock` tồn kho thực tế) |
| GET | `/points/children/:childId` | Auth | Số dư + 100 giao dịch gần nhất của child |
| POST | `/points/shop/redeem` | Auth | Trừ điểm nguyên tử, trừ stock quà vật lý, chặn mua lặp quà ảo, tạo redemption kèm rollback bù nếu thất bại |
| GET | `/parent/gate/challenge` | Auth | Cấp thử thách phép toán + `challengeToken` ngắn hạn (5m) |
| POST | `/parent/gate/verify` | Auth | Đối chiếu kết quả toán / PIN `1234`, cấp `gateToken` (15m) |
| GET | `/parent/progress/:childId` | Auth + Gate Token | Dashboard 4 trụ cột năng lực (bắt buộc header `X-Parent-Gate-Token`) |
| PATCH | `/parent/screen-time` | Auth + Gate Token | Cập nhật giới hạn phiên màn hình (15, 20, 30 phút hoặc 0) (bắt buộc `X-Parent-Gate-Token`) |
| GET | `/admin/kpi` | Admin | Thống kê số lượng users, children, lessons completed, redemptions, v.v. |
| GET | `/admin/learners` | Admin | Danh sách 100 học viên gần nhất |
| GET | `/admin/redemptions` | Admin | Danh sách 100 đơn đổi quà gần nhất |
| PATCH | `/admin/redemptions/:id` | Admin | Cập nhật đơn qua `updateRedemptionSchema` (`status`: 'pending'\|'shipped'\|'delivered', `trackingCode`, `carrier`, `notes`) |
| GET | `/admin/lessons` | Admin | Danh sách tất cả bài học kèm populate stage |
| POST | `/admin/lessons` | Admin | Ngừng ghi live; payload hợp lệ trả 409 `CONTENT_CMS_REQUIRED` |
| PUT | `/admin/lessons/:id` | Admin | Ngừng ghi live; dùng luồng draft/publish CMS |

## Response và lỗi

### CMS nháp — 2026-10-09

- Base `/admin/content/:kind` (`lessons`, `stories`, `culture`), JWT + admin trên mọi route. GET list có search/state/stageId/category/page/pageSize; GET `/:id` chỉ đọc `{ live, draft }`, không tự tạo nháp.
- POST `/:id/draft` bắt đầu/mở lại nháp; khi mở lại phải gửi `expectedDraftVersion`. PUT `/:id/draft` gửi `{ payload, expectedDraftVersion }`; response trả draftVersion mới và activity ID server cấp. Sai version trả 409, UI giữ form và yêu cầu tải lại chủ động.
- POST `/drafts` tạo story/culture nháp qua `{ payload, requestId }`. POST `/:id/discard-draft` chỉ bỏ nháp bằng version check. Lesson giữ cố định ID/chặng/thứ tự.
- GET `/:id/preview?draftVersion=` và POST `/:id/validate` (`expectedDraftVersion`) đọc đúng bản đã lưu, trả field issues. POST `/:id/publish` gửi `{ expectedDraftVersion, baseContentVersion }`; transaction ghi revision/live/draft/audit, retry trả receipt của bản đã xuất bản.
- PATCH `/:id/visibility` gửi `{ visibility, expectedContentVersion }` cho story/culture. Publish/visibility mặc định bị khóa bởi `CMS_PUBLISH_ENABLED=false`; không khóa biên tập nháp. Không hỗ trợ transaction trả 503, không ghi nửa chừng.
- UI bài học tách lưu/kiểm tra/preview/publish, cảnh báo rời trang chưa lưu; lỗi validation đưa focus tới field đầu tiên. Khi lưu, cấu trúc activities tạm khóa, metadata gõ thêm được giữ. Cờ điểm/quyền học vẫn do server kiểm tra.
- Admin có trang `/admin/truyen` và `/admin/van-hoa`, tạo nháp bằng requestId ổn định khi retry trong cùng màn tạo. Form đủ lyrics/timestamp/quiz/vocab/media/nhóm tuổi hoặc category/intro/facts/tags. Xóa đáp án đang chọn đặt correctAnswer=-1 để server chặn publish; sắp lại lựa chọn giữ đúng đáp án theo identity local.
- Preview nằm tại `/:id/xem-truoc?draftVersion=`, chỉ tải bản đã lưu đúng version. Không mount learner/detail pages, không dùng child context, không gọi complete/explore/quiz/upload; recording được thay bằng mô phỏng. Nháp activity lỗi không chạy renderer mẫu. Audio trống hiển thị bản đọc, lỗi media có fallback thật.

- Success dùng wrapper `sendSuccess`; lỗi dùng `sendError`/central error handler.
- Mã thường dùng: `400` dữ liệu không hợp lệ (Zod `VALIDATION_ERROR`), `401` chưa xác thực, `403` không quyền (`PARENT_GATE_REQUIRED` / role), `404` không tồn tại, `409` trùng lặp (`DUPLICATE_KEY`), `501` tính năng chưa phát hành (`NOT_IMPLEMENTED`).
- Zod error được format trả về mảng `{ field, message }` thân thiện và an toàn.

## Contract cần giữ ổn định

### Dashboard phụ huynh — bổ sung 2026-10-09

`GET /parent/progress/:childId` giữ nguyên `child`, `overview`, `competencies`; bổ sung dữ liệu chỉ đọc sau khi xác minh ownership và Parent Gate:

- `journey.stages[]`: `id`, `order`, `title`, `totalLessons`, `completedCount`, `percentage` (làm tròn nguyên), `isCompleted`, `isUnlocked`, `requiresSubscription`, `lockReason` (`null`, `no_lessons`, `subscription`, `previous_stage`). Không trả vocabulary/đáp án của lesson trong báo cáo.
- `journey.currentStageId`: ID chặng đầu chưa hoàn thành hoặc `null`; `journey.isCompleted` chỉ đúng khi catalog không trống và mọi chặng có bài đã hoàn thành.
- `recentActivities[]`: tối đa 10 phần tử, giảm dần theo thời điểm; `id` có tiền tố loại, `kind` (`lesson`, `recording`, `story`, `culture`), `title`, `occurredAt` ISO. Bài học thêm `lessonStatus` (`in_progress`, `completed`). Không xuất URL audio hay dữ liệu bé khác.
- Bài học lấy thời điểm cập nhật progress, thu âm/khám phá lấy thời điểm tạo. Mỗi nguồn chỉ đọc tối đa 10 bản ghi trước khi trộn; nội dung đã xóa trả nhãn không còn khả dụng. Không tạo collection nhật ký mới.
- FE chấp nhận API cũ chưa có hai trường mới trong khi triển khai lệch phiên bản; các phần cũ vẫn đọc được. Lỗi tải báo cáo có retry, không hiển thị như dữ liệu trống.

### Bổ sung ngày 2026-10-08

- `PATCH /admin/redemptions/:id`: đơn đã `cancelled` không được mở lại (409); request cạnh tranh cùng đơn nhận 409. Retry cùng trạng thái hủy sau khi request trước hoàn tất không thưởng thêm. Khóa vận hành `mutationInProgress` không xuất ra response.
- `PATCH /admin/inventory/:id`: thêm `stockDelta` là số nguyên khác 0 trong [-100000, 100000], chỉ áp dụng quà hiện vật và không giảm quá stock. Không nhận đồng thời `stock` và `stockDelta` (400); không đủ tồn kho nhận 409. Giữ các field `stock`, `costPoints`, `active`, `name` cũ.
- `Story.audioUrl` có thể rỗng hoặc vắng mặt nếu chưa cung cấp audio; client phải hỗ trợ chế độ đọc, không dùng timer thay âm thanh.
- `POST /points/shop/redeem` và `PATCH /admin/inventory/:id` có thể trả 409 khi số dư hoặc kho đang bị khóa để hoàn điểm. `Child.refundLock`, `ShopItem.refundLock` chỉ dùng vận hành, không xuất ra API; client cần tải lại và retry, không coi request 409 là thành công.
- Chính sách seed, dữ liệu mẫu và giới hạn rollback xem [đối chiếu khách hàng](./08-customer-alignment.md).

- `childId` luôn phải được kiểm tra ownership thuộc về phụ huynh đang đăng nhập.
- Giao dịch điểm phải có `reason`, `delta`, `refId` và mô tả truy vết được.
- Với mutation có thể retry, server luôn đảm bảo tính idempotent.
- Không trả `passwordHash`, secret, refresh token hoặc dữ liệu admin nội bộ cho client.


