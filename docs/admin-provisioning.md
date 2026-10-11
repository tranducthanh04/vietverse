# Tạo tài khoản quản trị production

## Phạm vi và quyết định

- Owner yêu cầu tạo một admin sau khi bootstrap catalog hoàn tất (2026-10-11).
- Công cụ offline chỉ tạo `User.role=admin`, không mở API đăng ký admin, không nâng quyền parent hoặc đổi mật khẩu tài khoản đã tồn tại.
- Không tạo Subscription, hồ sơ bé, điểm, thanh toán; không bật CMS publish hoặc Cloudinary.
- Giả định triển khai: email gợi ý `admin@vietverse.edu.vn`, tên `Vietverse Admin`; owner có thể sửa trong hộp nhập trước khi xác nhận.

## Chạy

Trong thư mục repo trên Windows:

```powershell
node server/scripts/provision-admin.cjs
```

Hộp nhập riêng yêu cầu mật khẩu Database User `binhlqhe181123_db_user` (không phải mật khẩu website Atlas), email/tên, mật khẩu admin mới và xác nhận. Mật khẩu mới tối thiểu 12 ký tự, tối đa 72 byte UTF-8 để không bị bcrypt cắt ngầm. Không dùng mật khẩu demo hay PIN parent mặc định.

Target cố định: `thanh.841ysjn.mongodb.net`, database `test`. Chỉ chạy khi không có bootstrap/import/provision khác. Công cụ lấy cùng khóa `vietverse-catalog-seed` với bootstrap, chỉ nhả khóa do chính lượt chạy tạo. Không tự gỡ khóa của lượt crash.

Credentials đi qua pipe riêng giữa các tiến trình, không qua argv, `.env`, file hoặc log. **Không chạy trực tiếp `input-admin-password.ps1`**, vì stdout của helper dành cho launcher riêng. Công cụ không đọc lại sensitive env trên Vercel.

## Bằng chứng, retry và recovery

- Thêm unique index email nếu chưa có, không drop/sync index. Ghi một User atomic với majority acknowledgement; email trùng parent bị từ chối, trùng admin chỉ báo `already_admin`, không thay đổi dữ liệu hoặc mật khẩu.
- Sau ghi, đọc lại role và so khớp bcrypt. Chỉ khi mật khẩu khớp mới kiểm tra HTTPS login qua FE rewrite và GET `/admin/kpi`; không log token hoặc nội dung KPI. Logout chỉ phiên kiểm thử qua refresh cookie. Access token còn hiệu lực tối đa 15 phút theo app nhưng chỉ nằm trong bộ nhớ tiến trình, không được phát ra.
- `created` chứng minh tài khoản đã ghi; `production_auth: passed` chứng minh login, admin API và logout qua production đã thành công. Kết quả khác không được coi là hoàn tất auth smoke.
- Khi mất ACK/crash, chạy lại cùng email và mật khẩu để đối soát. Không tự xóa/đổi mật khẩu. Nếu khóa còn giữ, cần kiểm tra tiến trình và owner duyệt phục hồi khóa chính xác. Nếu cần thu hồi admin, phải có yêu cầu riêng và xử lý cả JWT còn hiệu lực; xóa User không tự thu hồi access JWT hiện tại.
- Đây không phải backup toàn DB, audit bảo mật hoặc nghiệm thu browser/mobile. Networking Atlas, least-privilege và dependency advisories vẫn là việc riêng.

## Kết quả thực thi 2026-10-11

- Launcher exit 0: `target=thanh/test`, `status=created`, email `admin@vietverse.edu.vn`, `passwordVerified=true`.
- Production auth verification `passed`: đăng nhập qua `https://vietverse-nine.vercel.app`, API `/admin/kpi` trả thành công, phiên kiểm thử đã logout. Không lưu mật khẩu, cookie, token hoặc dữ liệu KPI.
- Kiểm chứng local: 368/368 backend và 164/164 frontend tests qua; backend typecheck qua; PowerShell parser và Node syntax check qua. FE vẫn có React Router future-flag warnings.
- Chỉ công cụ offline và docs thay đổi trong lượt tạo admin, không cần redeploy runtime. Cloudinary, thanh toán, CMS publish giữ nguyên trạng thái trước đó.
