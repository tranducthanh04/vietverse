# Vận hành CMS và nội dung khách hàng

Ngày 2026-10-09. Quyết định triển khai: admin dùng bản nháp chung, xuất bản chủ động, không ghi live bằng seed. Không đổi điểm, unlock, subscription hoặc ID học tập.

## Ngoại lệ khởi tạo DB mới theo yêu cầu owner

Owner đã bỏ phương án chuyển dữ liệu cũ và cho phép biên soạn phần còn thiếu theo Docs. Quyết định này chỉ cho phép khởi tạo catalog mới khi nội dung, nháp và lịch sử nội dung đều trống; không cho phép seed ghi đè hoặc bỏ qua CMS trên database đã có nội dung. Giáo án/văn hóa bổ sung phải phân biệt với lời nguồn; không giả dữ liệu tài khoản, tiến độ, điểm, thanh toán hoặc audio.

Owner thực hiện bằng [launcher riêng](../server/scripts/bootstrap-production.cjs), mặc định dry-run; `--apply` chỉ dùng trong cửa sổ không có writer ngoài luồng. Credential nhập qua hộp thoại riêng và stdin, không lấy lại sensitive env hoặc dùng `.env` local. CLI từ chối target khác DB mới đã chọn; khi cần đổi target phải có yêu cầu và kiểm chứng mới. [Loader](../server/src/seeds/customer/bootstrapCustomer.ts) và [catalog](../server/src/seeds/customer/bootstrapCatalog.ts) sở hữu các gate và provenance; bằng chứng thực thi ở [journal bootstrap](../plans/journals/2026-10-10-customer-bootstrap.md).

Tiền điều kiện: không có admin ứng dụng **và không còn admin JWT/session hợp lệ**, không tạo/promote admin hoặc chạy writer ngoài ứng dụng trong cửa sổ bootstrap. Chỉ đếm User admin không chứng minh token cũ đã hết hạn vì middleware tin role trong JWT. Owner phải xác nhận không có phiên admin hợp lệ ở checkbox riêng; nếu chưa rõ thì hủy. CMS không dùng khóa seed chung; nếu đã có admin thì loader dừng, cần phương án maintenance riêng được duyệt. Không tự khóa/xóa tài khoản hoặc đổi env CMS để vượt gate.

Recovery: catalog rỗng là preimage của thao tác này, được ghi cùng receipt. Test replica set xác minh lỗi ghi receipt abort toàn bộ nội dung. Lỗi/mất ACK phải đối soát receipt và hash bằng dry-run; không xóa hoặc nạp lại cưỡng bức. Sau commit, giữ revisions và khôi phục nội dung bằng CMS/version mới, không quay về reader cũ hoặc rollback ledger. Chỉ nạp nội dung; chưa phải nghiệm thu backup toàn database, media, thanh toán hoặc quyền tác giả.

**Giả định còn lại:** đây là bản học qua chữ, không thay thế đầy đủ giáo án nghe/nói; tuổi và chất lượng biên soạn cần content owner rà soát. Attribution/quyền sử dụng nguồn chưa xác minh độc lập. Atlas networking và quyền DB vẫn cần nghiệm thu riêng; bootstrap không tự mở mạng vĩnh viễn.

Kế hoạch thực thi chi tiết cho người deploy: [nhập dữ liệu staging và production](./superpowers/plans/2026-10-09-customer-data-deployment.md). Bao gồm kiểm đúng DB/admin, backup/restore rehearsal, index prerequisites, report-bound apply, retry/rollback và biên bản. Đây là bàn giao chưa thực thi DB thật; không thay các gate bên dưới.

## Trước khi bật production

### Schema hồ sơ bé — owner duyệt 2026-10-11

