# Vận hành CMS và nội dung khách hàng

Ngày 2026-10-09. Quyết định triển khai: admin dùng bản nháp chung, xuất bản chủ động, không ghi live bằng seed. Không đổi điểm, unlock, subscription hoặc ID học tập.

Kế hoạch thực thi chi tiết cho người deploy: [nhập dữ liệu staging và production](./superpowers/plans/2026-10-09-customer-data-deployment.md). Bao gồm kiểm đúng DB/admin, backup/restore rehearsal, index prerequisites, report-bound apply, retry/rollback và biên bản. Đây là bàn giao chưa thực thi DB thật; không thay các gate bên dưới.

## Trước khi bật production

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
- 20 giáo án đã ánh xạ dữ liệu có sẵn, không đồng nghĩa 20 bài production-ready. Chọn nhiều chữ M, phân nhóm nhiều-về-một, nghe thực hiện ba bước, nhiều ô trống cần renderer hoặc quyết định biên tập riêng. Bài 15/20 chưa tự bịa bộ hoạt động. Từ thiếu nghĩa/câu thiếu lựa chọn vẫn là nháp.
- Tám nhóm văn hóa chủ yếu có card/khung; không dùng funFacts mẫu làm lời khách hàng. Câu bánh chưng có đủ lựa chọn/đáp án được nhập; intro/facts/quiz chưa đủ vẫn chặn publish.
- Chạy lại cùng checksum luôn skip, kể cả bản đã sửa tay/synced/discarded. Nguồn thay đổi cần kế hoạch nhập mới được duyệt; không tự ghi đè nháp hiện hữu.

## Phiên bản và xử lý lỗi

- draftVersion là phiên bản biên tập; contentVersion là bản đã phát hành. Legacy live thiếu version là 0. Mỗi save tăng draftVersion, không thay live. Preview đọc đúng draftVersion đã lưu.
- Save/publish/visibility cạnh tranh trả 409. Giữ form local, xem bản server và chủ động tải lại; không merge tự động mảng hoạt động hoặc đáp án. Mất response publish có thể retry đúng draftVersion/baseContentVersion để nhận receipt cũ, không nhân snapshot/audit.
- Publish ghi snapshot legacy 0 (lần đầu), snapshot mới, live, draft và audit trong một transaction. Lỗi bất kỳ bước nào rollback tất cả. Ẩn/hiện story/culture tạo version mới, không xóa lịch sử; bài học không có thao tác ẩn/xóa.
- GET lesson yêu cầu child sở hữu/mở khóa kể cả snapshot. Hoàn thành bài/quiz/recording gửi contentVersion đã mở; không nâng phiên bản ngầm. Thiếu version sau khi live đã đổi trả 409. Recording chỉ được công nhận đúng child/lesson/activity/version và ID upload thật.
- Session/outbox giữ version và câu trả lời; item 400/403/404/409 giữ lại trạng thái cần xử lý, lỗi mạng dừng không mất tail, chỉ đồng bộ đúng tài khoản/hồ sơ. Không báo thưởng cuối cùng trước xác nhận server.
- Reader whitelist tách khỏi giới hạn biên tập mới để không làm mất khả năng đọc catalog cũ (số bài >20, media HTTP cũ). Lưu/publish mới vẫn bắt buộc URL an toàn; trường legacy không hợp lệ phải được admin sửa trước khi xuất bản.

## Rollback

Tắt `CMS_PUBLISH_ENABLED` để ngừng publish/visibility. Giữ backend reader phiên bản và client/session/outbox hiểu version. Không hạ về grader chỉ đọc live sau khi đã xuất bản revisions. Không xóa revisions, drafts, progress, recording hay ledger. Khôi phục nội dung cũ bằng lần xuất bản mới có kiểm tra từ snapshot; chưa có nút khôi phục một chạm.

## Kiểm chứng và giới hạn

Kiểm chứng tự động gồm RBAC, CAS, transaction rollback, nguồn thực tế, import lặp, recording ownership, replay/quiz không nhân thưởng, offline queue, form dirty/conflict và preview không mutation. Kết quả cuối cùng và smoke test ghi ở `08-customer-alignment.md`.

Chưa nghiệm thu audio/bản quyền production, thiết bị thật/Safari/axe, thanh toán thật hoặc import database thật. Các khoảng trống ngoài CMS (Google OAuth, lịch sử điểm đầy đủ, renderer mới) không được coi là đã hoàn tất.
