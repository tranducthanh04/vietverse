# Thiết kế CMS Vietverse: nháp, xem trước và xuất bản

Ngày: 2026-10-09. Baseline: `f727c60` trên `main`.

Trạng thái: **thiết kế đã được phản hồi, bổ sung phạm vi dữ liệu khách hàng ngày 2026-10-09; chưa triển khai**. Người dùng đồng ý hướng CMS và yêu cầu dùng dữ liệu đã gửi. Bản sửa này làm rõ nguồn và cách nhập dữ liệu; các lựa chọn kỹ thuật là đề xuất, không phải hành vi đã có của hệ thống.

## 1. Mục tiêu và căn cứ

Admin biên tập được giáo án, truyện/đồng dao và văn hóa bằng biểu mẫu, không phải sửa JSON/database. Nội dung đang biên tập không xuất hiện với bé; xuất bản không reset tiến độ, điểm hoặc bản thu âm.

Nguồn nghiệp vụ: `docs/01-product-overview.md`, `02-business-rules.md`, `03-feature-inventory.md`, `05-api-and-data-contracts.md`, `06-review-findings.md`, `08-customer-alignment.md`. Tài liệu này bổ sung yêu cầu CMS còn thiếu, không sửa chính sách thưởng hay subscription.

Bằng chứng baseline đã kiểm tra:

- `AdminLessonsPage.tsx` chỉ sửa metadata; tạo bài tự chèn một word card, chưa có editor hoạt động/từ vựng.
- `admin.validation.ts` nhận bảy loại activity nhưng `correctAnswer` còn tự do, chưa xác thực tính khả dụng theo từng loại.
- `AdminService.updateLesson` ghi trực tiếp bản live; audit hiện là best-effort, không có kiểm tra phiên bản chống ghi đè.
- Chưa có route quản trị truyện/văn hóa. Public services đọc trực tiếp `Story`/`CultureArticle`.
- Lesson player, session IndexedDB, offline outbox và API complete chưa lưu phiên bản giáo án; chấm lại bằng nội dung vừa sửa có thể làm sai kết quả.
- `LessonProgress`, điểm và recording tham chiếu ID nội dung hiện hữu. Đổi ID hay dịch chuyển bài/chặng tùy ý sẽ tác động mở khóa và thống kê.

## 2. Phạm vi và các lựa chọn cần duyệt

### Hướng đã được đồng ý

- Một role admin hiện có quản lý ba nhóm nội dung; không thêm role biên tập/duyệt mới.
- Biên tập bằng form, lưu nháp, xem trước, chủ động xuất bản; không tự xuất bản khi lưu.
- Kiểm tra dữ liệu trên server, chống ghi đè giữa hai admin, giữ ID và dữ liệu học tập.
- Không xóa cứng nội dung đã được tham chiếu.

### Phạm vi cụ thể đề xuất

- **Bài học:** biên tập đầy đủ các bài có sẵn, gồm metadata, vocabulary và bảy loại hoạt động; thêm/bỏ/sắp xếp hoạt động trong bản nháp. Giữ nguyên `_id`, `stageId`, `order` của bài đã xuất bản.
- **Truyện/đồng dao:** tạo mới và sửa loại, tiêu đề, tác giả, mô tả, ảnh, audio, thời lượng, nhóm tuổi, từ vựng, lời theo mốc thời gian và quiz vốn có trong model. Việc thêm editor quiz không tự thêm tính năng làm quiz truyện cho bé.
- **Văn hóa:** tạo mới và sửa chủ đề, tiêu đề, mở đầu, các sự thật thú vị, ảnh/audio, tags và quiz.
- **Media:** nhập URL HTTPS hoặc đường dẫn asset cùng origin; xem/nghe thử và báo lỗi. Chưa có upload file trực tiếp/thư viện tài sản trong đợt này; không dùng endpoint thu âm của trẻ làm nơi upload nội dung CMS.
- **Vòng đời:** ẩn/hiện truyện và văn hóa thay vì xóa; bài học không có nút ẩn/xóa vì sẽ ảnh hưởng điều kiện hoàn thành chặng. Bỏ thay đổi nháp chỉ tác động bản nháp.
- **Cấu trúc chương trình:** không thêm, bớt, đổi chặng hoặc số thứ tự bài đang chạy. Nút tạo bài học trực tiếp hiện có được thay bằng biên tập catalog đã nạp; mở rộng catalog cần migration riêng được duyệt. Giữ nguyên cả catalog cũ, không ép database cũ về 4 bài/chặng.

