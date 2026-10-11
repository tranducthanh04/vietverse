# MongoDB Production: kết nối đã qua với quyền mạng tạm

## Kết quả

Ngày 2026-10-10, khoảng 21:01 +07:00: sau khi owner tự thêm `0.0.0.0/0` tạm 6 giờ và ảnh xác nhận Active, smoke bằng `.superpowers/sdd/2026-10-09-vercel-backend/verify-mongodb-live.cjs` exit0. BE health/readiness200; unknown API BE/FE404/NOT_FOUND; FE auth/me không đăng nhập401/UNAUTHORIZED; FE stories200 với 0 mục. Không sửa env/source hoặc redeploy trong phép kiểm sau mở mạng. Allowlist đã khắc phục lỗi503 quan sát được; TLS lỗi ở URI cũ không mô tả cluster mới.

## Quyết định và giới hạn

Owner yêu cầu dùng cluster trong ảnh, xác nhận mật khẩu Database User và tự mở mạng tạm để kiểm tra. Driver chọn database `test` do không có path, giả định đã thông báo; chưa xác nhận dữ liệu mong muốn ở đó. Không lưu credential, đổi JWT/Preview, tắt TLS, seed/import/apply indexes thủ công hoặc tạo tài khoản thử. GET API có thể ghi limiter và runtime Mongoose có thể tạo indexes; không khẳng định không có DB writes. Cloudinary tiếp tục hoãn.

## Bước tiếp theo

Quyền mạng tạm sẽ tự hết hạn; kết nối mới từ Vercel có thể lỗi lại nếu chưa có đường mạng được duyệt. Owner cần chọn mạng production lâu dài, giảm quyền DB ứng dụng theo least-privilege và xác minh rotation credential ngoài chat. Không tự gia hạn hoặc mở Internet vĩnh viễn. Auth đăng nhập/transaction/indexes/storage/PayOS và dữ liệu ứng dụng vẫn cần nghiệm thu riêng; không seed để che danh sách rỗng.

## Ghi nhận quy trình

CLI `ak` không có sẵn: đây là journal Markdown thủ công thay thế, chưa được tạo/validate bằng `ak journal`. AgentWiki publish skipped. Không cài CLI hoặc publish hồ sơ này.
