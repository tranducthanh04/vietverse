# ADR — Google Sign-In an toàn

## Quyết định

- Dùng Google Identity Services Web ID token ở client; backend dùng `google-auth-library` để kiểm tra audience, issuer, hạn token, `email_verified`, subject và nonce.
- Cookie token ngẫu nhiên được lưu SHA256 trong `GoogleAuthFlow`; nonce là giá trị riêng gửi cho Google và đối chiếu ID token. Cookie HttpOnly/flow có hạn 5 phút, dùng một lần; flow liên kết được giữ riêng trong cùng thời hạn và giới hạn 5 lần thử mật khẩu.
- User mới luôn có role `parent` và subscription `free`. Email trùng tài khoản hiện có không tự liên kết; phải xác nhận mật khẩu Vietverse. Role, gói, children và tiến độ hiện có được giữ nguyên.

## Quyết định nghiệp vụ và giả định

- Quyết định nghiệp vụ: không hỏi hoặc lưu mật khẩu Google; không tự đổi role/quyền khi SSO.
- Giả định kỹ thuật: `CLIENT_ORIGIN` là origin chính được đăng ký trong Google Cloud Console; các domain preview cần đăng ký riêng hoặc dùng cấu hình môi trường tương ứng.

## Kích hoạt

1. Tạo OAuth Web Client ID trong Google Cloud Console.
   Cấu hình màn hình consent/branding và email hỗ trợ; nếu ở trạng thái Testing, thêm tài khoản nghiệm thu vào Test users. Chỉ dùng danh tính cơ bản email/profile, không xin Gmail hoặc Drive.
2. Thêm `GOOGLE_CLIENT_ID` vào backend/Vercel environment, không thêm client secret vào frontend.
3. Thêm `CLIENT_ORIGIN` vào Authorized JavaScript origins.
   Nhập origin (scheme + hostname + port nếu có), không thêm đường dẫn: local `http://localhost:5173`, production là domain FE chính đã xác minh. Luồng GIS popup không yêu cầu redirect URI/callback route hoặc client secret. FE lấy Client ID public từ BE, không cần biến `VITE_GOOGLE_*`.
4. Kiểm tra index bằng `npm run deploy:indexes -w server -- --dry-run`; sau khi xác nhận đúng DB và backup, chạy `--apply` với URI đích đã xác minh. Lệnh chỉ thêm indexes, không xóa dữ liệu/index cũ; duplicate googleId phải xử lý thủ công.
5. Build/deploy và nghiệm thu sign-in mới, link tài khoản cũ, hủy/retry và callback không còn hiệu lực.

### Trạng thái kích hoạt — 2026-10-12

- Project Google Cloud `vietverse` đã tạo; OAuth Web Client ID đã cấu hình ở backend Vercel Production dưới tên `GOOGLE_CLIENT_ID` (không lưu giá trị trong Git/tài liệu).
- `CLIENT_ORIGIN` Production là `https://vietverse-nine.vercel.app`; Authorized JavaScript origin tương ứng đã được khai báo trong OAuth client.
- Commit `ef1c300` đã deploy Ready ở cả FE `https://vietverse-nine.vercel.app` và BE `https://vietverse-backend.vercel.app` (FE deployment `dpl_Ag1Ph3Rbee4x38YDinwes6u7d5Mf`, BE deployment `dpl_9yFdZUYNwmE7WbZYA9EDV25UJa9M`).
- Smoke production đã xác nhận `GET /auth/google` trả cấu hình, `POST /auth/google/start` tạo challenge, `POST /auth/google/cancel` hủy challenge; trang đăng nhập hiển thị nút Google. Đăng nhập bằng tài khoản Google mới đã thành công và chuyển tới `/bat-dau`; chưa tạo hồ sơ bé hoặc dữ liệu học/thanh toán. Liên kết email hiện có bằng mật khẩu Vietverse mới được kiểm thử local.

Ưu tiên FE proxy `/api` cùng origin để tránh trình duyệt chặn third-party cookies. Nếu FE host đặt COOP strict, cần kiểm tra popup Google và cân nhắc `same-origin-allow-popups`. Chưa thay các header deployment trong đợt này.

## Phiên và rollback

- Các request ghi cookie auth trong cùng tab được tuần tự hóa kể cả khi trang Google unmount. Không chỉ bỏ qua callback JS vì trình duyệt vẫn xử lý `Set-Cookie` của response. Hủy flow dùng token+nonce, không clear cookie có thể đã được thay ở tab khác.
- Mỗi request auth ghi cookie/refresh có timeout 20 giây để lỗi mạng không chặn hàng đợi đăng nhập vô thời hạn; Google script timeout 10 giây và cho tải lại.
- Nhiều tab vẫn dùng chung cookie như email auth hiện tại, không hỗ trợ nhiều tài khoản riêng từng tab. Xóa Parent Gate và cache subscription khi chấp nhận đăng nhập Google; subscription thực trên DB không thay đổi.
- Rollback: bỏ `GOOGLE_CLIENT_ID`, redeploy BE để khóa Google mới; không xóa User/googleId/subscription/indexes. JWT đã cấp giữ vòng đời hiện tại. Tài khoản Google-only không đăng nhập mới khi tắt provider; tài khoản đã có mật khẩu vẫn dùng email. Chưa triển khai đổi/hủy liên kết hoặc đặt mật khẩu Google-only.

Google Client ID, deployment, origin và challenge/index readiness production đã được xác minh; popup Google mới đã sign-in thành công trên trình duyệt owner. Không lưu credential hoặc mã xác thực trong repo/chat.