Không bao gồm: đổi công thức điểm/năng lực, payment, Google OAuth, CMS landing page, lịch xuất bản, duyệt nhiều cấp, tự dịch, công cụ nhập file bất kỳ hoặc tự xác nhận bản quyền. Nhập bộ dữ liệu từ tài liệu khách hàng đã gửi nằm trong phạm vi; không yêu cầu khách hàng nhập lại bằng tay. Những giới hạn này không được báo là đã hoàn thiện cùng CMS.

### Dữ liệu khách hàng đã cung cấp

Căn cứ đối chiếu trực tiếp ba tab ngày 2026-10-09 và liên kết tại `docs/08-customer-alignment.md`:

- Kho Truyện có lời cho 21 bài, không chỉ tên. Nhập lời và liên kết nguồn thay cho đoạn minh họa hiện tại; giữ nguyên ngắt dòng. Lưu các dị bản trong bộ nguồn, không tự ghép thành một tác phẩm; draft ghi rõ bản được chọn để admin xem trước. Thông tin tác giả/thể loại có nghi vấn được đánh dấu cần xác minh, không tự sửa thành dữ kiện đã kiểm chứng.
- Khám phá có giáo án cho 20 bài: dùng từ vựng, câu mẫu, đáp án và hướng dẫn đã viết. Mỗi hoạt động có ánh xạ về bài/mục nguồn; phần bổ sung để chạy được renderer phải ghi là biên soạn bổ sung. Hoạt động như chọn nhiều chữ M hoặc nghe rồi thực hiện ba bước chưa chắc tương đương bảy renderer hiện có: ghi rõ khoảng trống, không thay bằng câu hỏi khác rồi báo đã khớp hoàn toàn.
- Văn hóa có tám nhóm và ví dụ nội dung/câu hỏi; nhập phần đã có. Phần intro/funFacts/câu hỏi chưa được viết đầy đủ được giữ nháp và đánh dấu cần biên tập, không gán bài mẫu hiện tại là lời của khách hàng.
- Chưa thấy file audio trực tiếp hoặc timestamp trong ba tab. Nhập văn bản không phụ thuộc việc nhận audio; thiếu audio dùng chế độ đọc/fallback có nhãn, không bịa URL, thời lượng hay timestamp.
- Bộ nguồn nhập cần có tab/heading, ngày đối chiếu và checksum; phân biệt nội dung chép từ tài liệu, phần biên soạn bổ sung và trường còn thiếu. Liên kết nguồn dùng làm attribution, không tự tải media từ các website đó.
- Import có dry-run và ánh xạ tường minh tới ID đang có. Chỉ tạo draft khi chưa có draft đang biên tập, kiểm tra base version và báo conflict nếu nội dung đã đổi. Chạy lại cùng source checksum không tạo bản trùng hoặc ghi đè sửa tay. Nội dung mới chưa có ID live được tạo dưới dạng draft; lesson không khớp catalog hiện hữu phải báo xung đột, không tự thêm/di chuyển bài.
- Đây là đợt nhập có kiểm soát cho bộ nguồn đã biết, không phải editor/importer tổng quát. Không ghi đè live qua seed; admin xuất bản qua luồng version/audit sau khi kiểm tra bản nhập. Không đụng tiến độ, điểm, recording hoặc database production trong bước chuẩn bị dữ liệu.

