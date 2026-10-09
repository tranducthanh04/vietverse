# Rollout backend Vercel — Vietverse

Ngày 2026-10-09. Quyết định đã duyệt: project BE riêng, giữ MongoDB/nghiệp vụ/5MiB, direct Cloudinary, Render rollback. **Trạng thái: code đã triển khai local; chưa deploy BE/cutover production.** Không có URL BE verified trong tài liệu này.

## Đích và giới hạn

- BE project riêng, Root Directory `server`, Framework Express native, Node22.x; `src/index.ts` export app không listener. `server/vercel.json` không có legacy builds/catch-all/outputDirectory=dist. Giữ `src/server.ts` cho Render/local. Nếu GitHub integration dùng root repo, Root Directory vẫn server; khi CLI deploy từ server, đừng dùng project FE đã link tại repo root.
- CLI50.33.0 đã đăng nhập và list project chỉ đọc: có FE `vietverse`, chưa có BE. Schema Vercel online ngày này chấp nhận framework=express. Vercel native build/bcrypt vẫn cần kiểm chứng sau khi có BE project/settings đúng đích.
- Function body/response4,5MB: không sửa multer/json để vượt. File5MiB upload browser→Cloudinary, BE chỉ JSON intent/finalize. Multipart legacy không đảm bảo full5MiB trên Vercel.
- Pool max5/min0/selection5s theo instance; phải đo pool/Atlas load/cold start. Ping `/ready` không chứng minh transaction, PayOS, audio hoặc production throughput.

## Env và quyền — deploy owner cung cấp ngoài repo/chat

NODE_ENV=production, MONGODB_URI (replica set, target/backup/network đã xác minh), JWT_SECRET và JWT_REFRESH_SECRET giữ tương thích Render, CLIENT_ORIGIN HTTPS đúng FE. Bộ Cloudinary gồm CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET/RECORDING_UPLOAD_PRESET. Bộ PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY cùng đầy đủ hoặc cùng trống; thiếu không làm sập auth/API, checkout503. CMS_PUBLISH_ENABLED=false.

Preview/staging phải có DB/credentials riêng hoặc protection phù hợp, không tự copy `.env` local/Render production để chạy tests. Không in env hoặc connection errors/SDK errors thô. Atlas credential từng xuất hiện trong failing mock assertion của phiên này cần rotate trước dùng tiếp; không coi credential đó là an toàn để deploy.

## Cloudinary signed preset và metadata

Preset **signed** (không unsigned); giới hạn max_file_size5242880, allowed_formats webm/mp4/m4a/ogg/mp3/wav, không overwrite. Endpoint resource_type=video dùng cho audio; preset format không đảm bảo audio-only. Cấu hình cụ thể cần đối chiếu account/preset thật, không mặc định đã có.

Sign field public_id ngẫu nhiên không chứa dữ liệu bé, timestamp, overwrite=false, upload_preset. Không cho browser chọn đích/public ID/preset; API secret ở BE. Intent pending finalize10 phút; TTL DB7 ngày. Cloudinary signature có expiry riêng (thường dài hơn intent); intent hết hạn **không thu hồi** quyền upload phía provider. Cần quota/rate limit/đối soát orphan.

Staging dùng SDK Admin resource với media_metadata=true và sample thật audio-only webm/mp4/ogg, sample video giả audio, thiếu codec, duration180 và>180, file sát5MiB và>5MiB. BE phải đọc codec audio, không có populated video metadata, finite bytes/duration, publicId/resource_type/type/secure_url đúng account. Thiếu metadata reject422, không fallback dữ liệu browser. Chính sách reject video conservative có thể từ chối file audio hợp lệ; phải kiểm fixture provider thật trước phát hành.

## Indexes additive và DB transaction

`npm run deploy:indexes -w server` chỉ in plan, **không connect DB**, không tạo index. `npm run deploy:indexes -w server -- --apply` chỉ dùng sau khi deploy owner cung cấp env đích và xác minh backup/quyền; chưa chạy apply trên DB thật trong đợt này.

Apply tạo RateLimitBucket.resetAt TTL0; RecordingUploadIntent parentId/requestId unique, childId index, deleteAt TTL0; Recording.uploadIntentId unique sparse. Chỉ createIndexes, không syncIndexes/drop/seed/import/reset dữ liệu hoặc index legacy. Index name/options conflict hoặc duplicate phải dừng để đối soát thủ công; không tự xóa/đổi index cũ. Auto-index runtime không thay thế gate xác nhận indexes tồn tại.

