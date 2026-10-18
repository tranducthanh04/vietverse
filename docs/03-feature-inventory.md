# 03 — Feature inventory và trạng thái baseline

## Đợt thực hiện audit khách hàng — 2026-10-18, local

- Backend: legacy grading không tin cờ đúng của client; subscription yêu cầu active/ngày hết hạn đầy đủ; đổi quà ảo chặn trừ trùng trong atomic write; finalize đọc lại receipt để tránh 404 khi request khác vừa commit. Không đổi mức điểm, ngưỡng đỗ, API payload hoặc DB schema.
- Bài `record_voice`: hiển thị `subPrompt`, thêm nút nghe mẫu với audio nguồn hoặc TTS có nhãn. Ẩn/dừng mẫu khi xin quyền micro, đang thu hoặc nghe lại bản của bé. Nghe mẫu không hoàn thành activity; hoàn thành vẫn cần upload receipt.
- Kho bản thu phụ huynh: lỗi tải có thông báo/thử lại, không giả thành danh sách rỗng; lỗi phát có thông báo và cho bấm phát lại. Đổi bé dừng audio và xóa lỗi cũ.
- Bài `sort_order`: nút "Xếp lại" còn hiện sau khi chọn đủ thẻ nhưng sai thứ tự; khôi phục đủ thẻ, kể cả từ lặp. Bấm reset không gọi `onComplete`; chọn đủ thẻ lần tiếp theo vẫn dùng cách chấm/tim hiện có. Không thay quy tắc cho tiếp tục sau câu sai; phần đó còn chờ quyết định player/song ngữ.
- F08 và phần admin của F12 **đã tích hợp local**: chi tiết học viên giữ đúng 0 điểm/0 sao, phân biệt trạng thái tiến độ, giới hạn 0 là không giới hạn; dữ liệu thiếu không tự điền thành tích. Lỗi tải có thông báo/thử lại, hồ sơ không tồn tại có trạng thái riêng. Không đổi API/điểm/quyền; xem `docs/admin-learner-progress.md` và bằng chứng từ chat đồng hành tại `plans/reports/2026-10-18-parallel-customer-completion.md`. Chưa nghiệm thu browser thật/deploy.
- **Chưa đóng:** F01 phần bắt buộc retry/gợi ý, F13 song ngữ, thiếu provider/audio được duyệt, lỗi cấu hình storage production, nghiệm thu iOS/Android thật, late-upload cleanup, curriculum và các mục khác của audit. Chuẩn bị PR cho phần đã hoàn thành không đồng nghĩa đóng toàn bộ kế hoạch. Chi tiết tiến độ trong `plans/journals/2026-10-18-customer-completion.md`.

## Chuyển bài tiếp theo sau khi hoàn thành — 2026-10-17, local

- Màn hình hoàn thành bài giờ có nút "Bài tiếp theo" khi bài vừa làm đã đạt và còn bài kế mở khóa; bấm vào mở thẳng bài kế (`/hoc/:id`) thay vì bắt quay lại bản đồ. Hoàn thành bài cũng làm mới danh mục `/stages` để bản đồ mở khóa bài kế ngay.
- **Quyết định nghiệp vụ/giả định:** chỉ hiện nút khi `passed`; bài kế cùng chặng mở ngay sau khi đạt, bài đầu chặng sau vẫn theo cổng gói trả phí/hoàn thành chặng (dùng cờ `isUnlocked` từ `/stages`). Quyền mở khóa vẫn do server `assertLessonUnlocked` thực thi; không đổi API/điểm/quyền.

## i18n giao diện + nút chuyển ngôn ngữ — 2026-10-17, local