## 3. Lựa chọn kiến trúc

Đã cân nhắc sửa trực tiếp bản live (ít code nhưng nội dung chưa hoàn chỉnh có thể đến trẻ), draft tách biệt nhưng ghi đè live không lưu phiên bản (an toàn khi biên tập nhưng không an toàn cho phiên học đang mở), và draft kèm snapshot phiên bản xuất bản.

Chọn **draft tách biệt + snapshot bất biến + bản live tương thích**. Tận dụng ba collection nội dung hiện có cho các màn đọc; giữ snapshot để chấm đúng bài bé đã mở. Không dùng CMS SaaS, không đổi toàn bộ renderer hoặc framework.

Phân tách trách nhiệm:

- Module `admin/content`: RBAC, danh sách, draft, kiểm tra phiên bản, xem trước, xuất bản/ẩn và audit.
- Schema nội dung theo từng loại: normalize, validate nháp, validate xuất bản, tạo DTO whitelist. Không dùng trực tiếp body để `$set` model.
- Bộ đọc phiên bản: chọn live hoặc snapshot đã xuất bản; kiểm tra quyền hiện tại trước khi trả nội dung/chấm bài.
- Editor FE theo loại; các field lặp lại như media, từ vựng, quiz được dùng chung. Không dồn ba editor vào `AdminLessonsPage.tsx`.
- Preview dùng phần trình bày/tương tác của renderer hiện có nhưng tách mọi tác dụng ghi dữ liệu bằng chế độ preview rõ ràng.

## 4. Dữ liệu và tính toàn vẹn

### Bản live

`Lesson`, `Story`, `CultureArticle` giữ nguyên `_id` và payload đọc hiện tại; thêm `contentVersion` nguyên không âm, `publishedAt`, `publishedBy`. Bản legacy thiếu version được hiểu là 0. Story/culture thêm `visibility: published | withdrawn`, thiếu field được hiểu là published.

Story/culture thuộc seed có thêm `seedKey` ổn định, unique sparse theo collection, không biên tập được trong CMS. Seed hiện nhận diện theo title; chỉ giữ ID mà cho đổi title sẽ khiến lần seed sau tạo thêm bản cũ. Cutover phải gắn key theo danh mục seed đã đối soát, và seed tra key trước tên; không đoán khi có nhiều bản khớp.

Đây là metadata CMS, không phải sự thay đổi điểm/quyền học. Trạng thái nháp không nằm trong collection live nên không lọt vào bản đồ, đếm tổng bài hoặc public search.

### ContentDraft

- Một draft dùng chung cho mỗi `{ kind, contentId }`, có unique compound index; `kind` chỉ nhận `lesson`, `story`, `culture`.
- Field: payload whitelist theo kind, `draftVersion`, `baseContentVersion`, trạng thái `editing | synced | discarded`, người/thời điểm sửa, thông tin lần xuất bản gần nhất.
- Với truyện/văn hóa mới: server cấp `contentId`, chưa tạo bản live; `baseContentVersion = null`. Không tạo lesson ID mới qua CMS đợt này.
- Lần mở editor chỉ đọc; nhấn sửa/tạo mới mới tạo draft bằng mutation tường minh. Draft existing lấy nội dung live làm điểm xuất phát.
- Mọi save gửi `expectedDraftVersion`; cập nhật atomic bằng điều kiện version. Sai version trả 409, không ghi đè và không mất form local.
- Việc create mới có `requestId` duy nhất theo admin để retry do mất response không tạo hai nội dung.
- Draft synced/discarded được mở lại bằng mutation có expected version, lấy live hiện tại làm base và tăng draftVersion. Không trả lại payload cũ như một draft mới đang hợp lệ. Với draft-only đã bỏ, giữ định danh/requestId để retry không tạo bản thứ hai; khôi phục biên tập là thao tác tường minh.

