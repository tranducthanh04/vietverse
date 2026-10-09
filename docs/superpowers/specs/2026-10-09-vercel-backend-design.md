# Chuyển backend Vietverse từ Render sang Vercel

Ngày: 2026-10-09, Asia/Saigon.

Trạng thái: hướng triển khai và upload trực tiếp đã được người dùng đồng ý trong chat; bản thiết kế chi tiết này đang chờ duyệt. Chưa sửa code ứng dụng, tạo project Vercel, đổi proxy production hoặc thao tác database thật.

## 1. Mục tiêu và phạm vi

Đưa Express backend lên một project Vercel riêng, frontend vẫn ở project Vercel hiện tại. Giữ MongoDB và dữ liệu hiện hữu, đường dẫn `/api/v1`, quyền truy cập, cách chấm bài, điểm, subscription và CMS contentVersion.

Thành công là backend chạy được trên Vercel, FE đăng nhập/refresh/reload được qua proxy cùng origin, thu âm đủ giới hạn hiện hành được lưu và xác minh đúng, webhook PayOS giữ chữ ký/idempotency, có cách quay về Render.

Không viết lại backend sang Next.js; không seed, import nội dung, bật CMS publish, đổi giá/gói/điểm, chạy giao dịch tiền thật hoặc xóa dịch vụ Render trong phạm vi này.

## 2. Quyết định đã duyệt và đề xuất kỹ thuật

**Đã được người dùng chọn:** project Vercel riêng cho BE; giữ database hiện tại; upload trực tiếp có chữ ký lên Cloudinary thay vì hạ giới hạn 5 MB xuống 4 MB. Render được giữ để rollback sau khi nghiệm thu.

**Nghiệp vụ giữ nguyên:** chỉ bản Recording đã lưu đúng bé/bài/activity/contentVersion mới dùng làm đáp án; upload Cloudinary thành công riêng lẻ không cấp điểm hoặc hoàn thành bài. Ownership và unlock vẫn được kiểm tra ở server. Giới hạn file hiện hữu được hiểu đúng theo code: `5 * 1024 * 1024` byte.

**Đề xuất kỹ thuật chờ duyệt:** cache kết nối MongoDB, signed upload intent trong MongoDB, xác minh metadata Cloudinary ở server, rate limit dùng store MongoDB chung, rollout BE trước FE. Không thêm Redis hay dịch vụ tính phí khác.

**Giả định cần chứng minh khi deploy:** database hiện tại truy cập được từ Vercel và là replica set; Cloudinary hỗ trợ signed preset và metadata audio cần dùng; người phụ trách có quyền cấu hình project/env/network/webhook. Domain BE thật và credentials không có trong tài liệu, phải lấy từ deployment thực tế, không tự bịa hoặc commit secret.

## 3. Runtime Vercel và kết nối database

- Root Directory project BE: `server`; dùng hỗ trợ Express native của Vercel và runtime Node được Vercel hỗ trợ, tương thích dependency hiện hữu.
- Entrypoint dự kiến `server/src/index.ts`, default export Express app/wrapper dùng chung app và routes. Giữ `src/server.ts` cho local/Render; không gọi `listen` hoặc `process.exit` trong handler serverless.
- Kiểm chứng entrypoint bằng Vercel build trước khi chốt config; không dùng đồng thời native detection và legacy `builds`/catch-all gây cạnh tranh route.
- Kết nối MongoDB trước API cần DB. Cache promise đang kết nối để các request đồng thời trong cùng instance không tạo nhiều pool. Kết nối lỗi phải bỏ promise lỗi để request sau có thể thử lại. Không disconnect sau mỗi request.
- Pool giới hạn theo instance để giảm áp lực Atlas; chọn `maxPoolSize: 5`, `minPoolSize: 0` và giữ selection timeout 5 giây làm baseline, đo lại khi nghiệm thu. Đây không phải bảo đảm chịu tải production.
- `/health` tiếp tục là liveness; thêm `/ready` kiểm tra kết nối DB và trả 503 khi chưa sẵn sàng. Health không được quảng bá như bằng chứng transaction, Cloudinary hay PayOS đã hoạt động.
- Lỗi DB trả wrapper lỗi an toàn, không log URI có credentials. Native bcrypt và import ESM `.js` từ nguồn TypeScript phải qua build/runtime smoke, không chỉ typecheck.

## 4. API upload trực tiếp và vòng đời Recording

### 4.1. Cấp intent: `POST /api/v1/recordings/upload-intent`

