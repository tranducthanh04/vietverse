# Rollout backend Vercel — Vietverse

## CORS, cookie và đích DB — sửa local 2026-10-13, chưa deploy

- BE Production: `CLIENT_ORIGIN` phải là origin HTTPS chính xác của FE đang phục vụ người dùng (hiện tại là alias FE production). Muốn thêm domain FE khác (custom domain, alias phụ) thì khai báo `CLIENT_ORIGINS` gồm các origin HTTPS phân tách dấu phẩy; env sai định dạng làm BE từ chối khởi động. Không còn origin cứng hoặc `localhost` trong code. Preview FE có domain riêng sẽ bị 403 `ORIGIN_NOT_ALLOWED` cho tới khi được thêm vào `CLIENT_ORIGINS` của đúng môi trường BE.
- Google Cloud Console: mọi origin trong `CLIENT_ORIGIN`/`CLIENT_ORIGINS` dùng đăng nhập Google phải có trong Authorized JavaScript origins.
- Cookie refresh và flow Google là `SameSite=Lax` + `Secure`. Điều này dựa trên việc trình duyệt gọi `/api/*` cùng origin qua rewrite trong `client/vercel.json`; không đặt `VITE_API_URL` của FE Production sang domain BE khác site (cookie sẽ không được gửi).
- Sau khi deploy bản sửa: smoke preflight tới `/api/v1/auth/refresh` với `Origin: https://vietverse.vercel.app` phải trả 403 và không có `Access-Control-Allow-Origin`; đăng nhập, F5, logout, đăng nhập Google qua FE phải hoạt động. Owner quyết định có thu hồi toàn bộ refresh token/xoay `JWT_REFRESH_SECRET` do lỗ hổng S1 đã tồn tại trên production hay không (xem `06`).
- Script vận hành offline (`provision-admin.cjs`, `bootstrap-production.cjs`) không còn chứa host/user/DB: operator đặt `VIETVERSE_DB_HOST` (`<cluster-host>.mongodb.net`), `VIETVERSE_DB_USER`, `VIETVERSE_DB_NAME` trong phiên PowerShell trước khi chạy. Mật khẩu DB vẫn nhập qua hộp thoại riêng, không qua env.

## Admin revenue release — 2026-10-13

- Commit `b4be673d9f86038d31f1b5d23c5af36abfa9498f` is deployed to both production projects from tracked-only snapshots.
- Backend deployment `dpl_5WFkutVr5gZi4xUZQkCfFrMEgWZ2` is Ready at `https://vietverse-backend.vercel.app`; frontend deployment `dpl_CxnENHtyXEtzpZD4EFkcSoTp5cSE` is Ready at `https://vietverse-nine.vercel.app`.
- Read-only smoke checks: backend `/health` 200, `/ready` 200, frontend `/api/v1/stories` 200, and unauthenticated `/api/v1/admin/revenue` 401. The public admin shell route returned 200 and the built asset contains the Doanh thu route and API path.
- No authenticated revenue data was claimed, no payment/test order was created, and no checkout, webhook, subscription, refund or PayOS configuration was changed.

## CMS cover image release — 2026-10-12

- Commit `4d58dde3eacb4a90ccad04ebf0660cb836c33c8f` is deployed to both production projects.
- Backend deployment `dpl_DiVucxhrRbozLoatYaBAV3xFPNNk` is Ready at `https://vietverse-backend.vercel.app`; frontend deployment `dpl_DLzGCo6eMX88JZD7EEqtQHCXrzBq` is Ready at `https://vietverse-nine.vercel.app`.
- Read-only smoke checks returned 200 for backend `/health`, `/ready`, frontend `/`, and frontend `/api/v1/stories`.
- Cloudinary image preset `vietverse_content_images_signed` and backend Production variable `CLOUDINARY_IMAGE_UPLOAD_PRESET` are configured. The app enforces the 5 MiB JPG/PNG/WebP limit; real upload/finalize remains an unexecuted production gate.
- No customer image, draft mutation, publish action, audio change, or PayOS/payment action was performed during release verification.