### ContentRevision

- Snapshot bất biến với unique `{ kind, contentId, contentVersion }`, payload whitelist, thời điểm/người xuất bản.
- Lần xuất bản CMS đầu tiên của nội dung legacy phải lưu snapshot version 0 trước khi thay live. Nội dung mới bắt đầu từ version 1.
- Không xóa snapshot trong đợt này; không chứa dữ liệu cá nhân trẻ. Các recording/progress cũ vẫn tham chiếu cùng ID nội dung.
- ID activity còn tồn tại phải được giữ qua sửa/sắp xếp. Activity mới nhận ID mới; không tái sử dụng ID đã bỏ cho hoạt động khác. Bản snapshot vẫn giữ activity đã bỏ để đọc phiên cũ.

### Xuất bản atomic

Một MongoDB transaction phải: kiểm tra draft version + base live version, validate toàn bộ payload, lưu snapshot mới (và version 0 nếu cần), thay live với cùng ID, tăng version, đánh dấu draft synced và ghi `AdminAuditLog`.

- Không cho một bước lỗi để lại live đã đổi nhưng snapshot/audit/draft chưa đổi.
- Hai request cùng version chỉ một request commit; conflict trả 409. Retry cùng draft version đã xuất bản trả lại kết quả đã commit, không tạo version mới hoặc audit mới.
- Publish và save cạnh tranh cùng draft dùng cùng điều kiện version; payload được xuất bản phải đúng bản admin vừa xác nhận, không lấy bản mới âm thầm.
- Ẩn/hiện story/culture là mutation riêng, kiểm tra expected live version, tăng version và ghi snapshot/audit trong transaction. Draft dựa trên live trước đó phải báo conflict, không tự hiện lại nội dung đã ẩn.
- Server không hỗ trợ transaction trả 503 cho mutation CMS cần transaction, không fallback sang các write rời rạc. Replica set đã là yêu cầu production của PayOS; vẫn cần kiểm tra môi trường triển khai CMS.
- Audit lưu hành động, target, version và tên trường thay đổi; không ghi toàn bộ audio, token hoặc thông tin trẻ.

## 5. Bảo vệ phiên học, offline và dữ liệu đã đạt

### Nội dung đang học

- API chi tiết trả `contentVersion`. Session IndexedDB và outbox gửi bài lưu version cùng `lessonId`, `childId`, answers.
- Reload phiên đang học phải lấy đúng snapshot của version đã lưu, không ghép câu trả lời cũ vào bài mới. Session mới mở bản published hiện hành. Query/cache key bao gồm child, content ID và version khi có.
- API complete nhận version, kiểm tra ownership + unlock theo bài/chặng hiện tại, rồi lấy activities/đáp án từ snapshot published tương ứng. Version không tồn tại/nháp không được chấm.
- Việc admin xuất bản giữa lúc GET/complete không làm thay snapshot đang dùng. Snapshot không cho phép vượt subscription, Parent Gate hoặc ownership.
- Culture quiz gửi version đã hiển thị; server chấm snapshot đó, không dùng câu hỏi vừa sửa. Story/culture trang đang mở giữ dữ liệu đã tải cho tới khi tải lại.
- Bản thu mới lưu thêm `contentVersion` khi gắn với lesson; bản thu legacy vẫn đọc được. Chuyển version không xóa audio hoặc đổi chủ sở hữu.
- Thưởng và progress vẫn gắn với ID bài/bài văn hóa, **không thêm version vào khóa thưởng**. Hoàn thành bản mới không tạo lại +10/+5, thưởng chặng hay bài 20. Không reset trạng thái completed/sao đã đạt.

### Tương thích legacy và các tình huống không thể khôi phục tự động

