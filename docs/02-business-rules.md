# 02 — Quy tắc nghiệp vụ

## 1. Tài khoản và subscription

- Email tài khoản là duy nhất và được chuẩn hóa lowercase.
- Tài khoản đăng ký mới có role `parent`, subscription `free`, tối đa 1 hồ sơ bé.
- Seed có tài khoản `admin` và `parent` demo; mật khẩu chỉ dùng local/demo và không được dùng production.
- Plan hiện có: `free`, `monthly`, `yearly`.
- Code hiện suy ra paid chỉ từ tên plan; khi vận hành thật phải kiểm tra `active` và `expiresAt`.
- Giới hạn tạo bé phải được kiểm tra ở server.

## 2. Hồ sơ bé

- Một hồ sơ thuộc đúng một `parentId`.
- Nhóm tuổi hợp lệ: `5-6`, `6-8`.
- Hồ sơ bắt đầu ở stage 1, level 1, 0 điểm trong luồng tạo mới.
- Xóa hồ sơ phải có chính sách dữ liệu đi kèm cho progress, recording, transaction, redemption và exploration log; baseline chưa cascade.
- `screenTimeLimit` hợp lệ theo UI phụ huynh: `0`, `15`, `20`, `30`, `45`, `60` phút. Giá trị lưu rộng hơn trong schema không đồng nghĩa được phép bởi nghiệp vụ.

## 3. Chặng và bài học

- Có 5 chặng, 20 bài theo seed.
- Stage 1 mở cho tài khoản hợp lệ.
- Stage sau cần hoàn tất toàn bộ bài của stage trước và subscription phù hợp.
- Trong một stage, bài sau chỉ mở khi bài ngay trước đã completed.
- Trạng thái bài: `not_started`, `in_progress`, `completed`.
- Sao: 1 sao mặc định, 2 sao từ 70%, 3 sao từ 90% theo `scorePercent` hiện tại.
- `freeInStarterPlan` là cờ nội dung nhưng baseline chưa dùng để quyết định unlock; không được tự coi cờ này là đã có hiệu lực.
- Server phải xác thực child sở hữu lesson, stage eligibility, plan, câu trả lời và điều kiện hoàn thành trước khi ghi progress hoặc thưởng.

## 4. ViVi Points

| Sự kiện | Điểm | Điều kiện |
| --- | ---: | --- |
| Hoàn thành bài | +10 | Tối đa một giao dịch cho mỗi bé/bài |
| Quiz văn hóa đúng toàn bộ | +5 | Tối đa một giao dịch cho mỗi bé/bài viết |
| Hoàn thành toàn bộ chặng | +20 | Tối đa một giao dịch cho mỗi bé/chặng |
| Hoàn thành bài 20 | +50 | Tối đa một giao dịch cho mỗi bé/bài 20 |
| Đổi quà | Âm theo giá | Không được âm số dư; quà vật lý cần địa chỉ |

Nguyên tắc bắt buộc:

- `PointTransaction` là sổ cái; số dư trên `Child.viviPoints` phải khớp với giao dịch.
- Thưởng/trừ điểm và record nghiệp vụ cần transaction MongoDB hoặc cơ chế bù lỗi rõ ràng.
- Idempotency key phải xác định được cho từng sự kiện thưởng.
- Không tin `scorePercent` hoặc `isCorrect` do client gửi nếu server có đủ dữ liệu để tự chấm.

## 5. Quiz và khám phá

- Quiz văn hóa chỉ thưởng khi mọi câu trong bài đều đúng.
- Câu trả lời phải đúng schema: chỉ số câu hợp lệ, một lựa chọn hợp lệ, không dư dữ liệu không dùng.
- Khám phá story/culture ghi một lần cho mỗi bé/nội dung.
- Log khám phá dùng cho dashboard phụ huynh nên không được đếm trùng do retry.

## 6. Đổi quà

- Chỉ item `active` mới đổi được.
- Quà vật lý bắt buộc có người nhận, số điện thoại và địa chỉ.
- Trừ điểm phải atomic với điều kiện đủ số dư.
- Stock vật lý phải được trừ atomic; không nhận đơn khi hết stock.
- Tạo transaction, redemption và cập nhật stock phải nhất quán.
- Trạng thái đơn: `pending`, `shipped`, `delivered`.
- Virtual item hiện ghi vào `ownedItemIds`; chính sách cho phép mua lặp hay chỉ mua một lần phải được chốt trong tài liệu trước khi sửa.

## 7. Parent portal và parent gate

- Dashboard hiển thị tiến độ mô tả, không phải điểm xếp hạng trẻ.
- Bốn năng lực: nghe hiểu, nói & giao tiếp, nhận diện mặt chữ, tư duy & văn hóa.
- Mốc trạng thái: từ 70% là `Đã khám phá`, trên 0% là `Đang luyện tập`, còn lại `Chưa bắt đầu`.
- Parent gate 15 phút là lớp UX ở client; không được xem đây là biện pháp bảo mật thay cho authorization server.

## 8. Admin

- Chỉ role `admin` được xem KPI, learners, redemptions và sửa lesson/order.
- Tất cả payload admin phải có schema riêng, whitelist field và audit log khi đưa vào production.
- Cập nhật redemption phải kiểm soát chuyển trạng thái hợp lệ, tracking và carrier.