Yêu cầu auth. Nhận `requestId` UUID ổn định cho một bản thu, `childId`, cặp `lessonId`/`activityId` tùy chọn, `contentVersion`, `wordOrPrompt`, `byteLength`, `mimeType` và `durationSec`.

Server dùng schema kiểm tra field/bounds, xác minh child ownership, lesson unlock và đúng activity `record_voice` của snapshot. Không có lesson/activity thì giữ hỗ trợ bản thu độc lập; không nhận contentVersion cho bản thu độc lập. `byteLength` và MIME từ client chỉ là kiểm tra sớm, không là chứng cứ về file thực tế.

Server sinh public ID ngẫu nhiên không chứa tên bé, email hoặc prompt. Ghi intent duy nhất theo `{parentId, requestId}` trước khi cấp chữ ký; payload khác với cùng requestId trả 409. Intent giữ context bất biến, public ID, thời hạn, trạng thái và recording ID receipt. Retry cùng context trước khi hết hạn trả cùng intent; sau khi hết hạn chỉ cấp lại bằng requestId mới, không mở lại intent đã hết hạn.

Trả upload URL HTTPS cố định của Cloudinary account cấu hình, public API key, timestamp, signature và danh sách upload fields được server ký. Không trả API secret, JWT nội bộ hoặc cho client chọn cloud/folder/public ID/preset/resource type. Upload dùng `resource_type=video` cho audio, `overwrite=false`, public ID cố định và signed preset có giới hạn kích thước/định dạng. Phải xác minh upload preset thật trước production; preset không phải bảo đảm audio-only.

Intent cho phép finalize trong 10 phút. Cloudinary có thời hạn chữ ký riêng; thời hạn intent không được mô tả như khả năng thu hồi sớm chữ ký phía provider. Signed preset, quota và rate limit vẫn cần thiết để giảm upload không được finalize.

### 4.2. Browser upload

FE giữ nguyên Blob và context tài khoản/bé/bài/version từ khi bắt đầu gửi. Kiểm tra kích thước trước upload, gửi multipart trực tiếp tới upload URL bằng client HTTP riêng, tuyệt đối không dùng instance Axios có Bearer/Parent Gate/refresh interceptor của Vietverse.

Không gửi cookie ứng dụng tới Cloudinary. Chỉ nhận response upload để biết đã gửi file; URL/bytes/duration trong response FE không được server tin. Nếu account/child/session thay đổi trong lúc gửi, không cập nhật trạng thái hoặc hoàn thành activity của phiên mới.

### 4.3. Finalize: `POST /api/v1/recordings/finalize`

Yêu cầu auth; body chỉ nhận `intentId`. Intent phải thuộc user hiện tại. Server kiểm tra lại ownership, unlock và snapshot vì quyền/context có thể đã thay đổi sau cấp chữ ký.

Server gọi Cloudinary bằng credentials server để đọc đúng asset tại public ID của intent, không tải URL do client cung cấp. Xác minh resource type, public ID, bytes trong `(0, 5 * 1024 * 1024]`, định dạng audio cho phép, metadata có audio stream và không có video stream. Audio container `webm`/`mp4` không tự chứng minh là audio-only. Thiếu metadata cần thiết phải từ chối, không fallback sang thông tin client.

Duration lưu theo metadata provider, tối đa 180 giây theo contract hiện tại; bản mới dài hơn 180 giây bị từ chối thay vì chỉ clamp thời lượng do client tự báo. Đây là siết kiểm chứng giới hạn hiện hành và cần ghi rõ trong docs API khi triển khai. FE dừng thu ở 180 giây và vẫn giữ file khi upload/finalize lỗi.

Recording nhận URL/public ID chỉ từ kết quả server xác minh. Tạo Recording và ghi receipt finalize intent trong cùng MongoDB transaction. Thêm unique sparse index `Recording.uploadIntentId`; request finalize đồng thời hoặc retry sau mất response trả cùng Recording, không tạo bản thứ hai. Intent completed trả receipt ngay cả sau hạn finalize; hết hạn chỉ chặn intent chưa hoàn tất. Ownership của bé vẫn cần kiểm tra trước receipt để không đọc bản thu sau khi bé bị xóa.

Response giữ wrapper và các field Recording hiện hữu, gồm `id`; không trả state nội bộ intent. Chỉ sau response này FE mới chuyển ID sang `RecordVoiceActivity.onComplete`. Không sửa khóa thưởng của lesson và không cấp điểm ở endpoint upload/finalize.

### 4.4. Lỗi, retry và retention

