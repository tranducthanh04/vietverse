# 03 — Feature inventory và trạng thái baseline

## Ảnh bìa dự phòng an toàn — 2026-10-19, local

- `CoverPlaceholder` chỉ chọn icon theo khóa khai báo trực tiếp; category lạ như `constructor` không còn làm sập màn truyện/văn hóa. Giữ icon/màu hiện có, `className`, `aria-hidden` và ảnh thật nếu có.
- Sửa kỹ thuật, không đổi taxonomy/API/dữ liệu/quyền/điểm/audio. Contract và giới hạn tại [cover-placeholder-safe.md](./cover-placeholder-safe.md).

## Map child greeting - 2026-10-19, local

- MAP-CHILD-GREETING adds the selected child's name using existing VI/EN UI copy,
  plain text and full-name wrapping. No extra request or change to map navigation,
  guards, permissions, points or audio. Decisions, presentation assumption and
  verification limits: [map-child-greeting.md](./map-child-greeting.md).

## Điều hướng footer công khai — 2026-10-18, local

- FOOTER-NAV: bổ sung `Khóa học` / `Courses` tới `/gia` và `Lộ trình học tập` / `Learning roadmap` tới `/#lo-trinh-hoc-tap`; giữ nguyên bốn liên kết cũ, liên hệ và trạng thái legal chưa khả dụng.
- **Giả định trình bày:** lộ trình là phần năm chặng hiện có trên Landing, không tạo trang/học liệu mới. Khách xem được không cần đăng nhập; không đổi quyền học, API hoặc điểm. Chi tiết và giới hạn tại [footer-navigation.md](./footer-navigation.md).

## Nhận diện thương hiệu header khu bé — 2026-10-18, local

- KIDS-HEADER-BRANDING: bổ sung wordmark `app.name` và đầy đủ `publicNav.subtagline` VI/EN vào `KidsLayout`, dùng link semantic tới trang chủ `/` hiện có. Nguồn khách: tab cấu trúc, mục `HEADER CHUNG` → `Bên trái`; không tạo logo asset, copy hoặc route mới.
- **Giả định trình bày:** brand chiếm hàng riêng dưới breakpoint `lg`, tối đa 18rem từ `lg`, tagline 12px cho phép xuống dòng; header và nhóm control wrap khi thiếu chỗ. Giữ sticky header, vùng chạm 44px, sáu mục điều hướng PR #19, link điểm PR #16, chọn bé, Parent Gate, VI/EN và nút admin.
- Không đổi API/store/điểm/auth/checkout/audio hoặc menu avatar. Chỉ hoàn thiện phần brand/tagline, không tuyên bố toàn bộ header đã khớp Docs. Kiểm chứng: 374 test client, typecheck/build/lint qua; 32 ca browser và 8 ca sát breakpoint qua, review độc lập không có finding cần sửa. Nguồn, test và giới hạn tại [kids-header-branding.md](./kids-header-branding.md); chưa xác nhận merge/deploy.

## Refresh/logout nguyên tử — 2026-10-18, local

- Rotation, thu hồi family khi reuse và logout các phiên hiện có dùng transaction với cùng khóa ghi `User.__v` theo tài khoản. Tiêu thụ token cũ, tạo token mới và đọc profile trả về trong cùng transaction; lỗi trước commit không để token bị tiêu thụ một nửa.
- Giữ chính sách reuse nghiêm ngặt, **không thêm grace period**: dùng lại token đã revoked thu hồi family, commit trước khi trả 401. Access JWT vẫn 15 phút; login/Google tạo family mới nằm ngoài khóa này, không hứa account logout chặn đăng nhập mới đồng thời.
- Lỗi DB tạm thời trả 503 `DATABASE_UNAVAILABLE`, JWT sai/hết hạn trả 401, lỗi lập trình không bị đổi thành lỗi đăng nhập. Không set/clear refresh cookie khi thao tác thất bại. Mất ACK commit có thể trả 503 dù DB đã commit; không bảo đảm mọi 503 cho phép dùng lại token cũ.
- Cần MongoDB replica set, không migration/schema mới. Chi tiết timeout, giới hạn và kiểm chứng tại [auth-session-rotation.md](./auth-session-rotation.md). Đây là scope auth riêng, không gồm audio/F04/PIN/email policy hoặc PR #18; chưa thu hồi phiên production/deploy.

