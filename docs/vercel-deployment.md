# Rollout backend Vercel — Vietverse

Ngày 2026-10-10. Quyết định đã duyệt: project BE riêng, giữ MongoDB/nghiệp vụ/5MiB, direct Cloudinary, Render rollback. **Trạng thái: FE Production đã nối BE Vercel; BE Preview và Production shell READY, chưa có MongoDB/Cloudinary nên API dữ liệu503.** Owner yêu cầu chuyển proxy trước khi bổ sung DB/storage; đây không phải nghiệm thu đủ nghiệp vụ. Render vẫn giữ làm rollback, webhook chưa chuyển.

URL Preview đã kiểm chứng: https://vietverse-backend-754ru0q09.vercel.app — deployment `dpl_7cuB6M2cYsTbLva1Kqpk3N9mXYzZ`, source commit `b2c8613`, Node22.x. Có Vercel SSO protection, cần đăng nhập Vercel hoặc cơ chế truy cập protected deployment để xem.

URL Production shell đã kiểm chứng: https://vietverse-backend.vercel.app/health — deployment `dpl_3AJPKm1eNFa52xZEqazkazTn16kt`, URL riêng https://vietverse-backend-2rm0akdhe.vercel.app, cùng source snapshot `b2c8613`. Sau khi owner đồng ý sửa Production, đã thêm5 env tối thiểu và source deploy `--prod` exit0/READY, thay alias từ deployment đầu bị lỗi. GET `/health`200/status ok/environment production (cả không bypass), `/`404/NOT_FOUND vì BE không có trang giao diện, `/ready` và `/api/v1/not-found`503/DATABASE_UNAVAILABLE. Lỗi FUNCTION_INVOCATION_FAILED trước sửa có log `Invalid environment configuration: JWT_SECRET, JWT_REFRESH_SECRET, CLIENT_ORIGIN`. Không thay source runtime, MongoDB/Cloudinary/PayOS, FE proxy, Render hay webhook.

## Đích và giới hạn

### Proxy FE — đã triển khai theo yêu cầu owner2026-10-10

- **Quyết định triển khai:** owner yêu cầu trỏ FE sang BE Vercel mới sau khi đã được thông báo BE thiếu MongoDB/API503, rồi yêu cầu push code. `client/vercel.json` đổi `/api/:path*` destination từ Render sang `https://vietverse-backend.vercel.app/api/:path*`, giữ SPA rewrite cuối. Không đổi API base URL mặc định `/api/v1` hoặc auth/cookie code.
- **Xác minh deployment:** FE Git integration theo `main`, Root Directory `client`; alias https://vietverse-nine.vercel.app đã chạy source chứa proxy mới. GET `/` và `/dang-nhap` trả200 HTML; `/api/v1/not-found` trả503/DATABASE_UNAVAILABLE, không rơi vào SPA fallback. BE `/health`200. Kiểm env metadata không có `VITE_API_URL` override ở FE Production; không đọc giá trị secret. Bằng chứng rollout nằm trong [review findings](./06-review-findings.md).
- **Env đúng project:** Vercel → project `vietverse-backend` → Settings → Environment Variables → Production là nơi owner bổ sung `MONGODB_URI` đã rotate và Cloudinary, rồi redeploy BE. Có các tên biến MongoDB ở project FE `vietverse` không đồng nghĩa BE nhận được chúng; không tự copy credential hoặc xóa env FE. Dừng nếu target/credential chưa xác nhận, không seed/import/index apply để kiểm deployment.
- API sau chuyển vẫn503 do thiếu DB; audio/PayOS/index/auth/IP/cookie chưa nghiệm thu. JWT BE shell khác Render, phiên đăng nhập cũ không được bảo đảm tương thích. Render và webhook vẫn giữ nguyên. Rollback proxy về `https://vietverse.onrender.com/api/:path*` rồi redeploy FE, không xóa dữ liệu hoặc Render.

### Backend