## QA fix production release — 2026-10-12

- Commit `928d406b427f8121ec2bddb7d793df843ff41235` đã push fast-forward lên main. FE Git deployment `dpl_B3TvNmfL1pLRaPWhQ8Hs6pMqRGZK` Ready và alias `vietverse-nine.vercel.app` đã cập nhật.
- BE source archive từ cùng commit (không env/build local) đã build trên Vercel, deployment `dpl_FN4dXGsrwYYtkfyLWrasdtPHoUZP` Ready, alias `vietverse-backend.vercel.app`. Git deployment song song `dpl_6WUUJKnbcTkn1zy5MDmg4ZWrHzvo` lỗi `git_info_fail` trước build, không thay alias chính đang Ready. Push lần đầu cũng gặp GitHub `commit_refs`; thử lại fast-forward một lần thành công. Không force-push.
- Sau release, BE health/readiness và FE root/catalog đều200. Browser production xác nhận footer unavailable, pricing copy mới, 21 story cards `Bản đọc`, và tab 5 chặng không lặp prefix. Không submit bài học, tạo recording hoặc giao dịch thật.
- Cloudinary đã được cấu hình trong Vercel project `vietverse-backend` → Production: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_RECORDING_UPLOAD_PRESET`; image upload additionally uses `CLOUDINARY_IMAGE_UPLOAD_PRESET`. Secret chỉ lưu trong Vercel; không ghi credential vào repo hoặc tài liệu.
- Sau khi thêm env, redeploy từ source QA Ready tạo deployment `dpl_5pk9NByjMfj17s6UTpKwgcz7qjhj` Ready và alias `vietverse-backend.vercel.app` vẫn hoạt động. GET `/health`, `/ready` và FE `/api/v1/stories` trả 200. Chưa tạo recording/payment thật; live upload/finalize, microphone/device và orphan cleanup vẫn là gate riêng.
- Mốc rollback trước release: BE `dpl_Ae4mHxx9fJRAP2wpWdkptMB4SX8v` (`vietverse-backend-9phgw0tre.vercel.app`), FE `dpl_4vKE3yqavge4h5ZngKMtoiPwKm46` (`vietverse-3l5wpiiqf-tranducthanh31102004-gmailcoms-projects.vercel.app`). Chỉ rollback code theo target đã xác nhận, không rollback dữ liệu hay env.

## Backend Git auto-deploy — 2026-10-12

- Project `vietverse-backend` is now linked to GitHub repository `tranducthanh04/vietverse`, production branch `main`, with Git deployments enabled. Root Directory remains `server` and the existing Production environment variables/database are unchanged.
- The first Git-sourced Production deployment after the link used commit `8a6325c` and is Ready under alias `https://vietverse-backend.vercel.app`. Vercel build/runtime remains Express on Node 22.x. Health/readiness and FE proxy smoke returned 200; unauthenticated `/api/v1/auth/me` returned 401 as expected.
- Future pushes to `main` should create BE deployments automatically. If a source change must be checked without promoting it, use a Preview deployment or inspect the Vercel project before changing aliases. Rollback remains `vercel rollback <deployment-url>` after owner approval; do not alter env, MongoDB data or indexes as part of rollback.
- Google activation release: commit `ef1c300` is Ready on both production projects (FE `dpl_Ag1Ph3Rbee4x38YDinwes6u7d5Mf`, BE `dpl_9yFdZUYNwmE7WbZYA9EDV25UJa9M`). Backend Production has `GOOGLE_CLIENT_ID` configured as a public OAuth identifier; FE uses `CLIENT_ORIGIN=https://vietverse-nine.vercel.app`. Smoke `GET /auth/google`, Google challenge start/cancel, `/health`, `/ready`, `/dang-nhap` and FE catalog all passed; a new Google account also signed in successfully and reached `/bat-dau`. No child, learning or payment data was created; existing-email password linking remains covered by local tests only. Secret values are intentionally omitted from this document.

