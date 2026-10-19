# 04 — Kiến trúc hệ thống

## Monorepo

```text
client/  React 18 + Vite + TypeScript + Tailwind + React Query + Zustand
server/  Node 22 + Express + TypeScript + Mongoose + Zod + JWT + Pino
MongoDB  User, Child, Stage, Lesson, Progress, Recording, Points, Shop, Redemption...
```

## Frontend

- `client/src/app/router.tsx`: route tree và guard.
- React Router `7.18.2` (vá security, 2026-10-12), giữ React18 và Data Router/SPA hiện hữu; Node build tối thiểu20, môi trường đang dùng22. Không bật SSR/RSC hoặc thay route/guard.
- Layouts: public, kids, parent, admin.
- Feature folders chứa màn hình theo nghiệp vụ.
- `authStore` giữ access token trong memory; refresh token ở httpOnly cookie.
- `childStore` giữ danh sách và active child.
- `lessonSessionStore` lưu session lesson ở IndexedDB để resume.
- React Query dùng cho dữ liệu server; cần invalidation sau mutation để tránh stale state.

## Backend

- `httpApp.ts` gắn security middleware, CORS, rate limit, route và error handler; `app.ts` chỉ re-export tương thích, không cạnh tranh native Express entrypoint `index.ts`.
- `index.ts` cũng áp Helmet trước cold-connect DB guard để response503 sớm giữ baseline security headers như app chính; không thay quyền hay payload lỗi.
- Module theo domain: auth, children, stages, lessons, recordings, stories, culture, points, parent, admin.
- Controller parse input và gọi service.
- Service thực hiện nghiệp vụ và truy cập model.
- Zod bảo vệ auth/children/lesson complete/admin và CMS. CMS tách schema ghi nháp/validate publish khỏi whitelist đọc legacy, không áp giới hạn tác giả mới lên dữ liệu đã có.
- Module content quản lý DTO/reader/version; admin/content quản lý CAS drafts/publish/visibility. ContentRevision bất biến và live/draft/audit được cập nhật trong MongoDB transaction, yêu cầu replica set.
- CMS preview dùng renderer thuần, không mount trang học/chi tiết có mutation. Session/outbox và recording mang contentVersion; khóa thưởng vẫn dùng ID nội dung.
- `PointTransaction` là sổ cái điểm; `Child.viviPoints` là số dư đọc nhanh.

## Auth và authorization

- **Siết tính nguyên tử 2026-10-18, local:** refresh, reuse-family revocation và logout dùng transaction cùng ghi tăng `User.__v` (`timestamps: false`) trước các thao tác token để tuần tự hóa theo tài khoản; logout nhiều owner lấy khóa theo thứ tự ổn định. Không thêm field/index/migration; cần replica set. Transaction dùng `timeoutMS: 15000`, `maxCommitTimeMS: 5000`, không phải cam kết toàn request luôn kết thúc trong 15 giây vì còn lookup ngoài transaction.
- Chỉ các thao tác phiên nêu trên đi qua khóa; `generateTokens` từ login/register/Google tạo family mới ngoài khóa. Không coi logout là hàng rào ngăn mọi đăng nhập mới đồng thời. Access JWT đã cấp vẫn có thời hạn 15 phút, không được thu hồi tức thì bởi transaction refresh. Chính sách reuse không grace và caveat commit mất ACK tại [auth-session-rotation.md](./auth-session-rotation.md).
- Access token JWT hết hạn 15 phút.
- Refresh token JWT 7 ngày trong cookie httpOnly.
- API đọc Bearer token hoặc cookie access token nếu có.
- Admin API dùng `authMiddleware` + `requireRole(admin)`.
- Google Sign-In dùng Google Identity Services ID token: server xác minh chữ ký/audience/issuer/expiry/email đã xác minh và nonce một lần trước khi cấp JWT hiện tại. Google-only users vẫn là parent và nhận subscription free; tài khoản cùng email phải xác nhận mật khẩu Vietverse để liên kết, không tự gộp theo email.
- Các route parent/child xác định ownership bằng `req.user.id` và `child.parentId`.
- CORS production chỉ cho origin trong allowlist; development cho phép origin local khác phục vụ QA.

## Storage audio