- BE project riêng, Root Directory `server`, Framework Express native, Node22.x; `src/index.ts` export app không listener. HTTP assembly ở `src/httpApp.ts`; `src/app.ts` chỉ re-export để giữ import tương thích, không import Express. Native builder ưu tiên `app.ts` trước `index.ts`, nên assembly không được đặt ở một entrypoint cạnh tranh. `server/vercel.json` không có legacy builds/catch-all/outputDirectory=dist. Giữ `src/server.ts` cho Render/local. Nếu GitHub integration dùng root repo, Root Directory vẫn server; khi CLI deploy từ server, đừng dùng project FE đã link tại repo root.
- CLI50.33.0 đã đăng nhập. Project BE `vietverse-backend`, ID `prj_GgehqtnUVgmyfSK1puzj2bwTnTi6`, team `team_u8YrHVhiz8VkrTmY3gjloePR`; inspect xác nhận Express/Node22.x/Root Directory `server`. Link FE `vietverse` tại repo root/client được giữ nguyên. Schema Vercel online chấp nhận framework=express.
- **Gate quyền đã giải quyết:** chủ dự án cho phép link/config/env, sau đó yêu cầu deploy Preview trước dù DB/Cloudinary sẽ cung cấp sau. BE giữ SSO protection `all_except_custom_domains`; không pull secret xuống snapshot hoặc cutover. CLI curl đã tạo automation bypass token cho GET smoke, không in token hoặc tắt SSO; token thuộc project settings, không phải env ứng dụng.
- **Env Preview hiện có:** NODE_ENV=production, CMS_PUBLISH_ENABLED=false, CLIENT_ORIGIN=https://vietverse-nine.vercel.app (domain FE được xác minh từ project metadata), JWT_SECRET và JWT_REFRESH_SECRET ngẫu nhiên riêng cho Preview, đặt sensitive và gửi qua stdin. Preview đủ5 tên. **Production shell sau sửa:** đủ cùng5 tên, JWT mới riêng biệt ngẫu nhiên48-byte/base64url, sensitive/stdin; không copy giá trị Preview hoặc Render. API env metadata xác nhận tên/target, không in/ghi giá trị secret. `server/.env` dùng JWT mẫu, thiếu4 biến Cloudinary và origin không HTTPS nên không copy nguyên bộ. MONGODB_URI chưa upload: owner cần xác nhận/cập nhật credential đã rotate; kiểm log local không tìm được URI cũ không phải bằng chứng rotation. DB/Cloudinary tiếp tục hoãn theo yêu cầu owner, không cấu hình credential giả.
- **Deployment đầu bị auto-promote:** lệnh `--target preview` trên project chưa có deployment tạo `dpl_EJiGJBuJUX5XskxuZJABTo2QvtLA` ở target Production/alias `vietverse-backend.vercel.app`. CLI50.33 chuyển target preview thành undefined trước POST; lần đầu Vercel tự chọn Production. Đã tạo deployment thứ hai đúng Preview (API target null, CLI ghi Preview). Bản Production đầu vẫn tồn tại trong lịch sử, thiếu env và lỗi khởi động; không xóa. Sau authorization riêng của owner, alias chính chuyển sang Production shell mới đã kiểm chứng ở trên. Không rollback về deployment đầu lỗi. FE proxy/Render/webhook chưa đổi.
- **Quyết định kỹ thuật:** TypeScript emit ESM (`module=ESNext`, `moduleResolution=Bundler`), giữ `type=module` và các relative imports đuôi `.js` cho Node22/Render. Resolver của native Express hiện bỏ NodeNext import resolution mode và chọn nhánh kiểu CommonJS của Helmet/express-rate-limit, khác `tsc`. Regression compiler bao phủ source; native bundle và compiled handler đã kiểm local Windows, không dùng cast/ignore để bỏ lỗi kiểu. Không thay middleware, quota hay nghiệp vụ.
- Function body/response4,5MB: không sửa multer/json để vượt. File5MiB upload browser→Cloudinary, BE chỉ JSON intent/finalize. Multipart legacy không đảm bảo full5MiB trên Vercel.
- Pool max5/min0/selection5s theo instance; phải đo pool/Atlas load/cold start. Ping `/ready` không chứng minh transaction, PayOS, audio hoặc production throughput.

## Env và quyền — deploy owner cung cấp ngoài repo/chat