- **Hạ tầng i18n nhẹ** tại `client/src/i18n/`: từ điển typed `vi`/`en` (kiểu `Dictionary` ép `en` đủ khoá của `vi`), translator có nội suy `{param}` và rơi về `vi` rồi về chính khoá khi thiếu, hook `useT()`/`useUiLanguage()`, store zustand (`useUiLanguageStore`) nhớ lựa chọn trong `localStorage` (bọc `try/catch`). Không thêm dependency. `vi` tái dùng chuỗi sẵn có từ `client/src/locales/vi.ts`.
- **Nút chuyển VI/EN** (`LanguageSwitcher`) ở header public, khu bé và phụ huynh; `aria-label`, vùng chạm ≥44px; `App.tsx` đồng bộ `document.documentElement.lang`.
- **Sửa local 2026-10-18:** nút VI/EN khu bé và phụ huynh không còn bị ẩn dưới 640px; header xuống hàng khi thiếu chỗ, giữ vùng chạm 44px và quy tắc nhớ ngôn ngữ hiện tại. CMS đồng bộ vị trí bản dịch của lyrics/vocab/funFacts khi thêm/xóa/đổi thứ tự dòng nguồn; không tự sửa bản dịch đã lệch trong dữ liệu cũ. Đây là quyết định kỹ thuật, không đổi API, quyền, điểm hoặc chính sách ngôn ngữ.
- **Ngôn ngữ mặc định**: manual (người dùng chọn) → `companionLanguages[0]` của bé đang chọn → `vi`. Chỉ `en` có bản dịch riêng; ngôn ngữ đồng hành khác dùng giao diện `en` (quyết định owner 2026-10-17).
- **Đã dịch chữ giao diện**: layout public + Landing/Pricing/404; layout khu bé + QuestMap, lesson player và toàn bộ activity (word_card, review, listen_choose, drag_match, sort_order, fill_blank + 4 activity mới), VictoryModal, Parent Gate, ScreenTimeLimitModal, PointsShop, TreasureRoom; layout phụ huynh + Dashboard/Journey/Recordings/Settings/PaymentResult/PaymentTest; onboarding; đăng nhập/đăng ký/Google; danh sách truyện và văn hoá; các component dùng chung (Button, Modal, PageLoader, ProtectedRoute, ProgressBar, SkipLink, AudioButton, QueryErrorState, ChildSessionGuard).
- **Giữ tiếng Việt (có chủ đích)**: nội dung học (bài, truyện, văn hoá, câu hỏi, từ vựng, TTS đọc nội dung); Admin/CMS. Lượt tích hợp 2026-10-17 (owner yêu cầu "làm luôn") đã dịch thêm: lý do cộng/trừ điểm và "Hôm nay/Hôm qua" trong sổ điểm (`pointLabels.ts` nhận tham số ngôn ngữ, mặc định `vi`), khung bài chờ đồng bộ offline, và tên/mô tả/trạng thái 4 năng lực trong báo cáo phụ huynh. Năng lực được dịch ở client theo `key` cố định và 3 trạng thái cố định; server vẫn trả tiếng Việt và client dùng nguyên chuỗi server làm dự phòng nếu xuất hiện khoá mới.
- Lượt tích hợp 2026-10-17 dịch thêm chữ giao diện của trang chi tiết truyện và văn hoá (`storyDetail`, `cultureDetail`); nội dung bài và bản dịch nội dung vẫn theo quy tắc riêng.
- Kiểm chứng local: typecheck qua; frontend 243/243 test qua (thêm `i18n.test.tsx`: bắt khoá thiếu, chuyển ngôn ngữ đổi chữ header, bé `en` vào khu bé thấy tiếng Anh, nhớ lựa chọn thủ công); lint 0 lỗi. Chưa deploy/nghiệm thu thiết bị thật.

## Lesson word card — bố cục đoạn đọc 2026-10-15, local

- Thẻ tự tăng chiều cao theo nội dung; đoạn văn dài trong `targetWord` hiển thị chữ nhỏ hơn, căn trái và xuống dòng, không tràn lên hướng dẫn/mascot. Chữ và từ ngắn vẫn nổi bật. Áp dụng chung cho lesson player và CMS preview.
- **Quyết định kỹ thuật/giả định trình bày:** hơn 12 ký tự (chuẩn hóa NFC), hơn 2 từ hoặc có xuống dòng được trình bày như đoạn đọc; không phải phân loại nghiệp vụ hay giới hạn nội dung.
- Giữ nguyên `subPrompt`, nút đọc đoạn riêng, audio/TTS của `targetWord` và quy tắc hoàn thành/điểm. Tương thích dữ liệu cũ, không cần seed/migrate DB; không đổi API/quyền.
- Chưa push/deploy; kiểm tra component/CSS thật ở 320/390/1366px, thêm E2E route bài học thật ở 390/1366px với API/DB local. Không phải nghiệm thu production. Chi tiết tại `plans/261015-word-card-layout/plan.md`; QA toàn dự án tại `plans/261015-project-qa/qa-report.md`.

## PayOS — xác nhận webhook 2026-10-14, local