- Cutover 2026-10-19: mọi audio (bản thu của bé + narration nội dung) lưu trên đĩa BE qua `AUDIO_STORAGE_DIR` (self-host: volume `vietverse_audio` → `/data/audio`, backup tar.gz hằng ngày). Không còn dùng Cloudinary cho audio; service `localAudioStorage` ghi atomic (file tạm → rename), sniff magic bytes và đọc thời lượng bằng `music-metadata`.
- Bố cục đĩa: bản thu `recordings/<childId>/<uuid>.<ext>`; audio nội dung `content/<sha256 16 hex>.<ext>` (dedupe theo nội dung). Giới hạn: bản thu 5 MiB, audio nội dung 10 MiB, đọc thời lượng phía server, không tin client.
- Bản thu là dữ liệu nhạy cảm của trẻ: `audioUrl` không public mà là `/api/v1/recordings/:id/audio?t=<token>` với token HMAC (`JWT_SECRET`, hạn 1 giờ, gắn recordingId). Audio nội dung là học liệu, phát công khai tại `/api/v1/media/audio/<hash>.<ext>` với cache bất biến. Cả hai hỗ trợ HTTP Range.
- Persist bản thu và xóa bé cùng write boundary trên Child (cascade DB atomic trên replica set); file được ghi trước transaction và xóa nếu DB lỗi, file của bé bị xóa (best-effort) sau khi cascade commit.
- Thiếu `AUDIO_STORAGE_DIR`: dev dùng `<repo>/server/.data/audio`; production trả `503 AUDIO_STORAGE_UNAVAILABLE` cho mọi endpoint đọc/ghi audio, các endpoint khác vẫn phục vụ.
- Vercel không có đĩa bền nên audio không khả dụng ở deployment Vercel (503), không âm thầm hỏng. Ảnh bìa vẫn ở Cloudinary (xem "Storage ảnh CMS").

## Storage ảnh CMS

- Quyết định triển khai: ảnh bìa của story/đồng dao và bài văn hóa chỉ do admin tải trong bản nháp; không upload từ trang bé và không làm thay đổi live content, điểm hoặc publish state.
- `POST /admin/content-images/intent` cấp ticket JWT 10 phút và chữ ký Cloudinary qua preset ảnh riêng trên cùng account. Browser gửi trực tiếp tới `image/upload` với `credentials=omit`, không gửi JWT, cookie hoặc Parent Gate.
- `POST /admin/content-images/finalize` kiểm tra lại admin/role, draft kind/id/version và đọc metadata provider ngoài transaction. Chỉ nhận JPG/PNG/WebP tĩnh, HTTPS đúng Cloudinary account, tối đa 5 MiB và tối đa 40 MP; URL trả về dùng delivery transform giới hạn 1920px và auto format/quality.
- Retry dùng cùng request declaration/public ID, chỉ cập nhật URL vào form local; admin phải bấm Lưu nháp. Không tự publish, không ghi `ContentDraft` trong upload và không xóa asset provider khi request bị gián đoạn; orphan cần đối soát vận hành.

## Deploy và môi trường