## Schema/catalog đã duyệt — 2026-10-11

Owner xác nhận database `test`, migrate schema/nạp catalog và deploy FE/BE. Lượt cuối đã nhận credential riêng, preflight rỗng, transaction `applied` và receipt được xác minh. FE/BE mới đều Production Ready, catalog đọc được qua proxy FE; bằng chứng, deployment IDs và giới hạn ở [journal](../plans/journals/2026-10-11-schema-catalog.md). Các mục bên dưới là lịch sử triển khai trước lượt này. Cloudinary/thanh toán tiếp tục hoãn; không đổi CMS publish, JWT, networking hoặc quyền DB.

Route phát hành: chọn đúng project IDs bằng `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` trong process CLI; source snapshot chỉ gồm file tracked hiện tại, không `.env`, `.vercel`, build Windows hoặc credential. Chạy `vercel deploy --prod --yes` từ root snapshot để provider dùng Root Directory đã xác minh; BE trước FE. Không dùng liên kết FE ở root repo để deploy BE. Không pull sensitive env. Inspect deployment/alias và GET health/readiness/catalog để nghiệm thu. Rollback code qua `vercel rollback <deployment-url>` đúng project sau duyệt; không xóa catalog/schema additive/revisions hoặc rollback ledger. Credential cho loader thuộc hộp nhập riêng của [launcher](../server/scripts/bootstrap-production.cjs); cửa sổ nhập phải hiển thị, các child DB process vẫn ẩn. Không chạy helper password riêng vì stdout của nó chỉ dành cho pipe nội bộ.

## Kiểm tra trực tiếp 2026-10-11

- **Phạm vi:** tiếp tục yêu cầu Atlas + Vercel FE/BE; chỉ xác minh các deployment đã tồn tại, chưa redeploy, đổi env/quyền, seed/import, tạo tài khoản hoặc chạy giao dịch. Giữ nguyên thay đổi local chưa commit.
- Vercel xác nhận cả hai alias Production `Ready`: FE `https://vietverse-nine.vercel.app` và BE `https://vietverse-backend.vercel.app`. Khoảng 22:16 +07:00, FE `/`, BE `/health`, BE `/ready`, FE `/api/v1/stories` đều 200; stories trả danh sách rỗng. Kiểm tra tiếp: FE `/dang-nhap`200, FE `/api/v1/auth/me`401/UNAUTHORIZED, unknown API qua FE và BE404/NOT_FOUND. Đây là bằng chứng kết nối/proxy, không phải nghiệm thu đăng nhập, transaction hoặc nội dung.
- **Quan sát Atlas mới:** trong Database & Network Access → IP Access List, rule `0.0.0.0/0` Active, comment vẫn là `Temporary Vercel connection test`; liên kết edit có `deleteAfterDate` rỗng. Không được suy ra thời hạn từ comment hoặc tiếp tục khẳng định rule hiện tại sẽ hết hạn sau 6 giờ. Database Users vẫn hiển thị quyền `atlasAdmin`. Chỉ mở/xem rồi Cancel, không lưu thay đổi; chưa chốt phương án mạng production hoặc xác nhận rotation/least-privilege. Không lưu IP cá nhân hoặc credential vào bằng chứng.
- Metadata env BE Production có `MONGODB_URI` và các env nền tảng; chưa có bộ `CLOUDINARY_*` hoặc `PAYOS_*`. Cần owner cấu hình trong secret store/provider đúng đích, không gửi secret vào chat, trước khi nghiệm thu thu âm/thanh toán. Không tự tạo credential giả, bật CMS publish hay nạp seed để che danh sách rỗng.
- **Giới hạn:** chưa xác minh database chứa nội dung mong muốn, backup/indexes, tài khoản thật/cookies/IP hai mạng, signed upload hoặc webhook. Các bằng chứng ngày 2026-10-10 bên dưới là lịch sử, không thay thế quan sát hiện tại hoặc đóng các gate này.