NODE_ENV=production, MONGODB_URI (replica set, target/backup/network đã xác minh), JWT_SECRET và JWT_REFRESH_SECRET giữ tương thích Render, CLIENT_ORIGIN HTTPS đúng FE. Bộ Cloudinary gồm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_RECORDING_UPLOAD_PRESET. Bộ PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY cùng đầy đủ hoặc cùng trống; thiếu không làm sập auth/API, checkout503. CMS_PUBLISH_ENABLED=false.

Quyết định bảo mật cho Preview chưa chuyển traffic: dùng JWT random riêng thay vì giá trị mẫu local; không sửa JWT Render và không coi token Render có thể dùng trên Preview này. Khi cutover production vẫn phải chốt chính sách tương thích/rotation riêng. Preview chưa gọi account/child/payment mutation với MongoDB dùng chung; authorization deploy không thay thế quyền test dữ liệu thật, backup/index gates hoặc webhook/cutover.

**Quyết định triển khai Production shell:** owner cho phép cấu hình env tối thiểu/redeploy để domain chính hết500, vẫn hoãn DB/storage; sau đó yêu cầu chuyển proxy và push `main` dù API503. JWT của shell không tương thích Render hoặc Preview. **Giới hạn:** FE đã gửi API tới shell, nhưng auth/DB/nghiệp vụ chưa nghiệm thu. SSO project setting vẫn `all_except_custom_domains`, không bị sửa; smoke quan sát `/health` trên alias Production200 không bypass.

Preview/staging phải có DB/credentials riêng hoặc protection phù hợp, không tự copy `.env` local/Render production để chạy tests. Không in env hoặc connection errors/SDK errors thô. Atlas credential từng xuất hiện trong failing mock assertion của phiên này cần rotate trước dùng tiếp; không coi credential đó là an toàn để deploy.

## Cloudinary signed preset và metadata

Preset **signed** (không unsigned); giới hạn max_file_size5242880, allowed_formats webm/mp4/m4a/ogg/mp3/wav, không overwrite. Endpoint resource_type=video dùng cho audio; preset format không đảm bảo audio-only. Cấu hình cụ thể cần đối chiếu account/preset thật, không mặc định đã có.

Sign field public_id ngẫu nhiên không chứa dữ liệu bé, timestamp, overwrite=false, upload_preset. Không cho browser chọn đích/public ID/preset; API secret ở BE. Intent pending finalize10 phút; TTL DB7 ngày. Cloudinary signature có expiry riêng (thường dài hơn intent); intent hết hạn **không thu hồi** quyền upload phía provider. Cần quota/rate limit/đối soát orphan.

FE giữ Blob/context sau lỗi. Retry thường chỉ dùng intent hiện hữu; chỉ sau `UPLOAD_INTENT_EXPIRED` và người dùng bấm **Gửi lại bằng lượt mới** mới đổi requestId và gửi lại Blob. Không dùng nút này để bỏ qua404/503. Chọn thu lại hủy trạng thái resend cũ. Auto-stop dùng elapsed monotonic clock, mục tiêu179s (margin1s), dừng khi trang ẩn/pagehide. Main thread bị khóa hoàn toàn vẫn có thể dừng muộn; FE báo quá180s, không gọi take đó hợp lệ. Provider/device thật vẫn là gate, server giữ trần180s.

Staging dùng SDK Admin resource với media_metadata=true và sample thật audio-only webm/mp4/ogg, sample video giả audio, thiếu codec, duration180 và>180, file sát5MiB và>5MiB. BE phải đọc codec audio, không có populated video metadata, finite bytes/duration, publicId/resource_type/type/secure_url đúng account. Thiếu metadata reject422, không fallback dữ liệu browser. Chính sách reject video conservative có thể từ chối file audio hợp lệ; phải kiểm fixture provider thật trước phát hành.

## Indexes additive và DB transaction

`npm run deploy:indexes -w server` chỉ in plan, **không connect DB**, không tạo index. `npm run deploy:indexes -w server -- --apply` chỉ dùng sau khi deploy owner cung cấp env đích và xác minh backup/quyền; chưa chạy apply trên DB thật trong đợt này.