- 400: schema/MIME/context không hợp lệ; 401: thiếu auth; 404: không sở hữu hoặc context/asset không tồn tại; 409: requestId khác context hoặc intent chưa completed đã hết hạn; 413: file quá giới hạn; 422: asset không phải audio hợp lệ hoặc vượt thời lượng; 503: storage/DB chưa sẵn sàng.
- Lỗi mạng khi gửi file giữ Blob. Upload thành công nhưng finalize lỗi thì retry finalize cùng intent, không upload lại file hoặc cấp requestId mới một cách tự động.
- Khi intent hết hạn, thông báo và cho người dùng gửi lại bằng intent mới; không báo hoàn thành giả.
- Ghi index TTL cho intent sau 7 ngày để giữ receipt đủ cho retry; receipt của Recording vẫn tra được qua unique uploadIntentId sau TTL. Pending intent hết hạn chưa xóa ngay để vận hành đối soát asset.
- Giữ endpoint multipart `POST /recordings` cho local/Render và client cũ trong cửa sổ chuyển đổi. Không hứa endpoint cũ hỗ trợ 5 MB trên Vercel: payload vượt 4,5 MB bị nền tảng chặn trước Express. Để giảm rủi ro cửa sổ này, FE dùng luồng mới trên Render trước khi đổi proxy BE sang Vercel.
- Asset bị từ chối hoặc upload rồi bỏ dở có thể thành orphan. Không chạy background cleanup trong request serverless. Runbook yêu cầu đối soát intent/Recording và chỉ xóa asset orphan đã xác nhận; không coi TTL database là xóa asset Cloudinary.
- Xóa child phải thu hồi/xóa intent của child và ngăn finalize mới sau xóa. Hoàn tất finalize và xóa child cần cùng boundary phối hợp để không tạo Recording mồ côi. Giữ quyền đọc recording hiện hữu; không mở rộng quyền public trong đợt này. Kiểm tra cơ chế xóa asset Cloudinary hiện tại và ghi rõ debt nếu không xóa vật lý được; không tuyên bố đã giải quyết toàn bộ retention.

## 5. Rate limit chia sẻ giữa các instance

Giữ mức auth 30 request/15 phút và API 120 request/phút, nhưng store không còn chỉ là RAM. Production dùng MongoDB: key theo scope và IP đã chuẩn hóa/băm, counter và resetAt; tăng counter atomic, unique key và TTL cleanup. Khi window hết hạn, reset theo điều kiện atomic, không dựa vào tốc độ TTL xóa record.

Các instance dùng cùng store. Key không chứa raw IP trong log. Không thay auth limiter bằng user ID vì login còn public. Định nghĩa cửa sổ là thời gian tính từ lần request đầu của một key sau reset, không đổi sang bucket đồng hồ làm tăng burst ở ranh giới.

Trust proxy phải kiểm chứng qua đường gọi trực tiếp BE và qua FE Vercel rewrite. Chỉ lấy IP qua chuỗi proxy/header do nền tảng tin cậy cung cấp; không tin tùy ý X-Forwarded-For client gửi hoặc đặt `trust proxy=true`. Nghiệm thu phải chứng minh hai client không bị gom nhầm và giả header không né limit.

Store lỗi trả 503, không âm thầm tắt bảo vệ production; log lỗi không lộ IP/secret. Local/test có thể dùng memory store hiện hữu hoặc MongoDB test store khi chạy integration. Indexes phải sẵn sàng trước mở traffic, không gọi `syncIndexes` phá indexes cũ.

## 6. FE proxy, auth và PayOS

FE giữ base `/api/v1` để cookie vẫn ở origin FE; proxy `/api/:path*` trỏ tới backend deployment đã xác nhận. Không commit URL dự đoán. Dev Vite proxy vẫn dùng local backend.

Giữ refresh cookie httpOnly/Secure và rotation/revocation như hiện tại; CORS dùng allowlist cụ thể, không wildcard preview domains. FE preview không mặc định dùng DB/credentials production; project/env preview phải tách biệt hoặc khóa truy cập.

Test login, reload, refresh, logout, Parent Gate qua rewrite để xác nhận Set-Cookie/path và forwarded headers. Không cấu hình VITE_API_URL sang domain BE riêng làm thay đổi cookie mà không kiểm thử.

PayOS endpoint và verification không đổi. Khi cutover, deploy owner cập nhật webhook URL tại Merchant Portal và kiểm chứng kênh nhận webhook. Không tự tạo giao dịch tiền thật. Không tắt Render cho tới khi các đơn pending và webhook trong thời gian chuyển host được đối soát; tránh thay JWT secrets giữa hai backend để phiên đang có còn dùng được.