## Điều hướng Khóa học khu bé — 2026-10-18, local

- KIDS-COURSES-NAV: thêm liên kết `Khóa học` / `Courses` tới `/gia`, giữ đủ năm mục cũ, số dư ViVi, chọn bé và Parent Gate. Không đổi checkout, quyền học, điểm hoặc API.
- **Giả định trình bày:** thanh dưới chia 3 cột/2 hàng dưới 400px, 6 cột từ 400px; giữ nhãn đầy đủ và khoảng đệm cuối trang tương ứng. Yêu cầu, bằng chứng và giới hạn tại [kids-courses-navigation.md](./kids-courses-navigation.md).

## Tích hợp liên kết chặng — 2026-10-18, local

- Tích hợp PARENT-STAGE-LINKS với thanh điều hướng khu bé: tab chặng dài giới hạn chiều rộng và xuống dòng, không phóng to tab active; giữ nguyên lựa chọn URL và quyền học. Giả định trình bày và kiểm tra layout thật tại [parent-stage-links.md](./parent-stage-links.md).

## Header công khai VI/EN — 2026-10-18, local

- Sửa tràn nút khi chuyển tiếng Việt: nới khung desktop, điều chỉnh khoảng cách menu/slogan theo breakpoint; trên màn nhỏ, thao tác tài khoản vẫn truy cập qua menu. VI/EN luôn hiện với vùng bấm 44px.
- Quyết định kỹ thuật, không đổi nghiệp vụ/API/quyền/điểm. Quy tắc trình bày, test trình duyệt và giới hạn tại [public-header-responsive.md](./public-header-responsive.md).

## CTA đăng ký trên Landing — 2026-10-18, local

Ba CTA chính trên Landing dẫn khách thẳng tới `/dang-ky`; người đã đăng nhập giữ đích cũ. Tạm chờ khi chưa xác định xong phiên; không đổi thẻ khám phá, copy, quyền hay API. Quyết định, giả định và bằng chứng tại [landing-register-cta.md](./landing-register-cta.md) (2026-10-18, sửa local, chờ review/merge).

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

## Nguồn bản dịch Khám phá — 2026-10-18, local

F13 prerequisite (2026-10-18): [nguồn bản dịch Khám phá](./customer-source/2026-10-18/coverage.md) đã được lưu riêng kèm checksum, catalog chỉ đọc và coverage B1-B20. Chưa áp dụng vào player/importer/model; không coi đây là đã hoàn tất song ngữ hoặc audio.

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

## Phản hồi khi trả lời sai — triển khai local 2026-10-19

- Hoạt động chấm ngay (`listen_choose`, `review`, `fill_blank`, `sort_order`): khi bé chọn sai, hiện gợi ý ngắn ngay dưới câu hỏi (vùng `role="status"`/`aria-live`) và — với hoạt động có audio nguồn — tự phát lại audio một lần kèm nút "Nghe lại". Dùng lại engine `useNarration`/`AudioButton` (một-chủ-phát, không chồng, không lặp vô hạn; thiết bị thiếu giọng đọc hiện thông báo thân thiện). Đúng thì không phát lại/không gợi ý.
- Gợi ý ưu tiên nội dung `wrongHint` của hoạt động + bản dịch theo `companionLanguages` (dùng `SupportTranslation`); thiếu nội dung thì dùng câu động viên chung theo i18n (vi/en). Model `Lesson.activity` thêm `wrongHint`/`wrongHintTranslations` tùy chọn, tương thích ngược; CMS `ActivityEditor` có khối nhập. **Không** đổi chấm điểm/sao/tim/số lần thử; server vẫn chấm độc lập.
- Seed demo gắn gợi ý mẫu cho bài "Con vật quanh em" ("cá = fish…", "mèo = cat…") — bản nháp minh hoạ chờ content owner duyệt. Chưa push/deploy; kiểm tra ở 390/1366px, VI/EN với API/DB local.