Receipt/Recording/finalize intent cùng transaction. Xóa bé cascade Child, LessonProgress, Recording, RecordingUploadIntent, ExplorationLog, PointTransaction, Redemption tuần tự trong session. Finalize/legacy persist write Child.__v với timestamps=false để cạnh tranh delete. Có bounded transaction retries; failure503 không ghi nửa chừng. Phải kiểm replica set transaction trên môi trường staging riêng, ping chưa đủ. Giữ gate index ViVi Points≥Mongo6 và duplicate scan đã có trong06; không backfill điểm.

## Trình tự và smoke gate

1. Review toàn nhánh độc lập; root test/typecheck/build, client lint. Không push main tự động.
2. BE mới tương thích lên Render trước; env signed preset có đủ. FE mới dùng direct nhưng proxy vẫn Render. Không phát hành FE direct trước BE routes mới.
3. Tạo/link project BE riêng và pull **chỉ env staging đã xác minh**, native Vercel build; kiểm default entrypoint/ESM/native bcrypt và Node22. Deploy preview/staging đúng project, không main production. Giữ protection; không tắt công khai chỉ để test.
4. Read-only GET `/health`, `/ready` và `/api/v1/not-found`; response wrapper đúng, DB network lỗi có kiểm soát cho readiness503. GET thật chỉ sau có URL verified.
5. Với account/child fixtures staging riêng: register/login/reload/refresh/logout, rotation/revocation, Parent Gate qua FE rewrite; cookie Secure/httpOnly/path đúng và không mất phiên. Upload5MiB direct, finalize retry/mất response/concurrency/receipt sau TTL; không điểm trước completion đúng recordingId.
6. Hai mạng/client chứng minh bucket IP riêng qua FE rewrite và gọi BE trực tiếp; XFF giả không né quota. Vercel chỉ dùng single x-vercel-forwarded-for ở VERCEL=1, Render immediate proxy khi RENDER=true, local dùng socket; không đặt trust proxy=true. Header thực qua hai tầng proxy là gate bắt buộc, không tự invent header forwarding secret.
7. Deploy owner xác nhận production target/env/preset/indexes/bằng chứng. Chỉ lúc đó đổi `client/vercel.json` `/api/:path*` destination sang URL BE verified, giữ SPA rewrite cuối. PayOS Merchant Portal cập nhật webhook `/api/v1/payments/webhook` và đối soát pending orders; không tự chuyển10.000đ hoặc nhận returnURL làm thanh toán.

## Orphan, quyền riêng tư và rollback

DB TTL/cascade không xóa Cloudinary asset. Legacy delete chưa có storage retention hoàn chỉnh; không tuyên bố đã xóa vật lý mọi audio. Pending hết hạn/rejected asset có thể orphan. Đối soát inventory theo publicId từ intent/Recording trên đích được duyệt; kiểm không có receipt/live intent trước xóa asset cụ thể, ghi audit và có người duyệt. Không làm background task cleanup trong request hoặc xóa theo wildcard.

Render giữ BE code mới/direct routes/JWT tương thích. Rollback proxy và webhook về Render, đối soát pending payment; giữ collections/indexes/reader/contentVersion additive. Không restore/drop DB, không rollback về grader trước CMS, không xóa Render cho tới khi chủ dự án kết thúc rollback window.

## Bằng chứng và phần chưa xác minh

Local test dùng MongoMemoryReplSet và provider/network doubles; Node22.15.0/npm10.9.2. Task5 full client154 tests, server332 trước Task6; số cuối cập nhật sau review. Client bundle~672KB còn cảnh báo chunk>500KB ngoài phạm vi migration. CLI whoami/list và schema chỉ đọc thành công. Root lint không có server script; chỉ chạy client lint theo ngưỡng200 warnings của repo.

Chưa có BE deployment URL, env staging verified, preset/metadata audio thật, native build/bcrypt Vercel, DB thật/index apply, IP/cookies qua rewrite, webhook/cutover. Không gọi chuyển đổi production hoàn tất chỉ vì config hoặc unit tests pass.
