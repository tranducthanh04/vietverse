# Khởi tạo catalog mới từ nguồn khách hàng

Trạng thái cuối 2026-10-11: đã migrate/nạp `thanh/test`, receipt verified, BE và FE Production Ready, API catalog qua FE đủ số lượng. Các bước1–5 hoàn tất cho phạm vi schema/catalog/deploy không Cloudinary/thanh toán. Bằng chứng và follow-up ngoài phạm vi tại [journal](../journals/2026-10-11-schema-catalog.md). Các ghi chú blocker phía dưới là lịch sử trước lần nhập mật khẩu thành công.

Phạm vi đã được owner cho phép: tạo dữ liệu mới theo Google Docs và tự biên soạn phần giáo án/văn hóa còn thiếu. Đây không phải khôi phục DB cũ. AgentKit CLI không có trên máy; kế hoạch và bằng chứng được lưu trực tiếp trong repo.

## Quyết định và giới hạn

- Giữ văn bản bài đọc từ snapshot có checksum; không dùng đoạn demo thay lời nguồn.
- Giáo án bổ sung theo heading chi tiết, văn hóa biên soạn theo chủ đề; gắn nhãn bổ sung và lưu provenance từng nội dung.
- Khởi tạo trực tiếp catalog **chỉ khi toàn bộ stage/lesson/story/culture/draft/revision trống**. Đây là ngoại lệ bootstrap được owner yêu cầu, không mở CMS publish và không phải cơ chế cập nhật live.
- Không tạo tài khoản/admin, điểm, tiến độ, thanh toán, quà hay audio. Không tự sửa Atlas networking/quyền.
- URI nhập riêng qua stdin; CLI chỉ cho phép cluster thanh và DB test, tuyệt đối không đọc `.env` cũ.
- Nạp bằng transaction và receipt gắn hash; giữ khóa chung với seed/import. Retry không nhân dữ liệu, conflict dừng. Empty preimage ghi trong receipt; lỗi trước commit abort toàn bộ. Sau commit chỉ phục hồi qua CMS/version mới, không xóa lịch sử.
- Không có nhánh dev để sync theo pull-before-code; đã fetch và xác nhận HEAD = origin/main, giữ nguyên worktree đang có thay đổi.

## Acceptance / thứ tự

1. Kiểm thử RED trước: lời nguồn, validation, canonical answers, mapping, dry-run, empty gate, rollback, retry và target URI.
2. Tạo catalog riêng và loader transaction, không thay snapshots hoặc importer CMS.
3. Chạy narrow/full tests, typecheck/build, review độc lập.
4. Đúng host/db, preflight đếm và hash, nạp bằng credential riêng sau khi gate qua.
5. Kiểm API BE/FE và ghi bằng chứng; không coi code/test pass là DB thật đã có dữ liệu.

Các giới hạn cần báo: bản quyền/attribution nguồn chưa xác minh độc lập; không audio; Atlas network tạm sáu giờ; gói trả phí/Cloudinary/PayOS vẫn theo cấu hình hiện hành.

## Bằng chứng tiếp tục

Kết quả cuối lượt 2026-10-11: backend chạy full lại357/357, frontend164/164, typecheck/build đạt; reviewer không có Critical/Important. Chưa nạp Atlas: cần nhập credential riêng thành công để dry-run/apply; xem journal `2026-10-11-schema-catalog.md`.

2026-10-11: owner duyệt schema và database `test`. Đã bổ sung companionLanguages/model/API/onboarding, migration preimage/receipt transaction, hash-bound dry-run và cascade preimage. Test tập trung 20/20, client164/164, typecheck/build qua. Full BE đầu 356/357 (recordingFinalize concurrency 201/503), chạy riêng 14/14 qua. Chưa apply: launcher dry-run kết thúc password cancelled/failed trước connect. Các bước 4–5 vẫn chờ credential riêng, chưa đóng kế hoạch. Theo quan sát Atlas mới, không xác nhận rule hiện tại còn timeout sáu giờ; xem runbook.

Catalog/loader đã có regression và full BE suite 351/351, typecheck/build qua. Review cuối chấp nhận có điều kiện owner xác nhận không còn admin JWT/writer ngoài luồng ở dialog. Launcher kết thúc trước preflight vì chưa nhận được credential hợp lệ; chưa nạp Production. Bằng chứng và bước cần owner ở `plans/journals/2026-10-10-customer-bootstrap.md`. AgentKit CLI không có, chưa cập nhật plan index hoặc đóng kế hoạch.