- API mới coi request thiếu version là version 0 chỉ khi nội dung chưa được CMS xuất bản. Khi live đã đổi, thiếu version trả `409 CONTENT_VERSION_REQUIRED`; tuyệt đối không tự đoán phiên cũ thuộc bản mới nhất.
- Session/outbox legacy chưa có version được giữ lại và đánh dấu cần tải lại bài; không xóa hoặc chấm giả. UI nói rõ cần bắt đầu lại phần bài đang làm nếu không xác định được phiên bản; progress/điểm đã lưu trên server không đổi.
- Outbox gửi lỗi 409/phiên bản không khả dụng chuyển sang trạng thái cần xử lý; vẫn giữ câu trả lời và tiếp tục các item độc lập khác. Không tự retry vô hạn item bị chặn, không làm mất phần queue chưa xử lý khi dừng do mất mạng.
- Với story/culture đã bị ẩn: chặn GET public và các request khám phá/nộp quiz mới, kể cả dùng version cũ; trả thông báo nội dung không còn khả dụng. Lịch sử đã ghi và điểm đã đạt không bị xóa/thu hồi.
- CMS không che lấp các khoản nợ chấm điểm đã tồn tại. Đặc biệt đường submit record_voice phải dùng recording ID thực, kiểm tra đúng child/lesson/activity/version để preview hoặc payload giả không được tính hoàn thành. Không đổi tỷ lệ đỗ hay số điểm thưởng.

## 6. Kiểm tra nội dung

Nháp cho phép thiếu trường bắt buộc để biên tập dở, nhưng vẫn kiểm tra kiểu dữ liệu, giới hạn kích thước, URL và ID trùng. Xuất bản kiểm tra đầy đủ và trả lỗi gắn đường dẫn field để FE đưa về đúng mục.

### Bài học

- Metadata hợp lệ, title tối đa 200 ký tự; stage/order bất biến. `totalActivities` do server tính từ mảng; không nhận số do client khai. Giữ cách tính điểm hiện có, không thêm editor trọng số.
- Mỗi bản xuất bản có 1-50 activities; activity ID duy nhất, prompt không rỗng; vocabulary tối đa 100 mục, word/meaning bắt buộc.
- `word_card`: targetWord bắt buộc; `record_voice`: prompt/targetWord đủ làm hướng dẫn; không tạo câu trả lời boolean mẫu để bỏ qua thu âm.
- `listen_choose`/`review`: 2-8 options có ID duy nhất, có nội dung hiển thị, correctAnswer là ID option tồn tại. Validate phù hợp renderer của từng loại (review cần text).
- `fill_blank`: đúng một câu có marker `__`, một ô trống như renderer hiện có; 2-8 options text, đáp án là ID option và text khớp `missing`. Không cho nhiều blanks mà UI chỉ hiển thị một.
- Khi mở dữ liệu legacy dùng text đáp án thay ID option, editor chỉ chuyển sang ID nếu khớp duy nhất; hiển thị thay đổi trong draft và yêu cầu kiểm tra trước publish. Không sửa live hoặc snapshot legacy ngầm. Không xác định duy nhất thì yêu cầu admin chọn đáp án.
- `drag_match`: 2-12 cặp text; vế trái và vế phải không trùng sau chuẩn hóa, tránh mapping mơ hồ.
- `sort_order`: 2-12 thành phần text, không trùng khi renderer chưa hỗ trợ identity riêng; orderedItems và correctAnswer phải mô tả cùng thứ tự đích.
- Lưu/preview nháp không đầy đủ vẫn được, nhưng chỉ cho chạy thử activity hợp lệ; hiển thị lỗi của phần còn thiếu. Publish bài legacy khung phải hoàn thiện payload, không tự thêm word card để lách validate.

### Truyện và văn hóa

