# 05 — API và data contracts baseline

Base URL: `/api/v1`.

## Sửa integrity sau audit khách hàng — 2026-10-18, local

Không thêm endpoint/payload/schema hoặc migration:

- Lesson complete: activity legacy thiếu canonical answer không được tính đúng từ `isCorrect`; sort/matching có đáp án rỗng không tự đạt. Mức đỗ và thưởng giữ nguyên. Nội dung thiếu cần biên tập CMS, không sửa snapshot tự động.
- GET/complete lesson và stage eligibility dùng paid policy strict: active true, monthly/yearly, expiresAt hợp lệ lớn hơn hiện tại. Gói thiếu field không được coi là còn hạn; quyền replay hoàn thành vẫn giữ nguyên.
- `POST /points/shop/redeem`: filter atomic cho quà ảo thêm điều kiện `ownedItemIds` chưa chứa item; yêu cầu cạnh tranh thua trả 400 đã sở hữu, không có ledger/debit thứ hai. Các lỗi insufficient funds/refund lock giữ contract cũ.
- `POST /recordings/finalize`: khi intent completed hoặc vừa bị TTL xóa, đọc lại receipt theo intent/ownership trước trả 404. Nếu receipt có thật, trả cùng 201/ID như retry bình thường; không suy diễn receipt từ trạng thái intent.
- Client record_voice nhận `audioUrl` hiện có và hiển thị `subPrompt`; không đổi context upload, ownership, version hoặc điều kiện hoàn thành.

## Hoạt động bổ sung — contract triển khai local 2026-10-09

Quyết định nghiệp vụ đã duyệt: thêm `multi_select`, `group_sort`, `fill_blanks`, `follow_steps`, không đổi bảy loại cũ hoặc công thức điểm. Canonical/model, draft/publish, grader, màn bé/session và CMS/editor/preview đã triển khai local; bằng chứng và giới hạn ở [QA](./08-customer-alignment.md). Chưa xác nhận deploy/import/publish production.

- `multi_select`: options 2–12, text được trùng; correctAnswer là mảng ID duy nhất, userAnswer phải khớp đúng tập ID, không phụ thuộc thứ tự.
- `group_sort`: groups 2–6, options 2–12; correctAnswer và userAnswer là map đúng mọi item ID tới group ID; cho phép nhiều item cùng nhóm, không nhận khóa thừa/kế thừa/prototype.
- `fill_blanks`: template tối đa 5000 ký tự dùng marker `{{slot-id}}`; 2–6 blankSlots, mỗi marker/slot đúng một lần, 1–4 acceptedAnswers/slot, mỗi đáp án tối đa 200 ký tự. userAnswer map slot→text đối chiếu NFC/trim/lowercase vi, giữ dấu, khoảng trắng nội bộ và dấu câu.
- `follow_steps`: 1–3 steps `{id,text}` có thứ tự, text tối đa 500 ký tự; userAnswer là đầy đủ step ID theo thứ tự. Chỉ ghi nhận bé tự báo cáo, không xác minh hành động ngoài đời.
- ID con mới 1–64 ASCII chữ/số/`_`/`-`, cấm `__proto__`, `prototype`, `constructor`; không áp giới hạn mới lên legacy. Nháp thiếu ngữ liệu/đáp án vẫn biên tập được nhưng publish bị chặn bằng field issues.
- Grader mới dùng đáp án canonical, malformed/missing userAnswer không đạt và không fallback `isCorrect`. Mỗi activity đạt toàn bộ hoặc không đạt, không chia trọng số từng slot/item. Không rewrite source/snapshot/live cũ hay import DB thật trong bước này.
- GET `/lessons/:id?childId=&contentVersion=&activityContract=2`: capability phải đúng chuỗi query `2`; thiếu flag chỉ đọc được snapshot bảy type cũ. Snapshot chứa type mới trả `409 ACTIVITY_CLIENT_UPDATE_REQUIRED` khi thiếu capability; giá trị flag khác trả 400. Không tự nâng contentVersion.
- Payload bé bỏ `correctAnswer` của multi/group/fill và `blankSlots[].acceptedAnswers`; canonical snapshots/admin vẫn giữ đủ dữ liệu. Grader chỉ dùng canonical, không dùng learner projection. Bảy type cũ giữ response như trước.
- Complete từ chối answers trùng activityId bằng `400 DUPLICATE_ACTIVITY_ANSWER` trước mọi ghi progress/ledger; reward vẫn một lần theo child/lesson, không theo version. Các bounds/quyền/unlock/recording trước đây không đổi.
- Client mới gửi capability2 và phản hồi trung tính cho ba câu hỏi mới; follow_steps ghi “Đã ghi xác nhận của bé”. Không trừ tim khi chưa có kết quả server; answer mới không có `isCorrect`. Type lạ hiển thị lỗi, không fallback Review.
- Session thêm `partialInputs` theo activity ID trong phiên child/lesson/version. Ghi input/answer/hearts/bước được tuần tự hóa, submitted answer bỏ partial tương ứng; clear đợi ghi đang chạy rồi xóa. Legacy session thiếu field vẫn đọc được, cached version không bị nâng ngầm. Đổi tài khoản vô hiệu hóa state đang học; lỗi lưu giữ input trên trang và có thử lưu lại. Outbox giữ nguyên typed answer và version, không tạo kết quả/điểm chính thức offline.

## CMS — lớp dữ liệu đang triển khai (2026-10-09)