Apply tạo RateLimitBucket.resetAt TTL0; RecordingUploadIntent parentId/requestId unique, childId index, deleteAt TTL0; Recording.uploadIntentId unique sparse. Chỉ createIndexes, không syncIndexes/drop/seed/import/reset dữ liệu hoặc index legacy. Index name/options conflict hoặc duplicate phải dừng để đối soát thủ công; không tự xóa/đổi index cũ. Auto-index runtime không thay thế gate xác nhận indexes tồn tại.

Receipt/Recording/finalize intent cùng transaction. Xóa bé cascade Child, LessonProgress, Recording, RecordingUploadIntent, ExplorationLog, PointTransaction, Redemption tuần tự trong session. Finalize/legacy persist write Child.__v với timestamps=false để cạnh tranh delete. Có bounded transaction retries; failure503 không ghi nửa chừng. Phải kiểm replica set transaction trên môi trường staging riêng, ping chưa đủ. Giữ gate index ViVi Points≥Mongo6 và duplicate scan đã có trong06; không backfill điểm.

## Trình tự và smoke gate

Cấp mới/reuse intent cũng ghi Child.__v trong transaction để phối hợp xóa bé; không chèn intent sau cascade. Legacy dùng publicId UUID ngẫu nhiên, overwrite=false. Mỗi persist dùng Recording ID ổn định qua retry; commit mất ACK có thể đọc lại receipt. DB503/commit không rõ hoặc reconciliation không đọc được **không xóa asset**; chỉ rejection nghiệp vụ4xx chắc chắn cho phép bù xóa asset operation-owned. Asset dư cần đối soát thủ công; không đánh đồng transaction rejection với chắc chắn abort.

1. Review toàn nhánh độc lập; root test/typecheck/build, client lint. Không push main tự động.
2. BE mới tương thích lên Render trước; env signed preset có đủ. FE mới dùng direct nhưng proxy vẫn Render. Không phát hành FE direct trước BE routes mới.
3. Tạo/link project BE riêng; owner cấu hình **chỉ env staging đã xác minh**, không pull secret vào source snapshot. Native Vercel build; kiểm default entrypoint/ESM/native bcrypt và Node22. Có thể chạy `node server/scripts/checkVercelEntrypoint.cjs <đường-dẫn-installed-@vercel/express/dist/index.js>` từ repo root để kiểm chính native detector chọn `src/index.ts` (không download/deploy). Deploy preview/staging đúng project, không main production. Giữ protection; không tắt công khai chỉ để test.
4. Read-only GET `/health`, `/ready` và `/api/v1/not-found`; response wrapper đúng, DB network lỗi có kiểm soát cho readiness503. GET thật chỉ sau có URL verified.
5. Với account/child fixtures staging riêng: register/login/reload/refresh/logout, rotation/revocation, Parent Gate qua FE rewrite; cookie Secure/httpOnly/path đúng và không mất phiên. Upload5MiB direct, finalize retry/mất response/concurrency/receipt sau TTL; không điểm trước completion đúng recordingId.
6. Hai mạng/client chứng minh bucket IP riêng qua FE rewrite và gọi BE trực tiếp; XFF giả không né quota. Vercel chỉ dùng single x-vercel-forwarded-for ở VERCEL=1, Render immediate proxy khi RENDER=true, local dùng socket; không đặt trust proxy=true. Header thực qua hai tầng proxy là gate bắt buộc, không tự invent header forwarding secret.
7. Deploy owner xác nhận production target/env/preset/indexes/bằng chứng. Chỉ lúc đó đổi `client/vercel.json` `/api/:path*` destination sang URL BE verified, giữ SPA rewrite cuối. PayOS Merchant Portal cập nhật webhook `/api/v1/payments/webhook` và đối soát pending orders; không tự chuyển10.000đ hoặc nhận returnURL làm thanh toán.

## Orphan, quyền riêng tư và rollback

DB TTL/cascade không xóa Cloudinary asset. Legacy delete chưa có storage retention hoàn chỉnh; không tuyên bố đã xóa vật lý mọi audio. Pending hết hạn/rejected asset có thể orphan. Đối soát inventory theo publicId từ intent/Recording trên đích được duyệt; kiểm không có receipt/live intent trước xóa asset cụ thể, ghi audit và có người duyệt. Không làm background task cleanup trong request hoặc xóa theo wildcard.