## 7. Cấu hình, tài liệu và rollout

Vercel cần NODE_ENV production, MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_ORIGIN HTTPS, bộ Cloudinary đầy đủ và tên signed upload preset. Bộ PayOS hoặc đầy đủ hoặc để trống như contract hiện hữu; thiếu PayOS không được làm sập auth/API. Giữ CMS_PUBLISH_ENABLED false trừ khi có quyết định publish riêng.

Không đọc/copy secret vào repo hoặc output chat. Dùng vùng function gần DB để hạn chế độ trễ, chọn vùng được account hỗ trợ và đo thực tế. Vercel protection phải cho FE rewrite và PayOS webhook truy cập production API; không mặc định tắt bảo vệ preview.

Rollout: kiểm thử local/build, deploy code BE tương thích lên Render (có direct upload), deploy FE mới dùng direct upload nhưng proxy còn Render, deploy BE Vercel preview/staging với env phù hợp, nghiệm thu, rồi chuyển proxy production và webhook. Không kết nối preview vào DB thật chỉ để chạy test tự động.

Rollback: đưa proxy/webhook về Render đã có code tương thích direct upload. Giữ additive collections/indexes và phiên bản reader, không restore/drop DB hoặc rollback về grader trước CMS version. Không xóa render.yaml/dịch vụ trước khi chủ dự án xác nhận hết cửa sổ rollback.

Khi triển khai phải cập nhật docs/04-system-architecture.md, docs/05-api-and-data-contracts.md, docs/03-feature-inventory.md và docs/06-review-findings.md; ghi rõ phần đã chạy local và phần chưa nghiệm thu production. Tài liệu deploy kèm cấu hình Root Directory/env/indexes/Cloudinary preset/proxy/webhook và lệnh smoke không ghi dữ liệu thật.

## 8. Kiểm thử và tiêu chí chấp nhận

- DB: cold/warm start, concurrent requests chỉ chia sẻ một connect promise, lỗi connect thử lại được, không disconnect theo request, health/readiness khác nhau.
- Upload: không auth, child khác, lesson khóa, activity/type/version sai; file 5 MiB và quá giới hạn; audio webm/mp4/ogg hợp lệ; video giả audio; metadata thiếu; provider lỗi.
- Finalize: ý định user khác, đổi quyền/bé, hết hạn, retry mất response, concurrency, transaction rollback, cùng requestId nhưng context khác, receipt sau TTL, race xóa child/finalize. Không tạo Recording/điểm khi kiểm chứng thất bại.
- FE: không gửi JWT/cookie/Parent Gate tới Cloudinary; giữ Blob sau lỗi; retry finalize không upload trùng; đổi bé/tài khoản không complete phiên mới; vẫn chỉ nộp Recording ID đã xác nhận.
- Rate limit: hai store/instance dùng chung counter; window/reset/TTL không bypass; cạnh tranh increment, các scope tách biệt, lỗi DB không fail-open, IP spoof và proxy qua FE.
- Regression: server/client test và typecheck/build; PayOS signature/amount/transaction, Parent Gate, session/contentVersion, lesson completion idempotency vẫn qua.
- Vercel: build bundling/native dependency; `/health`, `/ready`, `/api/v1` 404 wrapper; auth/refresh qua proxy; upload 5 MiB trực tiếp; backend config không dùng process dài hạn hoặc seed khi deploy.
- Production chỉ được gọi là chuyển xong khi có bằng chứng deployment và smoke môi trường thật. Build/test local thành công không thay cho credentials/network/webhook/thiết bị thật.

## 9. Nguồn và ranh giới chưa xác minh

Đã đối chiếu docs/README.md, 01–07, app/bootstrap/db/env/logger, recordings controller/service/model/storage, rate limit, audioRecorder/api client và cấu hình Render/FE Vercel. Một số tool AST không parse được nguồn local nên kiểm tra trực tiếp các file liên quan.

Tài liệu Vercel đọc ngày 2026-10-09:

- https://vercel.com/docs/frameworks/backend/express — default export/port listener và các đường dẫn Express entrypoint native.
- https://vercel.com/docs/functions/limitations — giới hạn request/response payload 4,5 MB, không thể nâng bằng multer hay express.json.

Chưa xác nhận quyền account, domain BE, MongoDB network/backup, preset/metadata Cloudinary thật, trust proxy qua hai project, giao dịch/webhook PayOS thật hoặc deploy nào. Đây là gate nghiệm thu và đầu vào môi trường, không phải dữ liệu đã biết hay việc đã hoàn thành.