Ngày 2026-10-10. Quyết định đã duyệt: project BE riêng, giữ MongoDB/nghiệp vụ/5MiB, direct Cloudinary, Render rollback. **Trạng thái: FE Production đã nối BE Vercel; MongoDB readiness và GET smoke qua FE đã qua sau khi owner mở quyền mạng Atlas tạm 6 giờ; Cloudinary chưa cấu hình.** Quyền mạng tạm không phải cấu hình production lâu dài; đây không phải nghiệm thu đủ nghiệp vụ. Render vẫn giữ làm rollback, webhook chưa chuyển.

URL Preview đã kiểm chứng: https://vietverse-backend-754ru0q09.vercel.app — deployment `dpl_7cuB6M2cYsTbLva1Kqpk3N9mXYzZ`, source commit `b2c8613`, Node22.x. Có Vercel SSO protection, cần đăng nhập Vercel hoặc cơ chế truy cập protected deployment để xem.

URL Production hiện tại: https://vietverse-backend.vercel.app/health — deployment `dpl_C2mLne4U7CW3aJAAJeJvwNyHVUDK`, URL riêng https://vietverse-backend-h9tph45d9.vercel.app, source snapshot `b2c8613` (runtime server không khác HEAD `345077f`). Source redeploy sau cập nhật env MongoDB exit0/READY, alias đúng Production. Trước khi mở mạng, `/health`200/ok nhưng `/ready`503; sau mở quyền mạng tạm, readiness200 như bằng chứng bên dưới. Deployment ngay trước là `dpl_sMv1H7bNScq2ioNCbe6EoixRb9GC`, vẫn giữ trong lịch sử; không rollback về deployment đầu lỗi thiếu JWT/origin.

### MongoDB Production — kết nối đã xác minh, quyền mạng còn tạm

- **Quyết định triển khai của owner:** gắn MongoDB dưới tên `MONGODB_URI` sensitive ở đúng BE Production. Ảnh Drivers sau đó cho thấy cluster khác URI ban đầu; owner yêu cầu thực hiện theo cluster trong ảnh. Đã chuẩn bị hộp nhập mật khẩu riêng và xác minh metadata env cập nhật sau deployment cũ; redeploy để áp dụng env mới. Không đọc lại giá trị sensitive, không đưa credential vào source/file env/Git. Preview, JWT, Render và webhook không đổi.
- **Giả định đã thông báo:** URI không có database path nên driver chọn `test`; chưa xác nhận đây là database chứa nội dung mong muốn. Đổi cluster không tự chuyển dữ liệu cũ. Không seed/import, migrate hoặc apply indexes.
- **Bằng chứng sau redeploy:** BE health200, readiness503/DATABASE_UNAVAILABLE. TLS local tới cả ba node cluster trong ảnh thành công với certificate verification; không gửi credential trong phép thử TLS. Lỗi TLS ở URI ban đầu là bằng chứng của target cũ, không dùng để suy ra lỗi của target mới. TLS local thành công không chứng minh authentication hoặc đường mạng Vercel thành công.
- **Bằng chứng mới sau thay đổi Network Access:** owner xác nhận mật khẩu Database User và tự thêm `0.0.0.0/0` tạm 6 giờ, ảnh cho thấy Active. GET smoke lúc khoảng 21:01 +07:00 ngày 2026-10-10: BE health/readiness200; unknown API qua BE/FE404/NOT_FOUND; FE auth/me không đăng nhập401/UNAUTHORIZED; FE stories200 với danh sách rỗng. Cùng deployment, không sửa env/code hoặc redeploy trong phép kiểm này. Thay đổi allowlist đã khắc phục lỗi kết nối quan sát được; dùng [journal](../plans/journals/2026-10-10-mongodb-production-blocker.md) cho kết quả hiện tại thay vì bằng chứng503 trước đó.
- **Gate vận hành còn lại:** quyền tạm sẽ tự xóa, kết nối mới từ Vercel có thể lỗi lại nếu không có đường mạng được duyệt. Không tự gia hạn hoặc chuyển thành mở Internet vĩnh viễn. Owner cần chọn giải pháp egress cố định/allowlist hoặc phương án mạng phù hợp và xử lý least-privilege: user trong ảnh có quyền admin rộng. Credential từng xuất hiện trong chat phải rotate trực tiếp ngoài chat; nhập mật khẩu riêng không tự chứng minh đã rotate. Không tắt TLS verification hoặc tự đổi quyền user.
- Cloudinary/PayOS, backup, indexes, transaction, bcrypt/auth, cookies và IP qua rewrite vẫn chưa nghiệm thu. GET API có thể ghi bucket limiter và runtime Mongoose có auto-index; không đồng nhất GET-only với bảo đảm không có DB writes.