- Story type dùng enum hiện có; ageGroups chỉ `5-6`/`6-8`; lyrics có text, thời gian hữu hạn không âm. Có audio thì thời lượng >0, timeSec tăng dần và không vượt duration. Không audio cho phép mọi mốc bằng 0, hiển thị bản đọc theo thứ tự dòng, không giả phát nhạc.
- Culture category dùng tám nhóm catalog: `tet`, `am_thuc`, `trang_phuc`, `phong_tuc`, `le_hoi`, `vat_dung`, `thien_nhien`, `tro_choi_dan_gian`; title/intro không rỗng, có ít nhất một funFact. Tags không trùng sau trim. Category legacy ngoài danh sách vẫn hiển thị trong editor nhưng cần admin chọn nhóm hợp lệ trước publish, không tự remap dữ liệu.
- Quiz của cả hai loại: tối đa 20 câu, 2-8 options text không rỗng/mơ hồ trùng nhau, chỉ số correctAnswer trong giới hạn. Culture phải có ít nhất một câu để xuất bản luồng quiz hiện có; story quiz có thể rỗng.
- Giới hạn publish payload 512 KiB, lyrics tối đa 500 dòng, funFacts tối đa 50, prompt/đoạn text tối đa 5000 ký tự. Không nhận HTML tùy ý; hiển thị text qua React escaping.
- URL cho phép HTTPS hoặc asset path cùng origin bắt đầu `/` nhưng không `//`; từ chối `javascript:`, `data:`, `file:`, URL có credentials. Audio rỗng được phép nơi có chế độ đọc/TTS rõ ràng. CMS không fetch URL từ server để tránh SSRF, không khẳng định URL hợp lệ cú pháp là media còn hoạt động.
- Dùng audio URL mới khi thay file; snapshot chỉ cố định URL, không thể ngăn nhà cung cấp sửa nội dung tại cùng URL. Content team chịu trách nhiệm quyền sử dụng và tính bất biến của asset đã xuất bản.

## 7. API và quyền

Base dự kiến: `/api/v1/admin/content`; mọi endpoint yêu cầu JWT + role admin. `kind` ở URL dùng `lessons`, `stories`, `culture`; adapter ánh xạ sang enum nội bộ. Unknown kind/ID/payload trả 400; không tự resolve collection từ chuỗi người dùng.

| Endpoint | Mục đích |
| --- | --- |
| `GET /:kind` | Danh sách hợp nhất live và draft-only; filter search/trạng thái/chặng hoặc chủ đề, page/pageSize, max 100 |
| `GET /:kind/:id` | Metadata live, draft nếu có, version và trạng thái; GET không tạo draft |
| `POST /:kind/drafts` | Tạo truyện/văn hóa nháp với requestId; lessons từ chối vì catalog cố định |
| `POST /:kind/:id/draft` | Bắt đầu biên tập từ live hiện tại; nếu draft đã tồn tại trả draft đó, không overwrite |
| `PUT /:kind/:id/draft` | Lưu payload đầy đủ cùng expectedDraftVersion |
| `POST /:kind/:id/validate` | Trả danh sách lỗi xuất bản cho draft version đã chọn |
| `GET /:kind/:id/preview?draftVersion=` | Đọc đúng bản nháp để preview, mismatch trả 409 |
| `POST /:kind/:id/publish` | Xuất bản expectedDraftVersion/baseContentVersion |
| `POST /:kind/:id/discard-draft` | Bỏ thay đổi nháp bằng version check, không sửa live/history |
| `PATCH /:kind/:id/visibility` | Story/culture published/withdrawn với expectedContentVersion |

Giữ response wrapper hiện có. Lỗi chính: `VALIDATION_ERROR` (400), auth/RBAC (401/403), không tồn tại (404), `CONTENT_CONFLICT`/`CONTENT_VERSION_REQUIRED` (409), CMS transaction unavailable (503). FE phải hiển thị lỗi field và giữ nội dung form khi request lỗi.

Các route `POST /admin/lessons`, `PUT /admin/lessons/:id` cũ không được trở thành cửa ghi live bỏ qua publish: sau cutover trả 409 yêu cầu dùng CMS mới, không âm thầm đổi thành lưu nháp và báo như đã xuất bản. GET lessons hiện có có thể giữ read-only trong giai đoạn chuyển tiếp.

