# 01 — Tổng quan sản phẩm

## Sản phẩm

Vietverse là nền tảng học tiếng Việt tương tác cho trẻ 5–8 tuổi. Trẻ học qua bản đồ 5 chặng, bài học đa hoạt động, đồng dao/truyện karaoke, nội dung văn hóa và cơ chế khuyến khích ViVi Points. Phụ huynh theo dõi tiến độ và bản thu âm; quản trị viên quản lý nội dung, học viên và đơn đổi quà.

## Mục tiêu MVP

- Tạo một hành trình học an toàn, vui nhộn, không xếp hạng trẻ.
- Giúp trẻ làm quen chữ cái, ghép vần, từ vựng, đọc hiểu và văn hóa Việt.
- Ghi nhận nỗ lực bằng điểm và phần thưởng có kiểm soát.
- Cho phụ huynh thấy tiến độ theo bốn nhóm năng lực, không biến thành điểm thi.
- Cho đội vận hành quản trị nội dung và fulfillment quà vật lý.

## Vai trò và quyền

| Vai trò | Mục tiêu | Quyền chính |
| --- | --- | --- |
| Khách | Tìm hiểu sản phẩm | Landing, pricing, nội dung stories/culture công khai |
| Phụ huynh | Tạo tài khoản và quản lý hồ sơ bé | Auth, child profiles, học cùng bé, đổi quà, parent portal |
| Bé | Học và khám phá | Bản đồ, bài học, truyện, văn hóa, kho điểm; thao tác dưới tài khoản phụ huynh |
| Admin | Vận hành sản phẩm | KPI, học viên, bài học, đơn đổi quà |

## Hành trình chính

### Phụ huynh mới

1. Đăng ký hoặc đăng nhập.
2. Tạo hồ sơ bé: tên, nhóm tuổi, ngôn ngữ đồng hành, avatar.
3. Vào bản đồ và chọn bài được mở khóa.
4. Theo dõi điểm, bản thu âm và tiến độ trong Góc Phụ Huynh.

### Bé học bài

1. Chọn hồ sơ bé.
2. Chọn chặng và bài được mở khóa.
3. Làm các hoạt động trong lesson player, có tim và gợi ý.
4. Hoàn thành bài, nhận sao và ViVi Points.
5. Điểm cập nhật vào hồ sơ bé và lịch sử giao dịch.

### Bé khám phá nội dung

1. Mở truyện/đồng dao hoặc bài văn hóa.
2. Nghe karaoke/narration và xem nội dung.
3. Hệ thống ghi nhận khám phá cho hồ sơ bé.
4. Quiz văn hóa đúng toàn bộ có thể nhận thưởng một lần cho mỗi bài.

### Đổi quà

1. Xem kho vật phẩm đang hoạt động.
2. Chọn quà và, nếu là quà vật lý, nhập thông tin nhận hàng.
3. Server kiểm tra số dư và tạo giao dịch trừ điểm.
4. Quà ảo chuyển sang đã giao; quà vật lý tạo đơn chờ xử lý.

## Cập nhật đối chiếu khách hàng — 2026-10-08

- Luồng học của bé dùng một phiên hồ sơ chung giữa bản đồ, bài học và nội dung khám phá; giới hạn screen time được chặn ở client sau khi server lưu cấu hình.
- Seed hiện có catalog mẫu 5 chặng × 4 bài, 21 bài đọc biên tập và 8 nhóm văn hóa. Đây là dữ liệu thử nghiệm, chưa phải nội dung nguyên tác đã được duyệt.
- Phụ huynh được khôi phục hồ sơ sau reload và các API nhạy cảm tiếp tục yêu cầu Parent Gate server-side. Admin hủy đơn/điều chỉnh kho có khóa và cơ chế bù trừ.

## Ngoài phạm vi hoặc chưa hoàn thiện trong baseline

- Thanh toán subscription qua PayOS: xem trạng thái phát hành và cấu hình production tại `03-feature-inventory.md` và `05-api-and-data-contracts.md`.
- Google SSO mới là placeholder.
- Screen time đã chặn phiên học ở client; việc kiểm thử thiết bị thật vẫn chưa nằm trong đợt này.
- Database cũ giữ nguyên lesson khung và nội dung đã biên tập; thay thế chúng cần migration được duyệt riêng.
- Chưa có luồng fulfillment kho/stock hoàn chỉnh cho quà vật lý.

## Tiêu chí thành công

- Trẻ chỉ thấy và hoàn thành nội dung được mở khóa hợp lệ.
- Điểm không thể tự tăng bằng payload client hoặc request lặp.
- Dữ liệu của một bé chỉ được phụ huynh sở hữu xem và thay đổi.
- Admin có thể vận hành nội dung và đơn đổi quà mà không cần sửa database trực tiếp.
- Mỗi thay đổi tương lai có tài liệu nghiệp vụ và tiêu chí chấp nhận trước khi code.