Ngoại lệ khởi tạo catalog rỗng theo quyền owner không thay API hoặc bật CMS publish. Bản khởi tạo dùng contentVersion 1 và provenance riêng; [loader](../server/src/seeds/customer/bootstrapCustomer.ts) sở hữu receipt `content_bootstrap_receipts`, [vận hành CMS](./cms-operations.md#ngoại-lệ-khởi-tạo-db-mới-theo-yêu-cầu-owner) sở hữu điều kiện và recovery. Không có publishedBy giả hoặc tài khoản admin demo.

- Model nội dung bổ sung `contentVersion`, `publishedAt`, `publishedBy`; bản legacy thiếu version được hiểu là 0. Story/culture có `seedKey` và `visibility` tùy chọn, chưa đổi hành vi API đọc trong bước này.
- `ContentDraft` tách khỏi live, định danh duy nhất `{kind, contentId}` và tăng `draftVersion` khi lưu. `ContentRevision` lưu snapshot bất biến theo `{kind, contentId, contentVersion}`. Chưa bật publish hoặc chạy migration/import.
- Schema draft cho phép nội dung dở dang nhưng kiểm tra giới hạn và URL; publish kiểm tra tính khả dụng của 11 activity type, lyrics và quiz. Chi tiết ràng buộc tại thiết kế CMS và phần hoạt động bổ sung; đây chưa phải xác nhận toàn bộ CMS đã phát hành.

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
- Hoàn thiện UX CMS: dialog xác nhận/rời trang dùng native modal, nền không tương tác; focus ban đầu vào hủy/ở lại, Tab/Shift+Tab vòng trong các nút đang dùng được, Escape chỉ hủy, khi đóng trả focus về nút mở nếu còn tồn tại. Ghi chú nguồn hiển thị cạnh field/nhóm kể cả mảng trống; text/number field nối `aria-describedby`, giữ tên label. Tổng hợp đầy đủ vẫn còn phía trên để không làm mất ghi chú chưa ánh xạ; không đổi payload/API/source.

## Auth

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Tạo parent + free subscription |
| POST | `/auth/login` | Public | Nhận access token + refresh cookie |
| POST | `/auth/refresh` | Refresh cookie/body + trusted Origin | Cấp access token mới + xoay vòng (rotate) refresh token, phát hiện và ngăn chặn token reuse; trả thêm `user`, `subscription` cùng shape `/auth/me` |
| POST | `/auth/logout` | Public + trusted Origin | Thu hồi phiên refresh token / token family trên server và xóa refresh cookie |
| GET | `/auth/me` | Auth | Lấy user/subscription |
| GET | `/auth/google` | Public | Trả `clientId` public hoặc 503 `GOOGLE_NOT_CONFIGURED` |
| POST | `/auth/google/start` | Public + trusted Origin | Tạo challenge nonce dùng một lần trong cookie HttpOnly 5 phút; trả `clientId`, `nonce` |
| POST | `/auth/google` | Public + trusted Origin | Nhận Google ID token; xác minh server-side rồi cấp JWT + refresh cookie, tạo parent/free subscription; trùng email trả `{ linkRequired, email }` |
| POST | `/auth/google/link` | Public + trusted Origin | Nhận mật khẩu Vietverse để liên kết flow Google đang chờ; tối đa 5 lần thử, giữ nguyên role/subscription/dữ liệu |
| POST | `/auth/google/cancel` | Public + trusted Origin | Body `{nonce}` hủy đúng flow, không clear cookie của flow mới khác tab; cookie/bản ghi hết hạn sau 5 phút |

### Phiên, cookie và origin — 2026-10-13

- *Quyết định bảo mật (review S1)*: CORS production chỉ tin origin trong `CLIENT_ORIGIN` và danh sách tùy chọn `CLIENT_ORIGINS` (phân tách dấu phẩy, mỗi mục là origin HTTPS không path). Không còn origin cứng hay `localhost` ở production. Request có header `Origin` không thuộc allowlist nhận 403 `ORIGIN_NOT_ALLOWED`, không có `Access-Control-Allow-Origin`; request không có `Origin` (curl, webhook, server-to-server) đi tiếp. Môi trường `development` vẫn cho mọi origin để QA local; `test`/staging không phải production tin thêm `localhost:5173`/`127.0.0.1:5173`.
- `POST /auth/refresh` và `/auth/logout` từ chối 403 khi có `Origin` nhưng không thuộc allowlist; không có `Origin` thì xử lý bình thường (trình duyệt luôn gửi `Origin` cho POST, nên chỉ client không phải trình duyệt mới thiếu).
- Refresh cookie và cookie flow Google: `HttpOnly`, `SameSite=Lax`, `Path=/`, production thêm `Secure`. Giả định triển khai: trình duyệt gọi API cùng origin qua rewrite `/api/*` của FE (`VITE_API_URL` để trống hoặc `/api/v1`). Nếu FE gọi thẳng domain BE khác site thì cookie Lax không được gửi trong fetch POST, cần quyết định lại trước khi đổi.
- Google Sign-In dùng GIS callback trong trang (popup/One Tap), credential được FE gửi bằng `fetch` cùng origin nên cookie Lax vẫn đi kèm. Không dùng `ux_mode: redirect`/`login_uri` (Google POST cross-site sẽ không mang cookie Lax).
- Bootstrap khi tải lại trang: client không có access token trong bộ nhớ gọi một request `POST /auth/refresh` và dùng luôn `user`/`subscription` trả về; chỉ gọi `GET /auth/me` khi đã có token trong bộ nhớ. Response refresh: `{ accessToken, user: { id, email, displayName, role }, subscription: { plan, maxChildren, startedAt?, expiresAt? } }`, `Cache-Control: no-store`. Client cũ chỉ đọc `accessToken` vẫn tương thích.
- Access token chỉ được chấp nhận khi không có claim `aud`/`purpose` và có `id` cùng `role` hợp lệ. Token mục đích riêng ký cùng `JWT_SECRET` (Parent Gate `purpose: parent_gate`, thử thách gate, ticket ảnh CMS `aud: cms-cover-image`) không dùng được làm Bearer; access token đã phát hành trước đó vẫn hợp lệ.

Google payload: `/start` nhận `{}`; `/google` nhận strict `{credential, nonce}` (credential <= 12000 ký tự); `/link` nhận strict `{password, nonce}` (password 1..256). Nonce 64 ký tự hex. Các POST bắt buộc `Origin` thuộc `CLIENT_ORIGIN`/`CLIENT_ORIGINS` (không gồm origin local bổ sung), chịu auth rate limit và trả `Cache-Control: no-store`. ID token/mật khẩu không vào URL/localStorage.

`GoogleAuthFlow` lưu SHA256 của cookie token ngẫu nhiên, nonce, trạng thái `fresh|link`, userId/googleId khi chờ liên kết, số lần thử và expiresAt. Unique `tokenHash_1`, TTL `expiresAt_1`; server vẫn kiểm tra hạn trực tiếp. Cookie Google HttpOnly 5 phút, production Secure/SameSite=Lax/host-only prefix `__Host-`, path `/`. Collection mới không lưu ID token hoặc mật khẩu.

`User.googleId` dùng unique partial index `google_identity_unique`; thiếu index khiến `/start` trả 503 `GOOGLE_STORAGE_NOT_READY`. `deploy:indexes` bổ sung index không xóa legacy. Tạo user/free subscription và tiêu thụ challenge cùng transaction; liên kết password dùng compare-and-set cùng transaction. Replay/hết hạn trả 401 `GOOGLE_FLOW_INVALID`; token lỗi 401 `GOOGLE_TOKEN_INVALID`; mật khẩu sai 401 `GOOGLE_LINK_PASSWORD_INVALID`; liên kết xung đột 409 `GOOGLE_LINK_CONFLICT`.

## Learning và child

Quyết định tương thích 2026-10-11: `POST/PUT /children` nhận `companionLanguages` gồm 1–6 giá trị duy nhất thuộc `en/ja/ko/zh/fr/other`. Nếu gửi cả trường singular thì phải trùng phần tử đầu, không đúng trả 400. Chỉ gửi singular vẫn được chuẩn hóa thành mảng một phần tử; update không gửi hai trường thì giữ nguyên. Response đọc document legacy bổ sung mảng trong JSON, không ghi DB khi GET. Quyền/subscription/điểm không đổi.

| Method | Path | Auth | Ownership/role |
| --- | --- | --- | --- |
| GET | `/children` | Auth | Chỉ children của user |
| POST | `/children` | Auth | Body nhận `companionLanguages` (1–6 giá trị duy nhất) hoặc legacy `companionLanguage`; server lưu cả danh sách và giá trị đầu tiên để tương thích; kiểm tra subscription limit (free/monthly: 1, yearly: 3) |
| GET/PUT | `/children/:id` | Auth | `child.parentId === req.user.id` |
| DELETE | `/children/:id` | Auth | `child.parentId === req.user.id` — **Cascade Deletion**: Xóa đồng thời toàn bộ `LessonProgress`, `Recording`, `ExplorationLog`, `PointTransaction`, và `Redemption` của bé |
| PATCH | `/children/:id/select` | Auth | Ownership check |
| GET | `/stages?childId=` | Auth | Ownership khi có childId, trả trạng thái mở khóa theo điều kiện hoàn thành chặng trước + subscription |
| GET | `/lessons/:id?childId=&contentVersion=&activityContract=2` | Auth | Bắt buộc child ownership/unlock; đọc live hoặc snapshot đã xuất bản; thiếu capability chỉ đọc loại cũ |
| POST | `/lessons/:id/complete` | Auth | Child ownership; kiểm tra mở khóa, server tự chấm answers (bỏ qua client score), ghi nhận sao và thưởng ViVi Points (+10) |

## Content và recording

### Signed recording upload — triển khai local 2026-10-09, chưa cutover

QA 2026-10-12 (quyết định kỹ thuật): adapter nhận cả `error.http_code` lồng của SDK và `http_code` phẳng. Chỉ provider404 trả `UPLOAD_ASSET_NOT_FOUND` cho retry; lỗi khác vẫn503 `UPLOAD_STORAGE_UNAVAILABLE`, không xuất đối tượng SDK chứa credentials. Không đổi quyền, điểm hoặc schema.

Quyết định đã duyệt: giữ 5 MiB (`5242880` byte), dùng signed Cloudinary trực tiếp để không đưa file qua giới hạn function Vercel4,5MB. Không đổi ownership, contentVersion/unlock hoặc điểm.

- POST `/recordings/upload-intent` (JWT): JSON strict `{requestId: UUID, childId, lessonId?, activityId?, contentVersion?:number, wordOrPrompt?:string<=5000, byteLength:1..5242880, mimeType, durationSec:0..180}`. Lesson/activity phải có cùng nhau; standalone không có version. MIME chấp nhận audio/webm/mp4/ogg/mpeg/wav/x-wav và application/ogg; bỏ tham số codec trước kiểm tra. Client metadata chỉ kiểm sớm, không là bằng chứng audio thực.
- Trả201 wrapper `{intentId, expiresAt:ISO, upload:{url,fields}}`. URL cố định HTTPS Cloudinary account/video/upload; fields gồm public_id ngẫu nhiên, timestamp, overwrite=false, upload_preset signed, api_key public, signature. Không trả secret/JWT hoặc tên/ID bé trong public_id. Browser dùng fetch riêng với credentials=omit, không gửi app headers.
- Unique `{parentId,requestId}`: retry đúng context/file declaration trả cùng intent; khác payload409 `UPLOAD_INTENT_CONFLICT`; pending hết hạn409 `UPLOAD_INTENT_EXPIRED`. Không tự cấp mới khi finalize lỗi; chủ động thu/gửi lượt mới khi hết hạn.
- POST `/recordings/finalize` (JWT): JSON strict **chỉ** `{intentId:ObjectId}`. Server recheck owner/unlock/snapshot, SDK inspect đúng public_id ngoài transaction; không tin URL/bytes/duration từ browser. Audio metadata phải có codec, không có video metadata populated, format cho phép webm/mp4/m4a/ogg/mp3/wav, secure_url HTTPS đúng Cloudinary account. Bytes thực `(0,5242880]`, duration thực `(0,180]`; thiếu metadata bị từ chối. Đây là siết kiểm chứng; multipart cũ vẫn clamp duration client và không chứng minh audio bằng metadata.
- Trả201 Recording receipt `{id,_id,childId,lessonId?,activityId?,contentVersion?,url,publicId?,durationSec,wordOrPrompt?,createdAt}`. Không xuất uploadIntentId/state/fingerprint. Receipt và Recording cùng transaction, unique sparse `Recording.uploadIntentId`; retry/concurrent trả cùng ID, completed hết hạn vẫn trả receipt. Sau intent TTL, receipt tra từ Recording và kiểm ownership bé. Chỉ receipt mới được dùng làm answer.
- Lỗi: schema/context400; auth401; không sở hữu/context không tồn tại404; asset chưa có404 `UPLOAD_ASSET_NOT_FOUND` (chỉ mã này cho phép reupload sau upload response không rõ); intent conflict/expired409; asset quá size413 `UPLOAD_TOO_LARGE`; metadata/video/duration422 `UPLOAD_AUDIO_INVALID`; storage503 `UPLOAD_STORAGE_UNAVAILABLE`; DB503 `DATABASE_UNAVAILABLE`. Không lỗi nào cấp điểm hoặc hoàn thành activity.
- `RecordingUploadIntent`: parent/request/fingerprint, context, publicId/timestamp, pending/completed, recordingId, expiresAt10 phút, deleteAt7 ngày; TTL deleteAt và unique parent/request. `RateLimitBucket`: string `_id=scope:digestIP`, hits, resetAt; TTL resetAt, reset atomic không chờ TTL. `Recording.uploadIntentId` unique sparse/select:false cho bản direct, legacy không có field.
- DELETE bé: Child và các collections phụ thuộc, thêm RecordingUploadIntent, được cascade tuần tự trong Mongo transaction; finalize/legacy ghi Child.__v để tranh chấp với delete. Failure503 rollback DB. Không xóa Cloudinary trong transaction; xem debt retention/runbook. Không mở quyền đọc audio.

**Cập nhật 2026-10-13 (review sau khi chuyển backend sang Vercel):**
- Finalize đồng thời: request đầu giành intent (`pending → finalizing`, lease 45 s); request khác chờ có jitter (tối đa 15 s) rồi trả **cùng receipt**. Quá thời gian chờ trả `409 UPLOAD_FINALIZE_IN_PROGRESS` (không còn 503). Mọi nhánh lỗi tra receipt theo intent trước khi ném lỗi; lỗi inspect/nghiệp vụ trả intent về `pending`.
- Inspect khoan dung với file thiếu duration (WebM của Chrome): nhận nếu có codec audio, format hợp lệ, ≤ 5 MiB; lưu `durationSec = 0`. Luồng video placeholder chỉ coi là audio khi provider đánh dấu `is_audio`. Vẫn từ chối video thật, quá cỡ, duration > 180.
- Cloudinary giới hạn tần suất (HTTP 420/429) trả `503 UPLOAD_STORAGE_RATE_LIMITED` kèm `Retry-After`.
- `POST /recordings/upload-intent` có limiter riêng theo tài khoản: 10/phút, 200/ngày (`429`). Chữ ký upload hết hiệu lực sau khoảng 15 phút.
- `RecordingUploadIntent`: thêm trạng thái `finalizing` (+ `claimToken`, lease); intent chưa hoàn tất giữ 30 ngày, đã hoàn tất giữ 7 ngày kể từ lúc hoàn tất (để đối soát asset mồ côi).
- DELETE bé: sau commit, xóa asset audio trên Cloudinary (`invalidate: true`, đúng `resource_type`); lỗi provider ghi vào collection mới `AudioCleanupTask` (status `pending`) để xử lý lại, không làm hỏng thao tác xóa. `Recording.resourceType` mới lưu loại asset cho bản legacy.
- `GET /recordings/children/:childId`: tối đa 200 bản mới nhất, shape không đổi.
- `/health`200 liveness; `/ready`200 ping DB hoặc503 `DATABASE_UNAVAILABLE`. API production rate limit shared Mongo auth30/15m/API120/m, store lỗi503 `RATE_LIMIT_UNAVAILABLE`.

Giả định môi trường chưa xác minh: preset/metadata provider thực, IP qua rewrite, replica set/network/transaction, native build, cookie auth và webhook. Multipart legacy chỉ dùng local/Render/client cũ; không hứa file5MiB qua endpoint này trên Vercel.

### Signed CMS cover-image upload — 2026-10-12

Quyết định nghiệp vụ: chỉ admin được tải ảnh bìa cho story/đồng dao và culture; upload chỉ cập nhật form nháp sau khi xác minh, không tự lưu nháp, publish, điểm hoặc tiến độ. Đây là cấu hình tách biệt với upload audio.

- `POST /admin/content-images/intent` (JWT + admin): body strict `{kind:'story'|'culture', contentId:ObjectId, draftVersion:positive integer, bytes:1..5242880, mimeType:'image/jpeg'|'image/png'|'image/webp', requestId:UUID}`. Server recheck User role và `ContentDraft` đang `editing` đúng version, rồi trả `201 {ticket, upload:{url,fields}}`.
- Upload URL cố định HTTPS tới Cloudinary image account; fields gồm public ID dẫn xuất không chứa dữ liệu người dùng, timestamp, `overwrite=false`, signed image preset, public API key và signature. Browser dùng client HTTP riêng với `credentials=omit`, không gửi app headers/cookies.
- `POST /admin/content-images/finalize` (JWT + admin): JSON strict `{ticket}`. Ticket có audience/purpose, admin, kind/id/version và hết hạn sau 10 phút. Server đọc resource provider theo public ID rồi kiểm tra resource type/upload, HTTPS đúng account, format JPG/PNG/WebP, bytes thực `1..5242880`, width/height hợp lệ, tối đa 40 MP và không phải ảnh nhiều trang.
- Trả `200 {publicId,url,bytes,width,height}` với URL delivery `c_limit,w_1920,h_1920/f_auto,q_auto`. Finalize idempotent khi asset đã tồn tại; lỗi asset chưa có là `404 IMAGE_ASSET_NOT_FOUND`, quá cỡ `413 IMAGE_TOO_LARGE`, metadata không hợp lệ `422 IMAGE_INVALID`, storage/provider lỗi `503 IMAGE_STORAGE_UNAVAILABLE`.
- Upload không ghi `ContentDraft`; admin phải dùng CMS save draft để persist và publish riêng. Provider max-file-size nếu preset không hiển thị không được coi là gate; client/backend vẫn là rào cứng 5 MiB.

Bổ sung review2026-10-10 (quyết định kỹ thuật, không đổi điểm/quyền): cấp/reuse intent cũng ghi Child.__v trong transaction để phối hợp cascade. FE giữ Blob, hết hạn chỉ đổi requestId sau nút **Gửi lại bằng lượt mới**; không tự renew hoặc bypass404/503. Timer elapsed monotonic, auto-stop179s margin1s, dừng khi trang ẩn/pagehide; main thread bị khóa có thể overshoot, báo lỗi và không coi take đó hợp lệ; server vẫn giới hạn180s. Legacy Cloudinary UUID ngẫu nhiên/overwrite=false; Recording ID ổn định để reconcile commit mất ACK. DB503 hoặc kết quả commit không rõ không xóa provider asset, để đối soát thủ công; definite4xx business rejection mới compensation. Không bảo đảm legacy HTTP retry giữa hai request idempotent như direct intent.

| Method | Path | Auth | Mục đích |
| --- | --- | --- | --- |
| GET | `/stories`, `/stories/:id` | Public | Đọc story (query `type`, `search` được escape regex và cắt tối đa 50 ký tự; limit 100) |
| POST | `/stories/:id/explored` | Auth | Ghi exploration cho child (idempotent qua unique index `{childId, kind, refId}`) |
| GET | `/culture`, `/culture/:id` | Public | Đọc bài văn hóa (query `category`, `search` được escape regex; limit 100) |
| POST | `/culture/:id/quiz` | Auth | Chấm quiz và thưởng (+5 points idempotent, rollback tự động nếu lỗi) |
| POST | `/recordings` | Auth + multipart | **Legacy.** Production mặc định tắt (`410 LEGACY_RECORDING_UPLOAD_DISABLED`, bật lại bằng `LEGACY_RECORDING_UPLOAD_ENABLED=true`); dev/test bật. Upload file âm thanh bé đọc (`audio/*`, `application/ogg`; max 5MB; duration capped 180s; Dev/Test fallback Base64 <= 2MB) |
| GET | `/recordings/children/:childId` | Auth | Parent ownership; tối đa 200 bản mới nhất |

## Subscription và thanh toán

### Xác nhận webhook — 2026-10-14

- **Quyết định kỹ thuật:** PayOS gửi giao dịch mẫu khi kiểm tra/đăng ký webhook ([API chính thức](https://payos.vn/docs/api/)); mẫu không cần có đơn nội bộ. Sau schema và SDK verify, nếu cả `PaymentTestOrder` và `PaymentOrder` không có mã tương ứng, trả `200 { success: true, data: { ignored: true, reason: 'ORDER_NOT_FOUND' } }`. Không tạo/cập nhật đơn hoặc subscription; request lặp cũng không ghi dữ liệu.
- ACK này áp dụng cả webhook đã xác thực của đơn lạ, không chỉ hardcode `orderCode=123`. Log warning `event=payos_webhook_ignored`, `reason=ORDER_NOT_FOUND`, mã `VV...`; không log body, signature, key hoặc tài khoản ngân hàng. Operator phải đối soát cảnh báo không phải request mẫu vì 200 kết thúc lần giao, không trông chờ PayOS retry. Nếu DB đọc lỗi vẫn trả lỗi, không ACK giả.
- Sai schema giữ `400 VALIDATION_ERROR`; sai chữ ký trả `400 PAYOS_INVALID_SIGNATURE`; số tiền không khớp đơn thật/test trả `400 PAYOS_AMOUNT_MISMATCH`. Status/message cũ giữ nguyên, mã lỗi thay cho `INTERNAL_ERROR`. Nhánh xử lý đơn thật/test, transaction và idempotency không đổi.
- **Giả định cần nghiệm thu:** dữ liệu xác nhận thực tế của kênh tuân theo contract công khai và được ký bằng `PAYOS_CHECKSUM_KEY` của kênh đó. Chưa có payload/log request thật; generic 400 trên portal không đủ để kết luận chỉ do đơn mẫu. Không bypass chữ ký nếu key sai.

### Cấu hình PayOS và URL quay về — 2026-10-13

- **Quyết định triển khai:** giữ giá và quyền gói hiện tại; `returnUrl`/`cancelUrl` của checkout mua gói chủ động chứa `orderCode=VV...` và `payment=returned`. Mã đơn chỉ để tra cứu với ownership; query trả về không chứng minh thanh toán, không đổi trạng thái đơn hay subscription.
- Key local điền trong `server/.env` (git-ignore): `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`. File mẫu chỉ để trống; không đặt secret ở client hoặc biến `VITE_*`.
- Local `.env` không tự đồng bộ lên production. Cần đặt đủ ba biến trong môi trường backend đang phục vụ domain rồi restart/redeploy. Với Docker self-host theo runbook, dùng file `.env` vận hành cạnh `compose.yml`, không phải `app/server/.env`; recreate container API để nạp biến mới (chỉ restart container không cập nhật environment).
- Webhook của domain `vietverse.io.vn` là `https://vietverse.io.vn/api/v1/payments/webhook`, nhận **POST**. Không nhập trang chủ `/` (có thể trả 405), không dùng URL kết quả `/thanh-toan`, không dùng localhost cho callback từ PayOS.
- **Giới hạn nghiệm thu:** 400 có thể là schema hoặc chữ ký không hợp lệ, cần response/log của request thực tế để phân biệt; không bỏ xác minh chữ ký để lưu webhook. 503 với thông báo PayOS chưa cấu hình nghĩa là process backend chưa nạp bộ key. MongoDB phải hỗ trợ transaction. Chỉ kiểm thử giao dịch tiền thật sau khi owner chủ động đồng ý; kiểm thử tự động dùng SDK mock và MongoDB replica set tạm.

| Method | Path | Auth | Mục đích / ràng buộc |
| --- | --- | --- | --- |
| POST | `/payments/create-checkout` | Auth | Body `{ planType: 'monthly' | 'yearly' }`; server chọn giá 250.000đ/990.000đ cho đơn mới (feedback 2026-10-12) và trả `orderCode`, `checkoutUrl`; không cấu hình PayOS thì trả 503; webhook vẫn đối chiếu amount đã lưu của đơn, không tính lại giá đơn cũ |
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
| GET | `/points/children/:childId` | Auth | Số dư `viviPoints`, `totalEarned` (tổng delta > 0, không tính `refund`; **chỉ có ở trang đầu**, trang có `before` không trả trường này — từ 2026-10-13), `history` và `nextCursor`. Phân trang `?before=<ISO createdAt>&limit=1..50` (mặc định 20; trước 2026-10-09 là 100). Giao dịch trùng timestamp ở biên trang được trả chung trang. Sai tham số trả 400 `VALIDATION_ERROR` |
| GET | `/points/children/:childId/collection` | Auth + ownership | `ownedItems[]` (kể cả món đã ẩn khỏi shop), `equippedAvatarItemId`, `profileDecorationId` |
| PATCH | `/points/children/:childId/equip` | Auth + ownership | Body `{ slot, itemId }`: `slot` là `avatar` hoặc `profile_decoration`, `itemId` là ObjectId hoặc `null` (bỏ dùng). 404 bé/item không tồn tại, 403 `ITEM_NOT_OWNED`, 400 `ITEM_CATEGORY_MISMATCH`. Response giống `/collection` |
| POST | `/points/shop/redeem` | Auth | Trừ điểm nguyên tử, trừ stock quà vật lý, chặn mua lặp quà ảo, tạo redemption kèm rollback bù nếu thất bại |
| GET | `/parent/gate/challenge` | Auth | Cấp thử thách phép toán + `challengeToken` ngắn hạn (5m) |
| POST | `/parent/gate/verify` | Auth | Đối chiếu kết quả toán / PIN `1234`, cấp `gateToken` (15m) |
| GET | `/parent/progress/:childId` | Auth + Gate Token | Dashboard 4 trụ cột năng lực (bắt buộc header `X-Parent-Gate-Token`) |
| PATCH | `/parent/screen-time` | Auth + Gate Token | Cập nhật giới hạn phiên màn hình (15, 20, 30 phút hoặc 0) (bắt buộc `X-Parent-Gate-Token`) |
| GET | `/admin/kpi` | Admin | Thống kê số lượng users, children, lessons completed, redemptions, v.v. |
| GET | `/admin/learners` | Admin | Danh sách 100 học viên gần nhất |
| GET | `/admin/redemptions` | Admin | Danh sách 100 đơn đổi quà gần nhất |
| PATCH | `/admin/redemptions/:id` | Admin | Cập nhật đơn qua `updateRedemptionSchema` (`status`: 'pending'\|'shipped'\|'delivered', `trackingCode`, `carrier`, `notes`) |
| GET | `/admin/inventory` | Admin | Danh sách vật phẩm, gồm `category` |
| POST | `/admin/inventory` | Admin | Tạo vật phẩm `{ name, type, category?, costPoints, assetUrl, description?, badgeCode?, stock?, active? }`; vật phẩm ảo bắt buộc `category`, không nhận `stock`; quà hiện vật mặc định stock 0. `assetUrl` chỉ nhận HTTPS, path `/...` hoặc `data:image/...` (≤ 20000 ký tự). Trả 201, audit `create_inventory` |
| PATCH | `/admin/inventory/:id` | Admin | Sửa tồn kho/trạng thái và `category`, `description`, `assetUrl`; audit `update_inventory` |
| GET | `/admin/point-rules` | Admin | 5 quy tắc `LESSON_COMPLETE, ACTIVITY_COMPLETE, CULTURE_QUIZ, STAGE_COMPLETE, LESSON_20_TREASURE` với `{ key, amount, active, defaultAmount, customized, updatedAt }` |
| PATCH | `/admin/point-rules/:key` | Admin | Body strict `{ amount?: 0..1000, active?: boolean }` (ít nhất 1 trường). 404 `POINT_RULE_NOT_FOUND`, 400 dữ liệu sai; audit `update_point_rule` (previous/next) |
| GET | `/admin/revenue` | Admin | Báo cáo chỉ đọc doanh thu gói học từ `PaymentOrder.status=completed`; query tùy chọn `from/to=YYYY-MM-DD` theo múi giờ Việt Nam, loại `PaymentTestOrder`, trả tổng kỳ, tháng hiện tại, theo gói và theo tháng |
| GET | `/admin/lessons` | Admin | Danh sách tất cả bài học kèm populate stage |
| POST | `/admin/lessons` | Admin | Ngừng ghi live; payload hợp lệ trả 409 `CONTENT_CMS_REQUIRED` |
| PUT | `/admin/lessons/:id` | Admin | Ngừng ghi live; dùng luồng draft/publish CMS |

Từ 2026-10-13 (review): `totalRevenue`, `paidOrders`, `byPlan` và `series` dùng cùng bộ lọc, chỉ tính đơn completed có `paidAt` kiểu ngày, nên `totalRevenue = Σ series.revenue`; đơn thiếu `paidAt` chỉ hiện ở `undatedOrders` để đối soát. Câu "Tổng toàn thời gian gồm đơn completed thiếu `paidAt`" phía dưới là hành vi cũ.

Revenue response: `{ currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', from: string|null, to: string|null, totalRevenue, paidOrders, currentMonth: 'YYYY-MM', currentMonthRevenue, undatedOrders, byPlan: { monthly: { orders, revenue }, yearly: { orders, revenue } }, series: [{ month: 'YYYY-MM', orders, revenue }] }`. `totalRevenue`, `paidOrders`, `byPlan`, `series` dùng khoảng được chọn, mặc định toàn thời gian; tháng hiện tại và số đơn thiếu ngày thanh toán là toàn hệ thống, không theo bộ lọc. `series` tăng dần, chỉ có tháng phát sinh đơn. Tổng toàn thời gian gồm đơn completed thiếu `paidAt`; lọc ngày/bảng tháng loại các đơn đó và UI cảnh báo đối soát. Ngày sai, khoảng đảo, query lặp/khóa lạ trả 400. JWT/admin và role DB được kiểm tra; thu hồi quyền trả 403, response `Cache-Control: no-store`. Không trả dữ liệu khách hàng, link checkout hay thông tin giao dịch riêng lẻ; không sửa payment/subscription hoặc gọi PayOS. Giới hạn truy vấn DB 10 giây; lỗi tải phải hiện retry, không giả doanh thu 0.
### Data ViVi Points và vật phẩm — 2026-10-09

- `PointTransaction.reason` thêm `activity` (`refId = <lessonId>:<activityId>`) và `use_reward` (dành sẵn, chưa có luồng ghi). `POST` nộp bài trả `pointsEarned` gồm cả điểm hoạt động.
- Partial unique index `{ childId, reason, refId }` đổi sang `reason: { $in: [lesson, activity, culture_quiz, stage_complete, treasure] }`. Bản cũ dùng `$nin` nên MongoDB chưa bao giờ tạo được index (xem 06). Yêu cầu MongoDB ≥ 6.0. Thêm index `{ childId: 1, createdAt: -1 }`.
- `PointRule { key (unique, 5 giá trị), amount 0..1000, active, timestamps }`; thiếu bản ghi thì dùng mặc định trong `POINT_RULES`.
- `ShopItem.category`: `badge | avatar | profile_decoration | collectible`, bắt buộc với vật phẩm ảo. Lệnh `npm run migrate:shop-category -w server` (dry-run mặc định, `-- --apply` để ghi): ảo có `badgeCode` → `badge`, còn lại → `collectible`, không ghi đè loại đã có.
- `Child.equippedAvatarItemId`, `Child.profileDecorationId` (ref ShopItem); `avatarId` onboarding giữ nguyên.

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

### Sửa lỗi sau review — 2026-10-12, local

- `PUT /children/:id` không còn nhận `screenTimeLimit`: Zod loại bỏ trường này như các trường lạ, không đổi giới hạn và không trả 403 chỉ vì payload có trường đó. Thay đổi hợp lệ dùng `PATCH /parent/screen-time` với Parent Gate và các giá trị `0/15/20/30`.
- `POST /children` khóa ghi `User.__v` trước khi đọc quota trong cùng transaction tạo bé; không thêm field quota hoặc migration schema. Hết quota vẫn 403; lỗi transaction trả 503 `DATABASE_UNAVAILABLE`.
- `POST /lessons/:id/complete` giữ payload/response; tất cả đọc trạng thái bài/phiên bản/quyền và ghi progress/ledger/balance dùng cùng session. Khóa ghi `Child.__v` trước đọc progress, phối hợp với cascade delete; giữ điểm/sao cao nhất và không hạ `completed`. Cần MongoDB replica set hỗ trợ transaction; lỗi DB trả 503 `DATABASE_UNAVAILABLE`, không fallback ghi từng phần trên standalone.
- `passed`, `scorePercent`, `stars` trong response mô tả lượt nộp hiện tại; `progress` giữ thành tích cao nhất. FE phân biệt chưa đạt với hoàn thành, không xóa phiên chưa đạt cho tới khi bé chủ động luyện lại. Không backfill thưởng bị mất ở dữ liệu cũ.
- Quiz văn hóa tiếp tục trả HTTP 200 cả khi sai; FE phải đọc `isAllCorrect`, `correctCount`, `totalQuestions`, không suy diễn kết quả từ `pointsEarned`.
- Xác nhận mật khẩu đăng ký vẫn là validation FE; Google Sign-In đã có route xác minh ID token và liên kết có xác nhận mật khẩu Vietverse. Khi thiếu `GOOGLE_CLIENT_ID`, server trả lỗi cấu hình rõ ràng và giữ luồng email hoạt động.
- HTTP logger che cả request `x-parent-gate-token` và response `set-cookie`, ngoài authorization/cookie đã có. Bản sửa không xóa log lịch sử hoặc tự thu hồi phiên.

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

### Bản dịch nội dung theo ngôn ngữ hỗ trợ — 2026-10-17

- Model `Story` và `CultureArticle` có thêm trường `translations` tùy chọn: một object khóa theo ngôn ngữ hỗ trợ (`en`, `ja`, `ko`, `zh`, `fr` — đúng tập `companionLanguages` trừ `other`). Culture mỗi ngôn ngữ chứa `{ title?, intro?, funFacts?[] }`; story chứa `{ title?, description?, lyrics?[], vocab?[] }`. Các mảng song song theo index với bản tiếng Việt; phần tử trống hoặc thiếu thì ẩn. Document legacy không có trường này thì trường vắng mặt trong payload (không phải `{}`), nên **không cần migration bắt buộc** và dữ liệu cũ vẫn chạy.
- API đọc công khai `GET /stories/:id`, `GET /culture/:id` (và danh sách) trả kèm `translations`. Tiếng Việt vẫn là nội dung chính; bản dịch không thay đổi quiz, chấm điểm, exploration hay thưởng. Draft schema chấp nhận `translations`, giới hạn kích thước mảng như nguồn (`funFacts` ≤ 50, `lyrics` ≤ 500, `vocab` ≤ 100) và văn bản ≤ 5000 ký tự; khóa ngôn ngữ ngoài tập hỗ trợ (kể cả `other`) bị từ chối. `validatePublish` **không** bắt buộc phải có bản dịch — nội dung thiếu bản dịch vẫn xuất bản bình thường.
- CMS `/admin/truyen` và `/admin/van-hoa` có khối "Bản dịch theo ngôn ngữ hỗ trợ" thu gọn/mở rộng theo từng ngôn ngữ (`<details>`); lưu nháp và xem trước được, không khối nào chặn publish.
- Khu bé hiển thị bản dịch ngay dưới đoạn tiếng Việt theo ngôn ngữ hỗ trợ **đầu tiên có bản dịch** trong `companionLanguages` của hồ sơ bé đang chọn (`other` bị bỏ qua), chữ nhỏ hơn, màu phụ, kèm thuộc tính `lang` đúng. Không có hồ sơ bé hoặc không ngôn ngữ nào có bản dịch thì ẩn hoàn toàn.
- *Giả định chờ duyệt (ghi cho owner/content owner)*: bản dịch tiếng Anh trong seed demo là **bản nháp chưa duyệt**, chỉ phục vụ xem thử; content owner cần duyệt văn bản và bản quyền trước khi phát hành. Không có migration ghi bản dịch lên production trong thay đổi này.

- `childId` luôn phải được kiểm tra ownership thuộc về phụ huynh đang đăng nhập.
- Migration `child-companion-languages-v1` chỉ backfill document còn trường singular hợp lệ, lưu preimage trong `child_language_migration_preimages`, chạy cùng transaction với bootstrap catalog và có receipt để retry an toàn; không tự suy đoán document thiếu cả hai trường.
- Preimage chỉ giữ ID bé, ngôn ngữ cũ và thời điểm, không xuất ra API. Xóa hồ sơ cũng xóa preimage trong cùng cascade transaction.
- Giao dịch điểm phải có `reason`, `delta`, `refId` và mô tả truy vết được.
- Với mutation có thể retry, server luôn đảm bảo tính idempotent.
- Không trả `passwordHash`, secret, refresh token hoặc dữ liệu admin nội bộ cho client.