| Nhóm | Tính năng | UI | API/server | Dữ liệu chính | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| Auth | Đăng ký/đăng nhập | Có | Có JWT + refresh cookie | User, Subscription | Hoàn thiện |
| Auth | Refresh/logout | Có Axios interceptor | Rotation/revoke cùng transaction và khóa tài khoản | RefreshToken, User.__v | P1.1 có bản sửa concurrency local 2026-10-18; xem giới hạn ở đầu tài liệu |
| Auth | Google SSO | Nút UI ở đăng nhập/đăng ký, liên kết email cũ bằng mật khẩu Vietverse | Google Identity Services ID token + nonce một lần, JWT/refresh hiện tại | User.googleId, GoogleAuthFlow | Đã triển khai code; cần `GOOGLE_CLIENT_ID`, Authorized JS origins và nghiệm thu browser Google thật |
| Subscription | Xem gói và tạo checkout | Bảng giá gọi checkout; trang cài đặt hiển thị gói hiện tại/trạng thái quay về | Tạo payment link PayOS; xác minh chữ ký + amount trên webhook; cập nhật subscription trong transaction | PaymentOrder, Subscription | Đã triển khai code; cần cấu hình credentials/webhook URL và kiểm thử giao dịch PayOS trước khi mở production |
| Phụ huynh | Thanh toán thử PayOS | `/phu-huynh/thanh-toan-thu`, nút tạo link cố định 10.000đ và theo dõi webhook | API yêu cầu đăng nhập parent/admin; ghi riêng `PaymentTestOrder`; webhook xác minh chữ ký và amount, không tác động subscription | PaymentTestOrder | Đã triển khai; khoản tiền là thật trên production, chỉ xác nhận end-to-end sau khi phụ huynh tự chuyển khoản |
| Onboarding | Tạo hồ sơ bé | Wizard 4 bước, chọn nhiều ngôn ngữ | `POST /children` giữ tương thích trường singular | Child | Đã deploy FE/BE 2026-10-11; local tests qua, chưa tạo hồ sơ production để nghiệm thu |
| Child | Chuyển/Xóa hồ sơ | Có dropdown & nút xóa | `PATCH /children/:id/select`, `DELETE /children/:id` | Child, Progress, Recording | Hoàn thiện (P1.6 cascade delete) |
| Map | Bản đồ 5 chặng | Có | `GET /stages` | Stage, LessonProgress | Hoàn thiện (P1.2 unlock policy) |
| Parent/Map | Liên kết từng chặng | Xem chi tiết/Tiếp tục theo bé đang xem; chọn chặng qua URL, giữ history, báo ID sai/đổi bé/khóa/rỗng | API hiện có, không cấp quyền từ query | Không đổi dữ liệu | Sửa local 2026-10-18; xem [parent-stage-links.md](./parent-stage-links.md), chờ review/merge |
| Lesson | Lesson player | 7 loại cũ + multi_select/group_sort/fill_blanks/follow_steps | `GET /lessons/:id?activityContract=2`, `POST /lessons/:id/complete` | Lesson, LessonProgress | Triển khai local 2026-10-09; loại mới ghi nhận trung tính, chấm server; chưa xác nhận deploy/content production |
| Lesson | Tim/gợi ý/offline session | Có | IndexedDB + Offline Sync Queue localStorage | lesson session, queue | Hoàn thiện (P1.5) |
| Recording | Thu âm | MediaRecorder elapsed auto-stop179s margin1s/background, một lần upload multipart lên ổ đĩa BE, guard phiên và retry an toàn (giữ Blob, chia sẻ một request in-flight) | `POST /recordings/upload` (audio + childId/lessonId/activityId/contentVersion); nghe lại bằng URL token `/recordings/:id/audio?t=` | Recording, ổ đĩa BE (`AUDIO_STORAGE_DIR`) | FE nhánh `feat/audio-local-fe` theo hợp đồng audio BE 2026-10-19; bỏ hẳn Cloudinary/intent/finalize; endpoint BE ở phase song song, chưa nghiệm thu production |
| Stories | Kho truyện/đồng dao | Có | GET public, mark explored auth; admin draft cover upload | Story, ExplorationLog, ContentDraft | Hoàn thiện (P1.3 idempotency, P2.5 safe search); cover upload production gate riêng |
| Culture | Bài văn hóa/narration | Có | GET public, quiz auth; admin draft cover upload | CultureArticle, ExplorationLog, ContentDraft | Hoàn thiện (P2.5 safe search); cover upload production gate riêng |
| Culture | Quiz +5 điểm | Có | `POST /culture/:id/quiz` | PointTransaction, Child | Hoàn thiện (P1.3 idempotency & compensation) |
| Points | Lịch sử điểm | Bảng cộng/trừ, Hôm nay/Hôm qua, Xem thêm | `GET /points/children/:childId` | PointTransaction | Mở rộng 2026-10-09: phân trang cursor, `totalEarned` |
| Points | Liên kết số dư header khu bé | Pill ViVi mở `/diem-thuong` bằng click hoặc Enter; nhãn VI/EN gồm đích và số dư bé hiện tại | Giữ nguyên route/guard/API | Child.viviPoints | NAV-POINTS-LINK, kiểm chứng local 2026-10-18; không đổi cách tính điểm |
| Points | Điểm theo hoạt động | +1 mỗi hoạt động đạt lần đầu | Nộp bài | PointTransaction, Child | Mới 2026-10-09 (giả định chỉ khi đỗ) |
| Points | Quy tắc điểm cấu hình | Trang admin `/admin/quy-tac-diem` | `GET/PATCH /admin/point-rules` | PointRule, AdminAuditLog | Mới 2026-10-09 |
| Shop | Loại vật phẩm và dùng avatar/khung | Tab lọc 4 loại + quà hiện vật; Phòng báu vật có Dùng/Đang dùng; header khu bé | `/points/children/:childId/collection`, `/equip`, `POST /admin/inventory` | ShopItem, Child | Mới 2026-10-09 |
| Shop | Kho vật phẩm | Có hiển thị tồn kho | `GET /points/shop/items` | ShopItem | Hoàn thiện (P0.2 stock display) |
| Shop | Đổi quà ảo/vật lý | Có | `POST /points/shop/redeem` | Child, PointTransaction, Redemption | Hoàn thiện (P0.2 atomic stock decrement & rollback) |
| Parent | Dashboard tiến độ và năng lực | Chặng hiện tại, tiến độ theo catalog, 10 hoạt động, số dư/liên kết kho điểm, 4 năng lực tham khảo | `GET /parent/progress/:childId` | Stage, Lesson, LessonProgress, Recording, ExplorationLog | Mở rộng 2026-10-09; giữ Parent Gate và ownership, chưa phải đánh giá chuyên môn |
| Parent | Bản thu âm | Có, nghe lại bằng URL token của BE (FE rebase `/api/...` sang origin API) | `GET /recordings/children/:childId` | Recording | Hoàn thiện; nguồn audio chuyển sang ổ đĩa BE 2026-10-19 |
| Parent | Screen time | Có Modal nhắc nhở mắt + đếm giờ | `PATCH /parent/screen-time` | Child | Hoàn thiện (P1.4 real-time enforcement & override) |
| Parent | Parent Gate | Có Modal toán / PIN | `GET /challenge`, `POST /verify` | Step-up Token 15m | Hoàn thiện (P0.4 server-side token) |
| Admin | KPI | Có | `GET /admin/kpi` | Nhiều collection | Hoàn thiện |
| Admin | Doanh thu | Có | `GET /admin/revenue`, `/admin/doanh-thu` | PaymentOrder | Hoàn thiện local 2026-10-13; chỉ tính đơn subscription đã completed, không tính giao dịch test |
| Admin | Provision tài khoản | Hộp nhập riêng trên Windows | Offline, không có endpoint cấp quyền public | User, seed_locks | Đã tạo một admin trên `test` và kiểm tra login/RBAC production 2026-10-11; xem `admin-provisioning.md` |
| Admin | Learners | Có | `GET /admin/learners` | Child/User | Hoàn thiện (Limit 100) |
| Admin | CMS lesson/story/culture | List/filter, form đầy đủ, nháp, preview độc lập, signed cover upload, tải audio lên cho mọi ô `audioUrl` (activity/option/vocab/story/culture) có trạng thái tải + báo lỗi + nghe thử, vẫn cho dán URL tay, publish/ẩn có xác nhận | `/admin/content/:kind`, `/admin/content-images/*`, `POST /admin/content/audio`, phát `GET /api/v1/media/audio/:name` | ContentDraft, ContentRevision, live, AdminAuditLog, Cloudinary image, ổ đĩa BE audio | Đã triển khai local 2026-10-12; audio upload (nhánh `feat/audio-local-fe`) lưu theo sha256 trên ổ đĩa BE, endpoint ở phase song song; cover upload cần preset/env/deploy; publish mặc định tắt, chưa import production |
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