- Đích được owner xác nhận là cluster `<cluster-host>.mongodb.net`, database `<db-name>`; từ 2026-10-13 launcher đọc đích từ `VIETVERSE_DB_HOST`/`VIETVERSE_DB_USER`/`VIETVERSE_DB_NAME` trong phiên shell của operator thay vì hằng số trong repo. Không dùng URI ngầm hoặc `.env` cũ. Giữ Cloudinary, thanh toán ngoài phạm vi và `CMS_PUBLISH_ENABLED=false`.
- Launcher dry-run báo riêng `schemaMigration` (pending/invalid/migrated/preimage/fingerprint). Hash kế hoạch gắn cả catalog và preimage của các hồ sơ legacy cần backfill theo ID; thay đổi tập cần migrate giữa dry-run/apply hoặc trước transaction làm apply dừng. Hồ sơ đã có danh sách hợp lệ không bị migrate và không ảnh hưởng fingerprint. Fingerprint không phải secret và không in dữ liệu bé.
- Cùng transaction: thêm `companionLanguages: [companionLanguage]` cho bản cũ hợp lệ, giữ mọi field và timestamp khác; ghi preimage tối thiểu và receipt `schema_migration_receipts/child-companion-languages-v1`. Bản đã có mảng hợp lệ giữ nguyên; mảng rỗng/trùng/mã lạ/mâu thuẫn hoặc thiếu cả hai trường dừng, không tự suy đoán.
- Chạy lại chỉ xác minh catalog và schema receipt, không nhân dữ liệu. Nếu sau receipt xuất hiện document legacy mới (backend cũ còn chạy) thì dừng để đối soát, không bỏ qua. Cần phát hành backend tương thích trước khi mở ghi hồ sơ; FE chọn nhiều ngôn ngữ chỉ bật sau BE mới.
- Cửa sổ độc quyền phải bao gồm mọi writer hồ sơ và catalog. Preflight đọc không khóa các writer ứng dụng; khóa seed chỉ phối hợp các loader. Không tự tắt site/xóa tài khoản để đạt gate.
- Recovery trước commit: transaction abort cả schema/catalog/preimage/receipt. Sau commit ưu tiên giữ schema additive và deploy code tương thích; rollback code không cần xóa mảng. Nếu cần phục hồi field, phải dừng writers, đối soát từng ID với preimage và chỉ unset mảng khi vẫn đúng postimage một phần tử; không đụng field khác hoặc xóa catalog/history. Cần người duyệt riêng, không cung cấp lệnh reset hàng loạt. Preimage bị cascade khi chủ hồ sơ xóa bé; receipt thống kê không chứa PII được giữ.

### Gate CMS thông thường

1. Xác nhận đúng database đích, tài khoản admin và bản sao lưu. Các test/QA của đợt này chỉ dùng MongoMemoryReplSet riêng, không thay thế bước xác nhận đích.
2. Deploy backend reader hiểu contentVersion cùng frontend mới. Giữ `CMS_PUBLISH_ENABLED=false` trong lúc kiểm chứng. MongoDB phải là replica set/sharded có transaction.
3. Tại repo đầy đủ (bao gồm `docs/customer-source`), chạy `npm run cms:metadata -w server -- --dry-run`. Đối soát mọi conflict tên/key trước khi chạy lại với `--apply`. Migration chỉ thêm seedKey/index, không ghi lại nội dung.
4. Chạy `npm run cms:import-customer -w server -- --dry-run`. Report phải có 20 lesson đúng stage/order hiện hữu, 21 story và tám culture; có thể skip các nguồn đã nhập. Catalog cũ không khớp mapping phải được xử lý riêng, không tự ép về 20 bài.
5. Chỉ khi đích được duyệt, chạy `npm run cms:import-customer -w server -- --apply --admin-id=<id-admin>`. Import tạo drafts có nguồn/checksum/ghi chú trong một transaction; có conflict thì không ghi. CLI không tự publish.
6. Admin kiểm tra bản nhập ở `/admin/bai-hoc`, `/admin/truyen`, `/admin/van-hoa`; sửa phần thiếu, lưu, xem trước và kiểm tra lỗi. Xác minh attribution/bản quyền và media. Bật publish sau khi reader/client/backup đã kiểm chứng, rồi xuất bản từng bản đã duyệt.

Không chạy lại seed để cập nhật lời. Seed là insert-only, không phải migration nội dung. SeedKey nội bộ của story/culture được giữ cả khi đổi tên/ẩn và khi draft-only xuất bản lần đầu.