API học/quiz/recording mở rộng version là phần bắt buộc của cutover. Draft và snapshot admin không được lọt qua query public. Không tăng phạm vi truy cập đáp án qua API CMS/public; các renderer hiện có đang dùng đáp án bài đã phát hành cho phản hồi tức thì là hợp đồng legacy cần được kiểm tra riêng, không được suy diễn CMS đã giải quyết việc ẩn toàn bộ đáp án.

Contract mở rộng cụ thể: `GET /lessons/:id?childId=&contentVersion=` đọc bản published tương ứng (bỏ version là bản hiện tại); `POST /lessons/:id/complete` và `POST /culture/:id/quiz` thêm body `contentVersion`; multipart recording thêm field số nguyên `contentVersion` khi gắn với lesson. Phiên học dùng version 0 khi nội dung live legacy chưa có metadata, không nhầm với draftVersion. Lấy lesson snapshot vẫn bắt buộc child sở hữu/mở khóa cho người học; admin preview dùng endpoint CMS riêng, không cần mượn hồ sơ bé.

## 8. Giao diện và lỗi

- Giữ visual language AdminLayout; navigation riêng Bài học, Truyện/đồng dao, Văn hóa. Danh sách có tìm kiếm, lọc, phân trang, nhãn Đã xuất bản/Có thay đổi nháp/Nháp mới/Đã ẩn và lỗi/retry/empty.
- Editor trang riêng, chia Thông tin, Nội dung, Media, Kiểm tra. Bài học có panel vocabulary và danh sách activity với nút thêm/bỏ/di chuyển lên-xuống có thể dùng bàn phím; ID không cho gõ tùy ý.
- Nút Lưu nháp, Xem trước, Xuất bản tách biệt. Hiển thị ai sửa/lúc nào và version đang biên tập; cảnh báo rời trang khi chưa lưu. Không tự lưu lên server trong đợt đầu.
- Xem trước chỉ bản đã lưu; form còn bẩn phải lưu hoặc quay lại, không preview dữ liệu khác bản sắp xuất bản. Publish có xác nhận tác động, thông báo số lỗi và đưa focus đến field lỗi đầu.
- Conflict giữ form local, báo người khác đã sửa; cho xem bản server và chủ động tải lại, không tự merge mảng hoạt động/câu hỏi hoặc ghi đè cưỡng bức.
- Preview chỉ admin, nhãn rõ; không tạo session child, ghi exploration, upload recording, complete lesson, nộp quiz thưởng hoặc thay point balance. Record_voice preview hiển thị hướng dẫn/mô phỏng thao tác, không xin micro hoặc lưu audio trẻ.
- Mobile 390px không tràn toàn trang; bảng có vùng cuộn riêng. Label, focus, role dialog, nút >=44px, loading và retry rõ ràng. Ảnh/audio hỏng có fallback, không giả đang phát.

## 9. Tương thích, triển khai và rollback