- NAV-POINTS-LINK: **yêu cầu nghiệp vụ đã giao** là nhấn số dư ViVi mở Điểm thưởng. **Quyết định kỹ thuật** dùng `Link`, tên truy cập VI/EN có số dư, vùng chạm tối thiểu 44px và focus-visible toàn cục; giữ `formatPoints`, số 0, hồ sơ đang chọn và guard đăng nhập/phiên bé. **Giả định trình bày** giữ pill màu vàng/chỉ số trên mặt nút, đích được mô tả trong accessible name; không thêm chữ làm rộng header. Bằng chứng và giới hạn: [journal](../plans/journals/2026-10-18-kids-points-link.md).

- [x] Lỗi mạng khi complete lesson/culture quiz: Đã phân biệt lỗi mạng lưu vào offline queue `vietverse_offline_completions` và hiển thị trạng thái chờ đồng bộ, lỗi server hiển thị nút Thử lại (P1.5).
- [x] Admin route: Bảo vệ hoàn toàn bằng middleware RBAC server-side và Zod validation (P1.7).
- [x] Parent gate: Phiên step-up auth 15 phút với mã toán ký server-side và PIN bảo vệ qua header `X-Parent-Gate-Token` (P0.4).
- [x] Reload Parent portal (2026-10-09): đã sửa vòng đời token khi bootstrap auth, kiểm chứng bằng test từ trạng thái chưa tải user và reload trình duyệt thật; không chỉ kiểm tra khi user đã có sẵn trong store.
- [x] Screen time: `ChildSessionGuard` và `ScreenTimeGuard` dùng chung cho bản đồ, lesson trực tiếp và khám phá đã đăng nhập. Hết giờ thì unmount nội dung; gia hạn sau Parent Gate cập nhật timer đang chạy. Parent portal vẫn truy cập được khi hết giờ học.
- [x] Responsive navigation & Touch targets: Menu hamburger di động cho PublicLayout, thanh tab chuyển phân hệ di động cho AdminLayout, chuẩn hóa toàn bộ nút header đạt tối thiểu 44px và giữ nhãn chữ Góc Phụ Huynh trên mọi kích cỡ màn hình (P1-FE.5, P2-FE.1).
- [x] Loại bỏ demo credentials khỏi production: Gated bằng `import.meta.env.DEV` tại LoginPage (P1-FE.6).
- [x] Lưu screen time có error/retry VI/EN và bỏ qua phản hồi cũ khi đổi bé/tài khoản hoặc rời trang (local 2026-10-18). Không đổi mức giới hạn/Parent Gate/API; xem [parent-settings-save.md](./parent-settings-save.md).

## Làm mới dữ liệu sau đồng bộ offline — 2026-10-18, local

- Worker nhận QueryClient của ứng dụng, làm mới điểm/lịch sử, bản đồ và tiến độ phụ huynh cho các bé có lượt nộp được server xác nhận; tải lại danh sách hồ sơ một lần mỗi batch để cập nhật số dư trên header.
- Không suy ra đỗ bài từ HTTP thành công, không cộng điểm local; lỗi tải lại không gửi lại bài đã xác nhận. Có guard tài khoản và giữ lựa chọn bé khi phản hồi chậm.
- Chưa deploy/nghiệm thu mạng offline trên thiết bị thật. Quyết định, giả định và tiêu chí tại [offline-sync-refresh.md](./offline-sync-refresh.md).



