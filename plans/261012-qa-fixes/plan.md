# Sửa lỗi QA và Cloudinary - 2026-10-12

## Phạm vi đã được yêu cầu

Sửa F01/F02/F03 và copy O01 của báo cáo QA; kiểm tra và sửa recording/Cloudinary. Không triển khai, cấu hình hay tạo giao dịch thanh toán; không deploy, push, seed DB thật hoặc thay đổi quyền/điểm.

## Các bước và tiêu chí

1. Chẩn đoán: F01 là chữ tĩnh giả link; F02 tự thêm prefix vào title có prefix; F03 luôn render duration. SDK Cloudinary Admin Promise trả lỗi JSON lồng `error.http_code`, inspect hiện đọc sai cấp.
2. Test trước sửa: UI với title có/không prefix, story có/không audio, footer thể hiện chưa khả dụng; Cloudinary nested404 giữ đúng mã cho retry, lỗi credentials/rate-limit không cho reupload.
3. Sửa tối thiểu: không viết chính sách chưa được duyệt; đánh dấu unavailable, không affordance giả. Copy dùng gói miễn phí không hạn dùng thử, không hứa số lượng/audio chưa xác nhận; không thay checkout/giá/quyền.
4. Xác minh: targeted RED/GREEN, full tests, typecheck/build/lint; browser local cô lập desktop/mobile và microphone giả của browser (không ghi âm người thật). Test provider double không được coi là live Cloudinary.
5. Review diff, cập nhật docs và báo cáo bằng chứng; bàn giao cấu hình còn thiếu.

## Ranh giới và giả định

- Cloudinary local thiếu cloud name/key/secret/signed preset: không lấy credential từ nơi khác hoặc đưa secret vào chat/log. Live upload và cấu hình production cần owner cung cấp môi trường được duyệt.
- Atlas lỗi trong lượt QA trước; dùng replica set tạm cho mọi ghi dữ liệu kiểm thử. Không mở whitelist mạng.
- Repo có develop, không có dev như pull-before-code yêu cầu. Giữ snapshot đang QA trên codex/vercel-backend, không suy đoán dev=develop hoặc merge nhánh không được yêu cầu.
- CLI ak không có trên PATH; kế hoạch và kết quả dùng file repo, không tuyên bố đã sync index.

Kết quả và trạng thái thực tế được ghi riêng trong verification.md sau khi chạy.

## Trạng thái bàn giao

- [x] TDD RED/GREEN cho presentation và lỗi SDK Cloudinary.
- [x] Full frontend/backend tests, typecheck, build, client lint.
- [x] Browser smoke public desktop/mobile; review và docs.
- [ ] Thu âm thiết bị/microphone giả và upload live Cloudinary: chưa nghiệm thu, thiếu môi trường provider được cấu hình. Không coi provider doubles là thay thế.

Code fix hoàn tất local; gate kích hoạt Cloudinary live còn mở. Xem `verification.md`.