- Mở rộng model additive; legacy thiếu metadata vẫn đọc như published version 0. Migration có dry-run, chỉ tạo index/metadata cần thiết (gồm seedKey) và báo xung đột, không viết lại nội dung catalog, progress hoặc ledger. Nội dung không thuộc seed không bị gán key tùy tiện.
- Deploy bộ đọc snapshot/version và client biết version trước; CMS publish chỉ bật bằng cờ server mặc định tắt sau khi kiểm chứng API/client. Old client thiếu version được xử lý như mục 5, không có cam kết khôi phục phiên không xác định được bản.
- Seed insert-only phải được cập nhật nhận diện bằng seedKey trước khi bật đổi tên CMS; giữ nguyên nội dung đã xuất bản, drafts, revisions, không tạo lại tên cũ hoặc làm hồi sinh story/culture đã ẩn. Kiểm thử chạy seed lại sau rename/publish/withdraw để xác nhận.
- Bản CMS đầu chuẩn bị draft từ dữ liệu khách hàng theo mục 2; admin kiểm tra rồi xuất bản, không phải nhập lại lời đã có. Không tự chuyển mọi bài khung trên database cũ hoặc ghi đè nội dung live; thay cấu trúc catalog vẫn cần migration riêng.
- Rollback an toàn: tắt mutation CMS, giữ reader hiểu snapshot/version; không hạ server về bản chấm hoàn toàn theo live sau khi đã có nhiều version. Trở lại nội dung cũ bằng một lần xuất bản mới từ snapshot được admin kiểm tra, không sửa/xóa snapshot lịch sử. UI khôi phục một chạm chưa nằm trong phạm vi.
- Sau triển khai cập nhật docs 02/03/04/05/06/08 theo hành vi thực tế và kết quả kiểm chứng; tài liệu thiết kế này không thay nhãn baseline thành đã hoàn thiện.

## 10. Tiêu chí nghiệm thu

1. Lưu draft sửa title/activity/quiz không làm GET public, bản đồ, dashboard hoặc bài đang mở đổi nội dung; khách/parent không truy cập draft/preview.
2. Publish nội dung thiếu đáp án, ID trùng, option/quiz index sai, nhiều blank không hỗ trợ, URL nguy hiểm bị từ chối; draft vẫn còn để sửa.
3. Hai admin cùng mở version N: lần lưu đầu thành công, lần sau 409 giữ form; publish đúng version được xác nhận. Retry tạo/publish không nhân bản nội dung, version hoặc audit.
4. Giả lập lỗi từng bước transaction: không có live mới thiếu snapshot/audit; không hỗ trợ replica set không được ghi nửa chừng.
5. Bé mở lesson/quiz version 0, admin xuất bản version 1, bé nộp/reload/offline sync version 0: chấm đúng bản 0, không mất queue. Thiếu/giả version không bị chấm bằng bản mới.
6. Publish sửa bài đã hoàn thành không reset progress/recording và không nhân thưởng; catalog/stage/order được bảo toàn. Ẩn story/culture chặn truy cập/nộp mới nhưng không xóa lịch sử.
7. Preview đầy đủ bảy activity type và nội dung đọc không phát sinh bất kỳ mutation học tập nào, kể cả khi admin đang chọn một child hoặc bấm hết bài.
8. Bản thu được ràng buộc đúng child/lesson/activity/version; payload record_voice giả và recording của bé khác không thể nhận hoàn thành.
9. Editor có loading/empty/error/retry, lỗi field, cảnh báo form chưa lưu, conflict; thao tác được bằng bàn phím và trên 390px/desktop. Nội dung legacy vẫn mở/sửa được mà không mất field.
10. Test regression seed, ownership, unlock, điểm, offline, Parent Gate và các role không suy giảm. Chạy toàn bộ tests, typecheck, build, lint FE; báo rõ warning và giới hạn nghiệm thu media/thiết bị thật.
11. Bộ nhập đối soát đủ 21 mục Kho Truyện và 20 mục bài học với nguồn; tám nhóm văn hóa cùng phần còn thiếu được ghi rõ. Kiểm tra nội dung lời thực tế, không chỉ đếm bản ghi. Dị bản và phần biên soạn bổ sung có nhãn; dry-run không ghi, chạy lại không nhân draft, không ghi đè sửa tay/live hoặc đổi ID học tập.

## 11. Cổng duyệt tiếp theo

Người dùng xem phần dữ liệu khách hàng đã bổ sung ở mục 2; giữ hướng phiên bản cho bài đang học, catalog hiện hữu và media bằng URL. Sau khi duyệt bản sửa, viết kế hoạch triển khai chia theo nguồn dữ liệu/API/editor/kiểm thử và chọn cách thực hiện. Chưa có thay đổi product code, API hay database ở bước thiết kế này.