- Đã tái hiện request theo mẫu PayOS, ký bằng key test: mã đơn chưa có trong DB bị trả 404, chặn xác nhận webhook cần 2xx.
- Webhook đúng schema và chữ ký nhưng không tìm thấy ở cả `PaymentTestOrder`/`PaymentOrder` nay được ACK 200 với `ignored: true`, không ghi DB hoặc mở gói. Có warning để đối soát đơn lạ; không coi ACK là thanh toán thành công.
- Sai chữ ký/số tiền vẫn trả 400, thêm mã `PAYOS_INVALID_SIGNATURE`/`PAYOS_AMOUNT_MISMATCH` để phân biệt nguyên nhân. Không nới schema hoặc bỏ xác minh SDK.
- Chưa deploy hoặc xác nhận portal hết lỗi 400; cần bản sửa chạy trên backend và key cùng kênh PayOS. Lần Actions đã kiểm tra trước đó thất bại `missing server host`, không phải bằng chứng deploy thành công.

## PayOS — chuẩn bị cấu hình 2026-10-13, local

- Owner yêu cầu tiếp tục tích hợp sau lần hoãn 2026-10-12; giữ giá và quyền lợi hiện có. File mẫu có ba biến PayOS trống, key thật chỉ ở backend environment.
- Checkout mua gói chủ động gắn mã đơn trong cả return/cancel URL; chỉ webhook hợp lệ mới nâng cấp gói, không tin query trả về.
- Chưa deploy thay đổi hoặc nghiệm thu chuyển khoản thật. Production cần nạp key riêng, đăng ký đúng webhook `/api/v1/payments/webhook` và kiểm tra MongoDB transaction; xem `05-api-and-data-contracts.md`.

## Feedback 2026-10-12 — triển khai local, chưa deploy

- Giá tháng mới 250.000đ, năm giữ 990.000đ; QR/PayOS hoãn theo owner.
- Lesson word card có nút đọc đoạn `subPrompt` riêng với audio từ ngắn. Hướng dẫn bốn activity mới dùng chung điều khiển audio/TTS; không đổi câu trả lời/điểm.
- Story/đồng dao có fallback đọc từng dòng; culture đọc title/intro/funFacts. Ưu tiên asset thật, phân biệt giọng thiết bị, dừng khi đổi nguồn/nội dung/unmount; TTS không có timeline giả.
- Chưa có UI song ngữ hoặc bản dịch ngoại ngữ trong catalog. `lang` của bộ đọc là chuẩn bị kỹ thuật, không đồng nghĩa đã triển khai nội dung đa ngôn ngữ. Xem [đầu vào cần khách hàng cung cấp](./customer-audio-translations.md).