Render giữ BE code mới/direct routes/JWT tương thích. Rollback proxy và webhook về Render, đối soát pending payment; giữ collections/indexes/reader/contentVersion additive. Không restore/drop DB, không rollback về grader trước CMS, không xóa Render cho tới khi chủ dự án kết thúc rollback window.

## Bằng chứng và phần chưa xác minh

Local test sau sửa native build dùng MongoMemoryReplSet và provider/network doubles; Node22.15.0/npm10.9.2. `npm test`: server340/340, client163/163; typecheck và build toàn dự án qua. Client lint0 errors/87 warnings (ngưỡng200); JS bundle673.58KB, cảnh báo chunk>500KB ngoài migration. Reviewer độc lập trước đó chốt5 Important, không Critical/Minor; mỗi finding có regression RED→GREEN, một fix pass, không re-review. Các lỗi đã sửa không thay thế nghiệm thu provider/platform thật. Root lint không có server script nên chỉ chạy client lint.

Build native đầu tiên từ snapshot `0843d7e` thất bại: chọn `src/app.ts` thay wrapper DB và lỗi TS2349 ở Helmet. Chẩn đoán cùng resolver cũng tái hiện lỗi express-rate-limit. Đã sửa lựa chọn entrypoint và cấu hình ESM resolution với regression RED→GREEN.

Native `vercel build` CLI50.33.0 từ snapshot tracked-only commit `741cf9f` đã exit0 (Preview target, khoảng3 phút), không pull env/deploy. Artifact `.vc-config.json` có handler `server/src/index.js`, runtime `nodejs22.x`, framework Express4.22.3 và environment rỗng; generated routes có filesystem/native catch-all. Function không gồm listener `server.ts` hoặc `.env`. Smoke chính artifact trên Windows trả `/health`200, giữ security headers/options và bcrypt hash/compare qua, không gọi DB. Cả compiled `dist/index.js` cũng qua smoke ESM.

**Không deploy `--prebuilt` artifact này:** bcrypt được đóng gói là Windows PE (`MZ`), không phải Linux Vercel. Khi có env/đích staging được duyệt, deploy từ source để Vercel build lại trên Linux rồi nghiệm thu native runtime thật. Bundle local chỉ chứng minh compiler/detection/tracing, không đóng gate Linux/Atlas. Install cũng cảnh báo dependencies deprecated/advisories (multer1.x, tar/glob và transitive packages); không tự bump majors trong migration này, debt bảo mật vẫn cần xử lý riêng.

Source snapshot tracked-only `b2c8613` (không `.env`, node_modules hay prebuilt Windows) đã được Vercel build ở iad1/Linux bằng CLI62.7.0, TypeScript5.9.3: build35s, deployment Preview52s, exit0/READY. Function boot Linux qua `/health`200, trả environment=production. Điều này chứng minh module graph/native dependencies load được, không thay thế test bcrypt hash/auth với DB thật.

GET smoke protected URL Preview: `/health`200/status ok; `/ready`503/DATABASE_UNAVAILABLE; `/api/v1/not-found`503 cùng code vì DB guard chạy trước router; `/not-found`404/NOT_FOUND. `/health`, `/ready`, `/not-found` có nosniff; DB guard `/api` trả trước Helmet nên 503 thiếu nosniff, ghi nhận debt chưa sửa trong lượt deploy. Không có Atlas URI được cấu hình; connection attempt chỉ tới default localhost và không thành công, không gọi DB thật/Cloudinary hay endpoint ghi. Protection không bị tắt và JWT/bypass values không được in/ghi file.

Chưa có đủ bộ env DB/Cloudinary verified, preset/metadata audio thật, bcrypt hash/auth/transaction với DB trên Linux Vercel, DB thật/index apply, IP/cookies qua rewrite, webhook/cutover. API dữ liệu/auth chưa dùng được, audio chưa nghiệm thu. Sau khi bổ sung env cần redeploy và kiểm staging đầy đủ; không gọi chuyển đổi production hoàn tất chỉ vì shell Preview READY.