Quyết định bảo vệ định danh: seed bỏ qua seedKey đã được nháp khách hàng giữ chỗ, kể cả nháp discarded; không tạo bản live mẫu thay nháp. Live và nháp cùng key nhưng khác ID là conflict, dừng trước khi ghi catalog. Seed và import apply dùng chung khóa `seed_locks/vietverse-catalog-seed` từ trước bước lập kế hoạch đến hết thao tác; dry-run vẫn chỉ đọc. Nếu tiến trình chết để lại khóa, người vận hành phải xác minh không còn writer và đối soát kết quả trước khi gỡ khóa, không tự hết hạn.

## Bộ nguồn và khoảng trống

- Nguồn nguyên văn, tab ID và checksum ở `customer-source/2026-10-09/manifest.json`; `coverage.md` đối soát từng mục. Import kiểm tra byte UTF-8/SHA-256, file nguồn được giữ LF qua Git.
- 21 bài đọc có lời nguồn, mốc ban đầu 0 và không bịa URL audio. Giả định chọn dị bản đầu tiên cho Lộn cầu vồng/Kéo cưa; toàn bộ dị bản còn trong snapshot. Nhạc rừng/Thanh Lan/Thơ là nhãn của nguồn, chưa phải xác minh độc lập.
- 20 giáo án đã ánh xạ dữ liệu có sẵn, không đồng nghĩa 20 bài production-ready. Lần nhập mới có multi bài 5, groups bài 6 và steps bài 4; bốn renderer/editor đã triển khai. Kéo từ vào câu chưa hỗ trợ riêng; bài 11 chưa rõ slot nên không nhập fill_blanks, bài 15/20 chưa tự bịa bộ hoạt động. Audio/từ thiếu nghĩa/câu thiếu lựa chọn vẫn là nháp.
- Tám nhóm văn hóa chủ yếu có card/khung; không dùng funFacts mẫu làm lời khách hàng. Câu bánh chưng có đủ lựa chọn/đáp án được nhập; intro/facts/quiz chưa đủ vẫn chặn publish.
- Chạy lại cùng checksum luôn skip, kể cả bản đã sửa tay/synced/discarded. Nguồn thay đổi cần kế hoạch nhập mới được duyệt; không tự ghi đè nháp hiện hữu.

## Phiên bản và xử lý lỗi

### Bốn dạng hoạt động mới — triển khai local 2026-10-09

CMS đã thêm form/preview `multi_select`, `group_sort`, `fill_blanks`, `follow_steps`. Nháp thiếu cấu trúc/đáp án vẫn cần bổ sung trước publish; giữ gate production tắt. ID option/group/slot/step được tạo một lần khi thêm và giữ qua reorder; ID activity cấp khi lưu server. Đổi type cần xác nhận bỏ dữ liệu riêng, giữ hướng dẫn/media/hints. Xóa lựa chọn/nhóm/slot có cảnh báo sửa đáp án/mẫu câu, không tự chọn đáp án mới; slot marker không được sửa ngầm. Mỗi slot dùng marker rõ `{{slot-id}}` và acceptedAnswers do content owner duyệt, không suy từ underscore.

Preview bốn dạng dùng renderer thuần và state local, phản hồi trung tính; đáp án admin ở vùng riêng. Không gọi API học/session/outbox/micro và không tuyên bố kiểm chứng động tác follow_steps. QA local và giới hạn ở `08-customer-alignment.md`, không coi đoạn này là xác nhận deploy hoặc import DB thật. Ghi SHA catalog khi deploy: source checksum không đổi nên nháp cũ vẫn skip; bổ sung thủ công bằng CMS/CAS sau duyệt, không ép re-import.