## Đích và giới hạn

### Proxy FE — đã triển khai theo yêu cầu owner2026-10-10

- **Quyết định triển khai:** owner yêu cầu trỏ FE sang BE Vercel mới sau khi đã được thông báo BE thiếu MongoDB/API503, rồi yêu cầu push code. `client/vercel.json` đổi `/api/:path*` destination từ Render sang `https://vietverse-backend.vercel.app/api/:path*`, giữ SPA rewrite cuối. Không đổi API base URL mặc định `/api/v1` hoặc auth/cookie code.
- **Xác minh deployment:** FE Git integration theo `main`, Root Directory `client`; alias https://vietverse-nine.vercel.app đã chạy source chứa proxy mới. GET `/` và `/dang-nhap` trả200 HTML; `/api/v1/not-found` trả503/DATABASE_UNAVAILABLE, không rơi vào SPA fallback. BE `/health`200. Kiểm env metadata không có `VITE_API_URL` override ở FE Production; không đọc giá trị secret. Bằng chứng rollout nằm trong [review findings](./06-review-findings.md).
- **Env đúng project:** Vercel → project `vietverse-backend` → Settings → Environment Variables → Production là nơi owner bổ sung `MONGODB_URI` đã rotate và Cloudinary, rồi redeploy BE. Có các tên biến MongoDB ở project FE `vietverse` không đồng nghĩa BE nhận được chúng; không tự copy credential hoặc xóa env FE. Dừng nếu target/credential chưa xác nhận, không seed/import/index apply để kiểm deployment.
- GET API qua FE hiện đã qua sau mở mạng tạm; xem mục MongoDB Production cho bằng chứng mới. Audio/PayOS/index/auth đăng nhập/IP/cookie chưa nghiệm thu. JWT BE shell khác Render, phiên đăng nhập cũ không được bảo đảm tương thích. Render và webhook vẫn giữ nguyên. Rollback proxy về `https://vietverse.onrender.com/api/:path*` rồi redeploy FE, không xóa dữ liệu hoặc Render.

### Backend