- Client: Vercel/Vite, proxy `/api` theo [`client/vercel.json`](../client/vercel.json). Theo yêu cầu owner, FE Production đã triển khai proxy BE Vercel trước khi bổ sung DB/storage. MongoDB readiness và GET qua FE đã qua sau khi owner mở quyền mạng Atlas tạm; mạng production lâu dài chưa chốt. JWT mới không tương thích Render. Quy trình env đúng project/rollback và bằng chứng kết nối ở [runbook](./vercel-deployment.md).
- Vercel project dùng `client` làm Root Directory, build bằng `npm run build` và phát hành thư mục `dist`.
- GitHub integration tự động deploy: push vào `main` tạo production deployment; push các branch khác hoặc mở Pull Request tạo preview deployment và bình luận vào PR.
- Server: Render, health `/health`.
- BE Vercel riêng, Root Directory `server`, native Express default export `src/index.ts`. Đã deploy Preview và Production shell theo yêu cầu owner trước DB/Cloudinary: health200, DB-backed API/readiness503; FE proxy đã chuyển sang shell, Render vẫn giữ rollback/webhook chưa đổi. Deployment đầu auto-promote Production lỗi thiếu JWT/origin; sau owner cho phép sửa, đã cấu hình5 env tối thiểu/JWT random riêng và deploy source lại. Domain `vietverse-backend.vercel.app` trỏ shell đã kiểm chứng, `/health`200, `/`404/NOT_FOUND (không có giao diện BE). JWT shell không tương thích Render; chính sách token/auth/DB vẫn là gate riêng. `src/server.ts` giữ listener local/Render. Không có legacy builds hoặc seed khi deploy.
- Mongo connection warm/in-flight được cache (pool max5/min0, selection5s). `/ready` connect+ping, không chứng minh transaction/storage/PayOS. API cold connect lỗi trả503; không disconnect theo request.
- Production rate limit MongoDB chung: auth30/15 phút, API120/phút, window từ request đầu và reset atomic theo DB clock; store lỗi503. Vercel chỉ đọc single provider-normalized `x-vercel-forwarded-for` khi `VERCEL=1`; Render `RENDER=true` dùng immediate proxy. Không tin XFF ở host khác; chuẩn hóa/băm IP. Qua FE rewrite và giả header vẫn cần staging thật.
- Node BE chọn22.x để khớp local verification. `bcrypt` đã nâng lên6.0.0 (loại chuỗi `node-pre-gyp/tar` cũ); native addon vẫn cần được build/kiểm chứng trên Vercel Linux. Quy trình env/preset/index/proxy/webhook tại [runbook](./vercel-deployment.md).
- TypeScript emit ESM với ESNext/Bundler resolution để native builder và `tsc` cùng đọc nhánh ESM của dual packages; relative imports vẫn `.js` để compiled Node22/Render chạy được. Đây là quyết định kỹ thuật, không đổi API/nghiệp vụ.
- **Tự host (Pha 1 code xong 2026-10-13, chưa chạy trên máy chủ):** [QĐ] domain `vietverse.io.vn`, FE + API cùng origin trên máy chủ riêng ở VN. Docker Compose project `vietverse` trong [`deploy/selfhost/`](../deploy/selfhost/): `vietverse-web` (nginx: SPA + proxy `/api/*`, `/healthz`; port duy nhất `127.0.0.1:15081`), `vietverse-api` (Node 22, entrypoint chạy lâu `dist/server.js`, không publish port), `vietverse-mongo` (mongo:7, replica set `rs0` một node, keyFile + auth), `vietverse-backup` (mongodump hằng ngày, giữ 14 bản). Env `SELF_HOSTED=1` bật `trust proxy = TRUST_PROXY_HOPS` (mặc định 2: nginx host + nginx web) cho IP rate limit và pool Mongo max20/min2; Vercel/Render không đổi khi biến này không đặt. Runbook, quyền sudo của chủ máy, cô lập và rollback ở [self-host-deployment.md](./self-host-deployment.md).
- Database: MongoDB local hoặc Atlas; tự host dùng `vietverse-mongo` (DB `vietverse`, user app chỉ `readWrite` trên DB này).
- Hồ sơ `Child` lưu `companionLanguages` dạng mảng bounded (1–6) và giữ `companionLanguage` là compatibility field; migration backfill được thực hiện additive, không xóa trường cũ.
- **Quyết định triển khai DB:** owner yêu cầu cấu hình sensitive ở BE Production/redeploy theo cluster trong ảnh, sau đó tự mở quyền mạng tạm để kiểm tra kết nối. **Giả định đã thông báo:** URI không có database path, driver chọn `test`; chưa xác nhận dữ liệu mong muốn nằm ở đó. Không seed/import/apply indexes thủ công hoặc đổi nghiệp vụ. Readiness đã qua; quyền mạng tạm hết hạn và least-privilege vẫn là gate vận hành, xem runbook.
- Env qua Zod; production từ chối secret mặc định. `CMS_PUBLISH_ENABLED` mặc định false, chỉ bật sau khi reader/client phiên bản và MongoDB transaction được kiểm chứng. Xem `cms-operations.md`.
- Google activation cần `GOOGLE_CLIENT_ID` ở backend và Authorized JavaScript origins trùng `CLIENT_ORIGIN` trong Google Cloud Console; không yêu cầu Google client secret hoặc mật khẩu tài khoản Google.

## Nguyên tắc thay đổi

- Giữ ownership check ở service, không chỉ ở UI.
- Giữ idempotency key và transaction boundary gần nơi ghi sổ cái.
- Không đưa dữ liệu đáp án đúng ra client nếu server cần chấm độc lập cho nội dung có giá trị.
- Mọi thay đổi schema phải có migration/seed compatibility và cập nhật API contract.