- draftVersion là phiên bản biên tập; contentVersion là bản đã phát hành. Legacy live thiếu version là 0. Mỗi save tăng draftVersion, không thay live. Preview đọc đúng draftVersion đã lưu.
- Save/publish/visibility cạnh tranh trả 409. Giữ form local, xem bản server và chủ động tải lại; không merge tự động mảng hoạt động hoặc đáp án. Mất response publish có thể retry đúng draftVersion/baseContentVersion để nhận receipt cũ, không nhân snapshot/audit.
- Publish ghi snapshot legacy 0 (lần đầu), snapshot mới, live, draft và audit trong một transaction. Lỗi bất kỳ bước nào rollback tất cả. Ẩn/hiện story/culture tạo version mới, không xóa lịch sử; bài học không có thao tác ẩn/xóa.
- GET lesson yêu cầu child sở hữu/mở khóa kể cả snapshot. Hoàn thành bài/quiz/recording gửi contentVersion đã mở; không nâng phiên bản ngầm. Thiếu version sau khi live đã đổi trả 409. Recording chỉ được công nhận đúng child/lesson/activity/version và ID upload thật.
- Session/outbox giữ version và câu trả lời; item 400/403/404/409 giữ lại trạng thái cần xử lý, lỗi mạng dừng không mất tail, chỉ đồng bộ đúng tài khoản/hồ sơ. Không báo thưởng cuối cùng trước xác nhận server.
- Reader whitelist tách khỏi giới hạn biên tập mới để không làm mất khả năng đọc catalog cũ (số bài >20, media HTTP cũ). Lưu/publish mới vẫn bắt buộc URL an toàn; trường legacy không hợp lệ phải được admin sửa trước khi xuất bản.

### Khối tóm tắt lỗi neo tới trường (2026-10-17)

Đây là **quyết định triển khai** (chỉ giao diện biên tập, không đổi nghiệp vụ, điểm, quyền hay quy tắc validate/publish). Khi lưu hoặc kiểm tra bản nháp mà server trả lỗi theo trường, khối "N lỗi cần sửa" ở form bài học/truyện/văn hoá hiển thị mỗi lỗi thành một link neo `href="#<id>"`; bấm vào link sẽ chuyển focus (và cuộn tới) đúng ô của lỗi đó. Mỗi ô (hoặc nhóm ô) được validate có `id` ổn định sinh từ `name` (tiền tố `cms-field-`), và khi đang lỗi thì mang `aria-invalid="true"` cùng `aria-describedby` trỏ tới dòng lỗi tương ứng.

- **Mọi kiểu ô được validate đều có neo**, không chỉ ô chữ/số: ô chọn (`<select>`) như chủ đề văn hoá (`category`), đáp án đúng của quiz và của hoạt động (`*.correctAnswer`); và nhóm ô tick như đáp án chọn nhiều, phân nhóm, hay nhóm tuổi của truyện (`ageGroups`). Với nhóm ô tick/nhiều `<select>`, `id`/`aria-invalid`/`aria-describedby` đặt trên phần tử nhóm (`fieldset`/`role="group"`), còn focus luôn đưa tới một ô thật đầu tiên của nhóm (mỗi ô trong nhóm mang chung `name` của trường để tìm được).
- Một trường có thể mang **nhiều lỗi cùng lúc**; mỗi dòng lỗi có `id` riêng theo chỉ số (`<id>-error-<i>`) nên không trùng, và `aria-describedby` của ô ghép **tất cả** các dòng lỗi của trường đó (cùng ghi chú nguồn nếu có).
- Khi lỗi ở nhóm/mảng (ví dụ một hoạt động), link đưa focus tới ô con đầu tiên của nhóm. Cú bấm link **luôn** chặn hành vi nhảy hash của trình duyệt, nên nếu không tìm thấy ô thì link cũng không trở thành link chết trỏ tới một id không tồn tại.

Thông báo lỗi vẫn do server quyết định; phần này chỉ thêm điều hướng và ngữ nghĩa khả truy cập.

## Ảnh bìa demo story/culture (2026-10-09)

Ảnh bìa minh họa từ Wikimedia Commons được tự host ở `client/public/images/covers/`; nguồn, tác giả, giấy phép ở [`content-image-credits.md`](./content-image-credits.md) và `server/src/seeds/contentCovers.ts`. Script `server/src/seeds/applyContentCovers.ts` (dry-run mặc định, `--apply` để ghi) chỉ điền `coverImage` đang trống cho nội dung legacy (contentVersion trống/0, chưa có ContentRevision và không có ContentDraft chưa discarded); bản đã qua CMS bị bỏ qua và phải gán qua nháp → xuất bản. Đây là **quyết định triển khai** cho DB demo/local, không phải seed ghi đè live. Không tạo revision/audit vì nội dung legacy chưa có phiên bản; snapshot legacy 0 sẽ chứa ảnh khi publish lần đầu. **Giả định chờ duyệt**: content team duyệt ảnh và cách hiển thị ghi công (CC BY/BY-SA) trước production. Client hiển thị khối gradient + icon theo type/category khi không có `coverImage`, không còn ảnh fallback dùng chung.