- BE project riêng, Root Directory `server`, Framework Express native, Node22.x; `src/index.ts` export app không listener. HTTP assembly ở `src/httpApp.ts`; `src/app.ts` chỉ re-export để giữ import tương thích, không import Express. Native builder ưu tiên `app.ts` trước `index.ts`, nên assembly không được đặt ở một entrypoint cạnh tranh. `server/vercel.json` không có legacy builds/catch-all/outputDirectory=dist. Giữ `src/server.ts` cho Render/local. Nếu GitHub integration dùng root repo, Root Directory vẫn server; khi CLI deploy từ server, đừng dùng project FE đã link tại repo root.
- CLI50.33.0 đã đăng nhập. Project BE `vietverse-backend`, ID `prj_GgehqtnUVgmyfSK1puzj2bwTnTi6`, team `team_u8YrHVhiz8VkrTmY3gjloePR`; inspect xác nhận Express/Node22.x/Root Directory `server`. Link FE `vietverse` tại repo root/client được giữ nguyên. Schema Vercel online chấp nhận framework=express.
- **Gate quyền đã giải quyết:** chủ dự án cho phép link/config/env, sau đó yêu cầu deploy Preview trước dù DB/Cloudinary sẽ cung cấp sau. BE giữ SSO protection `all_except_custom_domains`; không pull secret xuống snapshot hoặc cutover. CLI curl đã tạo automation bypass token cho GET smoke, không in token hoặc tắt SSO; token thuộc project settings, không phải env ứng dụng.
- **Env Preview hiện có:** NODE_ENV=production, CMS_PUBLISH_ENABLED=false, CLIENT_ORIGIN=https://vietverse-nine.vercel.app (domain FE được xác minh từ project metadata), JWT_SECRET và JWT_REFRESH_SECRET ngẫu nhiên riêng cho Preview, đặt sensitive và gửi qua stdin; chưa thêm DB cho Preview. **Production sau bổ sung DB:** giữ các env shell và JWT riêng, thêm `MONGODB_URI` sensitive theo yêu cầu owner; không copy Preview hoặc Render. API env metadata xác nhận tên/target, không in/ghi giá trị secret. `server/.env` dùng JWT mẫu, thiếu4 biến Cloudinary và origin không HTTPS nên không copy nguyên bộ. Rotation credential chưa được xác minh; Cloudinary vẫn hoãn, không cấu hình credential giả.
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

QA local 2026-10-12: sửa nhận diện404 lồng của SDK để retry đúng contract. Cả bốn biến Cloudinary local còn thiếu/placeholder; không thay cấu hình Vercel trong lượt sửa này. Test provider double không chứng minh preset/metadata/upload thật; owner cần cấu hình môi trường staging được duyệt và chạy các gate bên dưới trước phát hành.

Preset **signed** (không unsigned); yêu cầu giới hạn max_file_size5242880, allowed_formats webm/mp4/m4a/ogg/mp3/wav, không overwrite. Endpoint resource_type=video dùng cho audio; preset format không đảm bảo audio-only. Preset Production đã xác minh mode/formats/overwrite/metadata, nhưng giao diện không hiển thị `max_file_size`; chưa xác minh giới hạn 5MiB tại provider. Không coi validation bytes khi finalize là bằng chứng provider chặn upload quá cỡ.

### Ảnh CMS

Tạo preset signed riêng `vietverse_content_images_signed` trên account `dh947pv3u`: image upload, `overwrite=false`, public ID tự sinh/không giữ tên file, allowed formats `jpg,png,webp`, media metadata bật nếu có. Backend/FE vẫn chặn 5 MiB; giao diện Cloudinary hiện không lộ `max_file_size` nên đây là gate ứng dụng, không tuyên bố provider limit đã được bật. Vercel Production cần thêm `CLOUDINARY_IMAGE_UPLOAD_PRESET` với đúng tên preset, sau đó redeploy backend. Không đổi preset audio hoặc PayOS.

Đã cấu hình 2026-10-12: preset trên Cloudinary đã được lưu với các option trên; Vercel xác nhận thêm `CLOUDINARY_IMAGE_UPLOAD_PRESET` tại project `vietverse-backend`, Production. Chưa nghiệm thu upload/finalize file thật. Account hiện giới hạn image10MB/25MP; app vẫn áp5MiB.

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

DB readiness và GET qua FE đã xác minh với quyền mạng tạm như mục MongoDB Production. Chưa có Cloudinary/preset/metadata audio thật, bcrypt hash/auth đăng nhập/transaction với DB trên Linux Vercel, index apply, IP/cookies qua rewrite, webhook/cutover hoặc mạng production lâu dài. Audio chưa nghiệm thu. Sau khi bổ sung env cần redeploy và kiểm staging đầy đủ; không gọi chuyển đổi production hoàn tất chỉ vì shell Preview READY hoặc readiness200.