| Nhóm | Tính năng | UI | API/server | Dữ liệu chính | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Auth | Đăng ký/đăng nhập | Có | Có JWT + refresh cookie | User, Subscription | Hoàn thiện |
| Auth | Refresh/logout | Có Axios interceptor | Có rotation theo family + revoke DB | RefreshToken | Hoàn thiện (P1.1) |
| Auth | Google SSO | Nút UI ở đăng nhập/đăng ký, liên kết email cũ bằng mật khẩu Vietverse | Google Identity Services ID token + nonce một lần, JWT/refresh hiện tại | User.googleId, GoogleAuthFlow | Đã triển khai code; cần `GOOGLE_CLIENT_ID`, Authorized JS origins và nghiệm thu browser Google thật |
| Subscription | Xem gói và tạo checkout | Bảng giá gọi checkout; trang cài đặt hiển thị gói hiện tại/trạng thái quay về | Tạo payment link PayOS; xác minh chữ ký + amount trên webhook; cập nhật subscription trong transaction | PaymentOrder, Subscription | Đã triển khai code; cần cấu hình credentials/webhook URL và kiểm thử giao dịch PayOS trước khi mở production |
| Phụ huynh | Thanh toán thử PayOS | `/phu-huynh/thanh-toan-thu`, nút tạo link cố định 10.000đ và theo dõi webhook | API yêu cầu đăng nhập parent/admin; ghi riêng `PaymentTestOrder`; webhook xác minh chữ ký và amount, không tác động subscription | PaymentTestOrder | Đã triển khai; khoản tiền là thật trên production, chỉ xác nhận end-to-end sau khi phụ huynh tự chuyển khoản |
| Onboarding | Tạo hồ sơ bé | Wizard 4 bước, chọn nhiều ngôn ngữ | `POST /children` giữ tương thích trường singular | Child | Đã deploy FE/BE 2026-10-11; local tests qua, chưa tạo hồ sơ production để nghiệm thu |
| Child | Chuyển/Xóa hồ sơ | Có dropdown & nút xóa | `PATCH /children/:id/select`, `DELETE /children/:id` | Child, Progress, Recording | Hoàn thiện (P1.6 cascade delete) |
| Map | Bản đồ 5 chặng | Có | `GET /stages` | Stage, LessonProgress | Hoàn thiện (P1.2 unlock policy) |
| Lesson | Lesson player | 7 loại cũ + multi_select/group_sort/fill_blanks/follow_steps | `GET /lessons/:id?activityContract=2`, `POST /lessons/:id/complete` | Lesson, LessonProgress | Triển khai local 2026-10-09; loại mới ghi nhận trung tính, chấm server; chưa xác nhận deploy/content production |
| Lesson | Tim/gợi ý/offline session | Có | IndexedDB + Offline Sync Queue localStorage | lesson session, queue | Hoàn thiện (P1.5) |
| Recording | Thu âm | MediaRecorder elapsed auto-stop179s margin1s/background, upload trực tiếp production, guard phiên/retry finalize/explicit expired resend | Multipart legacy; `/recordings/upload-intent`, `/recordings/finalize` | Recording, RecordingUploadIntent, Cloudinary | Triển khai local, review2026-10-10; server strict180s, metadata/preset thật và rollout production chưa nghiệm thu |
| Stories | Kho truyện/đồng dao | Có | GET public, mark explored auth; admin draft cover upload | Story, ExplorationLog, ContentDraft | Hoàn thiện (P1.3 idempotency, P2.5 safe search); cover upload production gate riêng |
| Culture | Bài văn hóa/narration | Có | GET public, quiz auth; admin draft cover upload | CultureArticle, ExplorationLog, ContentDraft | Hoàn thiện (P2.5 safe search); cover upload production gate riêng |
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
| Admin | Doanh thu | Có | `GET /admin/revenue`, `/admin/doanh-thu` | PaymentOrder | Hoàn thiện local 2026-10-13; chỉ tính đơn subscription đã completed, không tính giao dịch test |
| Admin | Provision tài khoản | Hộp nhập riêng trên Windows | Offline, không có endpoint cấp quyền public | User, seed_locks | Đã tạo một admin trên `test` và kiểm tra login/RBAC production 2026-10-11; xem `admin-provisioning.md` |
| Admin | Learners | Có | `GET /admin/learners` | Child/User | Hoàn thiện (Limit 100) |
| Admin | CMS lesson/story/culture | List/filter, form đầy đủ, nháp, preview độc lập, signed cover upload, publish/ẩn có xác nhận | `/admin/content/:kind`, `/admin/content-images/*` | ContentDraft, ContentRevision, live, AdminAuditLog, Cloudinary image | Đã triển khai local 2026-10-12; cover upload cần preset/env/deploy; publish mặc định tắt, chưa import production |
| Admin | Redemptions | Có | GET/PATCH admin | Redemption | Hoàn thiện (P1.7 Zod validation, P2.5 limit 100) |
| Platform | Health/deploy | FE Vercel giữ proxy hiện hữu; BE có native Express config | `/health`, `/ready`, Mongo rate limit chung; Render giữ rollback | Env, RateLimitBucket | Triển khai local 2026-10-09; chưa chuyển traffic production. Xem runbook Vercel |

## Mức hoàn thiện nội dung seed (đối chiếu 2026-10-08)

Bổ sung review recording2026-10-10: explicit resend intent mới giữ Blob, monotonic auto-stop179s margin1s/background, stable legacy asset/commit reconciliation, intent/delete transaction. Project BE đã tạo nhưng chưa deploy/cutover; metadata/device/native/IP/cookie/webhook vẫn chờ staging. Không thay điểm, business unlock hoặc nội dung.

Bổ sung CMS 2026-10-09: bộ nhập có nguồn 20 giáo án/21 bài đọc/tám nhóm văn hóa tạo draft, không ghi đè seed/live. Xem [coverage](./customer-source/2026-10-09/coverage.md). Hoạt động không hỗ trợ và nội dung/media thiếu vẫn cần biên tập; số draft không phải số bài đủ điều kiện phát hành.

- Seed insert-only tạo 5 chặng × 4 bài, 6 hoạt động/bài thông thường và 5 hoạt động ở bài 20.
- Stories seed 21 bài đọc biên tập có thể thiếu audio; không khẳng định là lời nguyên tác hoặc đã có quyền sử dụng.
- QA 2026-10-12: card truyện hiện `Bản đọc` khi không có audio, `Có bản thu` khi có audio nhưng thiếu duration hợp lệ; chỉ hiện số giây khi duration dương hữu hạn.
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