## Upload ảnh bìa qua CMS (2026-10-12)

Đây là **quyết định triển khai** cho story/đồng dao và văn hóa: admin chọn JPG/PNG/WebP tối đa 5 MiB trong form nháp. Backend cấp signed intent và kiểm tra lại role, draft version, public ID và metadata Cloudinary; browser upload thẳng Cloudinary image preset tách khỏi audio. Sau finalize, URL chỉ nằm trong form local; admin phải bấm **Lưu nháp**, còn publish/visibility vẫn qua CAS và cờ `CMS_PUBLISH_ENABLED`.

- Preset production đề xuất: `vietverse_content_images_signed`, Signed, `overwrite=false`, public ID tự sinh, discard original filename, chỉ `jpg,png,webp`, image upload type.
- Nếu Cloudinary UI không có `max_file_size`, 5 MiB vẫn được chặn ở client/backend; không ghi nhận provider đã chặn vượt cỡ nếu chưa có bằng chứng thật.
- Không upload ảnh khách hàng để smoke test nếu chưa có yêu cầu riêng. Asset mồ côi do mất response cần đối soát theo public ID; không xóa wildcard.

## Bản dịch theo ngôn ngữ hỗ trợ (2026-10-17)

Đây là **quyết định triển khai** cho story/đồng dao và văn hóa: form nháp có khối "Bản dịch theo ngôn ngữ hỗ trợ" thu gọn theo từng ngôn ngữ (`en`, `ja`, `ko`, `zh`, `fr`). Admin nhập bản dịch cho tiêu đề, phần giới thiệu/mô tả, từng thẻ "Có thể bé chưa biết?"/từng dòng đọc và từ vựng; mỗi ô dịch hiện nội dung tiếng Việt gốc làm gợi ý (placeholder) để đối chiếu. Lưu bằng **Lưu nháp** và kiểm tra bằng **Xem trước** như các trường khác; bản dịch là tùy chọn và **không** là điều kiện publish.

- Bản dịch chỉ bổ sung hiển thị cho bé (dưới đoạn tiếng Việt), không đổi quiz, chấm điểm, exploration hay ViVi Points. Ngôn ngữ ngoài tập hỗ trợ (kể cả `other`) bị schema từ chối.
- Mảng bản dịch (facts/lyrics/vocab) song song theo index với bản tiếng Việt; sửa thứ tự hoặc xóa dòng nguồn thì cần soát lại bản dịch tương ứng.
- **Giả định chờ duyệt**: bản dịch tiếng Anh trong seed demo là bản nháp chưa duyệt, chỉ để xem thử; content owner cần duyệt văn bản và bản quyền trước production. Không có migration ghi bản dịch lên production trong thay đổi này.

## Rollback

Tắt `CMS_PUBLISH_ENABLED` để ngừng publish/visibility. Giữ backend reader phiên bản và client/session/outbox hiểu version. Không hạ về grader chỉ đọc live sau khi đã xuất bản revisions. Không xóa revisions, drafts, progress, recording hay ledger. Khôi phục nội dung cũ bằng lần xuất bản mới có kiểm tra từ snapshot; chưa có nút khôi phục một chạm.

## Kiểm chứng và giới hạn

Kiểm chứng tự động gồm RBAC, CAS, transaction rollback, nguồn thực tế, import lặp, recording ownership, replay/quiz không nhân thưởng, offline queue, form dirty/conflict và preview không mutation. Kết quả cuối cùng và smoke test ghi ở `08-customer-alignment.md`.

Chưa nghiệm thu audio/bản quyền production, thiết bị thật/Safari/axe, thanh toán thật hoặc import database thật. Các khoảng trống ngoài CMS (Google OAuth, lịch sử điểm đầy đủ) không được coi là đã hoàn tất. Khi đã publish loại mới không rollback về reader/grader cũ: tắt publish, giữ compatibility code, khôi phục nội dung qua version mới, không rollback ledger/progress.