## Audio ops — sửa local 2026-10-13, chưa deploy

Phạm vi và lý do ở [06 — Audio sau chuyển BE sang Vercel](./06-review-findings.md). Mục này chỉ là bước vận hành.

### Env BE

- `LEGACY_RECORDING_UPLOAD_ENABLED`: không đặt (hoặc `false`) ở Production → `POST /recordings` trả 410. Chỉ đặt `true` nếu chủ động cần client multipart cũ. Dev/test mặc định bật.
- Không thêm env mới cho Cloudinary; vẫn là bộ `CLOUDINARY_*` hiện có.

### Cloudinary console (operator làm tay)

1. Preset audio signed (`CLOUDINARY_RECORDING_UPLOAD_PRESET`): bật **Max file size = 5242880** (nếu giao diện gói hiện tại không hiển thị, ghi nhận là chưa có giới hạn phía provider) và **Allowed formats = webm, mp4, m4a, ogg, mp3, wav**; giữ `overwrite=false`, signed.
2. Kiểm hạn mức Admin API mỗi giờ của gói (Settings → Usage/API). Finalize gọi Admin API 1 lần mỗi bản thu; vượt hạn mức nay trả `503 UPLOAD_STORAGE_RATE_LIMITED` kèm `Retry-After`.
3. Không cần đổi preset để rút thời hạn chữ ký: server ký timestamp lùi 45 phút nên quyền upload hết sau ~15 phút. Staging cần xác nhận: upload sau 16 phút kể từ khi cấp intent phải bị Cloudinary từ chối ("Stale request"), upload trong 10 phút phải qua.

### Index

`npm run deploy:indexes` chưa có index cho `AudioCleanupTask` (collection nhỏ, truy vấn thủ công). Trường mới trên `RecordingUploadIntent` (`status: finalizing`, `claimToken`, `claimedAt`) và `Recording.resourceType` là additive, không cần migration.

### Đối soát audio

- Backlog xóa vật lý (xóa hồ sơ bé hoặc bù xóa legacy thất bại): `db.audiocleanuptasks.find({ status: 'pending' })`. Với mỗi bản: gọi destroy đúng `resourceType` (rỗng thì thử `video`, `raw`, `image`) với `invalidate: true`, rồi đặt `status: 'done'`. Không xóa theo wildcard.
- Orphan upload chưa finalize: `db.recordinguploadintents.find({ status: { $ne: 'completed' }, expiresAt: { $lt: new Date() } }, { publicId: 1, childId: 1, createdAt: 1 })`. Với mỗi publicId: kiểm `db.recordings.countDocuments({ publicId })` bằng 0 và asset tồn tại trên Cloudinary trước khi xóa, ghi audit. Intent chưa hoàn tất giữ 30 ngày, nên chạy đối soát ít nhất mỗi tháng; intent tạo trước bản sửa chỉ giữ 7 ngày.
- Intent kẹt `finalizing` quá 45 giây sẽ được finalize sau chiếm lại; không cần sửa tay.

### Cần test trên thiết bị/provider thật trước khi phát hành

- Upload + finalize thật: Chrome desktop (WebM/Opus), Chrome Android, iOS Safari (`audio/mp4`). Ghi lại metadata Cloudinary trả về (`duration`, `is_audio`, `video`, `width/height`) để xác nhận nhánh chấp nhận thiếu duration và nhánh video placeholder là đúng thực tế.
- File video thật (mp4 có hình) và file > 5 MiB phải bị từ chối.
- Hai tab bấm gửi cùng lúc: cả hai nhận cùng receipt.
- Xóa hồ sơ bé có bản thu: URL audio cũ trả 404 sau khi CDN hết cache; `audiocleanuptasks` rỗng.
- TTS: iOS Safari (nút đọc lần đầu sau tải trang, đọc sau khi asset lỗi), Android có giọng `vi_VN`; watchdog không được dừng nhầm khi máy đang đọc.
- Mạng yếu (throttle): nút gửi nhả sau tối đa 60 giây, "Thử gửi lại" không upload lại khi file đã lên provider.

## Region và hiệu năng — sửa local 2026-10-13, chưa deploy

### Region function (P1)

- **Sự thật đã xác minh:** cluster MongoDB Atlas Production nằm ở **AWS ap-east-1 (Hong Kong)**, gói M0 (SRV/CNAME `mtm-aws-ape1-...`). Trước bản sửa, `server/vercel.json` không có `regions` nên function chạy ở `iad1` (Washington): mỗi lượt Mongo qua Thái Bình Dương thêm ~200 ms.
- **Quyết định kỹ thuật:** `server/vercel.json` đặt `"regions": ["hkg1"]` (Vercel Hong Kong, cùng metro với Atlas ap-east-1, cũng là edge gần người dùng Việt Nam). Không đặt `maxDuration`: các handler hiện kết thúc dưới giới hạn mặc định và upload 5 MiB đi thẳng browser→Cloudinary.
- **Project setting không được ghi đè:** Vercel → project `vietverse-backend` → Settings → Functions → Function Region phải để `hkg1` (hoặc để trống cho `vercel.json` quyết định). Nếu dashboard đặt region khác, deployment mới vẫn có thể chạy sai chỗ. Sau deploy, kiểm tra trong Deployment → Functions rằng region là `hkg1`.
- **Giả định cần owner xác nhận:** gói Vercel hiện tại cho phép chọn region function (Hobby chỉ cho một region, `hkg1` nằm trong danh sách; Pro cho nhiều). Nếu deploy báo lỗi region thì dừng và báo owner, không tự đổi gói.
- Smoke sau deploy: `/health` và `/api/v1/culture` từ Việt Nam; kỳ vọng `/culture` giảm từ ~0,8 s xuống ~0,1–0,2 s khi warm.

### Index thủ công vì `autoIndex: false`

- `server/src/config/db.ts`: khi `NODE_ENV=production` kết nối với `autoIndex: false`, `autoCreate: false`, `socketTimeoutMS: 45000` (pool giữ max 5/min 0). Dev/test vẫn auto-index.
- Nguồn index duy nhất cho Production là `npm run deploy:indexes -w server` (dry-run, không kết nối DB) và `npm run deploy:indexes -w server -- --apply`. Script nay tự nạp **mọi model** trong `server/src/models` và gọi `Model.createIndexes()` (cùng tên index Mongoose auto-index từng tạo, không drop/sync), cộng index vận hành `paymentorders.status_1_paidAt_1` cho báo cáo doanh thu.
- **Trình tự bắt buộc:** chạy dry-run để xem plan → backup/xác nhận đích → `--apply` trên Production **trước** khi deploy bản BE có `autoIndex:false`. Index đã tồn tại là no-op; conflict tên/option làm script dừng để đối soát tay. Mỗi khi thêm index vào schema về sau, phải chạy lại `--apply` trước/cùng lúc deploy.

### Cache tĩnh FE

- `client/vercel.json` thêm header: `/assets/(.*)` → `public, max-age=31536000, immutable` (file có hash), `/images/(.*)` → `public, max-age=86400`. Rewrites giữ nguyên. Lưu ý: chunk cũ đã bị xóa sau deploy rơi vào SPA rewrite và nhận HTML với header immutable; URL có hash nên không ảnh hưởng chunk mới.
- Smoke sau deploy FE: `curl -I https://vietverse-nine.vercel.app/assets/<file>.js` có `cache-control: public, max-age=31536000, immutable`.
