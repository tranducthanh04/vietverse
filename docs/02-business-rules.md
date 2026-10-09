# 02 — Quy tắc nghiệp vụ

## 1. Tài khoản và subscription

- Email tài khoản là duy nhất và được chuẩn hóa lowercase.
- Tài khoản đăng ký mới có role `parent`, subscription `free`, tối đa 1 hồ sơ bé.
- Seed có tài khoản `admin` và `parent` demo; mật khẩu chỉ dùng local/demo và không được dùng production.
- Plan hiện có: `free`, `monthly`, `yearly`.
- *Quyết định nghiệp vụ thanh toán (2026-10-03)*: Gói tháng là 149.000đ, tối đa 1 hồ sơ bé; gói năm là 990.000đ, tối đa 3 hồ sơ bé. Giá hiển thị ở FE và giá do server tạo payment link phải luôn khớp; server là nguồn quyết định số tiền.
- PayOS hiện xử lý thanh toán một lần cho thời hạn tháng/năm; không tự động trừ tiền định kỳ.
- Chỉ kích hoạt/gia hạn subscription sau webhook PayOS hợp lệ: chữ ký phải được SDK xác minh và số tiền webhook phải khớp đơn hàng. `returnUrl` chỉ phục vụ trải nghiệm UI, không được dùng để xác nhận đã trả tiền.
- Mỗi đơn chỉ có thể chuyển từ `pending` sang `completed` một lần. Cập nhật đơn và subscription phải nằm trong cùng MongoDB transaction; môi trường production phải dùng MongoDB replica set hỗ trợ transaction.
- *Quyết định vận hành (2026-10-05)*: Phụ huynh đã đăng nhập (và admin) có thể mở trang thanh toán thử, tạo giao dịch PayOS production cố định 10.000đ. Đơn lưu riêng trong `PaymentTestOrder`; webhook hợp lệ chỉ cập nhật đơn test, tuyệt đối không tạo/cập nhật subscription hay quyền học. PayOS hiện không có sandbox; UI phải báo rõ đây là khoản chuyển thật trước khi phụ huynh bấm tạo giao dịch.
- *Quyết định nghiệp vụ*: Hàm kiểm tra quyền học trả phí `isSubscriptionPaid` bắt buộc kiểm tra đồng thời: (1) `subscription.active === true`, (2) `subscription.plan` thuộc `['monthly', 'yearly']`, và (3) `subscription.expiresAt` còn hạn (lớn hơn thời điểm hiện tại).
- Giới hạn tạo bé được kiểm tra nghiêm ngặt tại server (`ChildrenService.createChild`).

## 2. Hồ sơ bé

- Một hồ sơ thuộc đúng một `parentId`.
- Nhóm tuổi hợp lệ: `5-6`, `6-8`.
- Hồ sơ bắt đầu ở stage 1, level 1, 0 điểm trong luồng tạo mới.
- *Quyết định nghiệp vụ (Cascade Deletion)*: Khi phụ huynh xóa hồ sơ bé (`DELETE /children/:id`), hệ thống bắt buộc thực hiện xóa thác (cascade deletion) toàn bộ dữ liệu phụ thuộc gồm: `LessonProgress`, `Recording` (âm thanh bé đọc), `ExplorationLog`, `PointTransaction` và `Redemption`. Ngăn chặn hoàn toàn dữ liệu mồ côi và rò rỉ âm thanh của trẻ.
- *Quyết định nghiệp vụ (Screen Time Limit)*: Phụ huynh thiết lập giới hạn phiên màn hình (`15`, `20`, `30` phút hoặc `0` là không giới hạn). Khi bé học đạt đến ngưỡng thời gian liên tục, hệ thống client kích hoạt `ScreenTimeLimitModal`, tạm dừng tương tác và hiển thị mascot nhắc nhở nghỉ ngơi cho mắt. Chỉ phụ huynh giải phép tính mở khóa Parent Gate mới được gia hạn thêm phiên.

## 3. Chặng và bài học

- Có 5 chặng, 20 bài theo seed (4 bài/chặng). Seed mới tạo nội dung mẫu theo 5 mục tiêu khách hàng; database cũ không bị thay thế lesson đã có.
- Stage 1 mở cho tài khoản hợp lệ.
- Stage sau cần hoàn tất toàn bộ bài của stage trước và subscription trả phí hợp lệ.
- Trong một stage, bài sau chỉ mở khi bài ngay trước đã completed.
- Trạng thái bài: `not_started`, `in_progress`, `completed`.
- *Quyết định triển khai*: phiên học của bé dùng cùng hồ sơ được chọn giữa bản đồ, bài học và nội dung khám phá; khi đạt `screenTimeLimit` (15/20/30 phút), client khóa nội dung cho tới khi Parent Gate gia hạn hoặc bé nghỉ.
- Sao: 1 sao mặc định (khi scorePercent từ 50% đến 69%), 2 sao từ 70%, 3 sao từ 90% theo `scorePercent` do server tự chấm.
- Điểm đỗ bài học: bé cần đạt `scorePercent >= 50%` để được tính `completed` và nhận thưởng. Điểm dưới 50% lưu `status: 'in_progress'`, 0 sao và 0 điểm thưởng.
- `freeInStarterPlan` là cờ nội dung cho phép học thử.
- Server xác thực bắt buộc child sở hữu lesson, stage eligibility, plan (active và chưa hết hạn), câu trả lời và điều kiện mở khóa trước khi xem nội dung hoặc ghi progress/thưởng:
  - *Quyết định nghiệp vụ*: Server dùng `assertLessonUnlocked` kiểm tra: (1) Replay bài đã hoàn thành luôn được phép; (2) Chặng 1 bài 1 luôn mở, bài k yêu cầu bài k-1 hoàn thành; (3) Chặng N (N > 1) yêu cầu subscription paid active + hoàn thành toàn bộ bài chặng N-1; (4) Server tự chấm câu trả lời qua `gradeActivity`, cấm client gửi khống `scorePercent`.
  - *Giả định*: Hoạt động `word_card` là thẻ giới thiệu chữ/từ (không có câu đố) nên tính đạt khi hoàn tất xem; hoạt động `record_voice` tính đạt khi bé thực hiện thu âm gửi lên hệ thống.

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
- Thưởng/trừ điểm và record nghiệp vụ có cơ chế rollback bù lỗi tự động (compensation).
- Idempotency key phải xác định được cho từng sự kiện thưởng, bảo vệ qua MongoDB unique compound indexes.
- Không tin `scorePercent` hoặc `isCorrect` do client gửi; server chấm điểm độc lập hoàn toàn.

## 5. Quiz và khám phá

- Quiz văn hóa chỉ thưởng khi mọi câu trong bài đều đúng.
- Câu trả lời phải đúng schema: chỉ số câu hợp lệ, một lựa chọn hợp lệ, không dư dữ liệu không dùng.
- Khám phá story/culture ghi một lần cho mỗi bé/nội dung qua compound unique index `{ childId: 1, kind: 1, refId: 1 }`.
- Log khám phá dùng cho dashboard phụ huynh không bị đếm trùng lặp.

## 6. Đổi quà

- Chỉ item `active` mới đổi được.
- *Quyết định nghiệp vụ*:
  - **Quà hiện vật (Physical)**: Bắt buộc cung cấp đầy đủ họ tên người nhận, số điện thoại và địa chỉ giao hàng (`recipientName`, `phone`, `street`, `city`). Phải kiểm tra và trừ tồn kho atomic `{ active: true, stock: { $gte: 1 } }` giảm `$inc: { stock: -1 }`. Từ chối đổi nếu `stock <= 0` (400 "Vật phẩm đã hết hàng trong kho").
  - **Quà ảo (Virtual)**: Cấm mua lặp nếu bé đã sở hữu vật phẩm trong `Child.ownedItemIds` (400 "Bé đã sở hữu vật phẩm ảo này rồi"). Sau khi đổi thành công, ID vật phẩm được ghi nhận vào `ownedItemIds`.
  - **Trừ điểm Atomic & Bù trừ (Compensation)**: Trừ điểm kiểm tra số dư `{ viviPoints: { $gte: costPoints } }`. Nếu trừ điểm thất bại, tồn kho quà vật lý được rollback ngay lập tức. Mọi lỗi phát sinh khi ghi `PointTransaction` hoặc `Redemption` đều kích hoạt rollback compensation tự động: hoàn điểm, hoàn stock và hủy record dở dang, đảm bảo số dư và sổ cái luôn nhất quán.
- Trạng thái đơn: `pending` (chờ xử lý quà vật lý), `shipped` (đang giao), `delivered` (hoàn tất, tự động gán cho quà ảo).
- *Quyết định triển khai*: hủy đơn chỉ hoàn điểm/tồn kho một lần; đơn `cancelled` không mở lại, nhưng vẫn sửa được ghi chú. Đợt này giữ các trạng thái nguồn mà API hiện chấp nhận; chính sách hoàn quà ảo/đơn đã giao cần chốt riêng. Khóa bù trừ bị kẹt phải được đối soát thủ công theo `docs/08-customer-alignment.md`.

## 7. Parent portal và parent gate

- Dashboard hiển thị tiến độ mô tả, không phải điểm xếp hạng trẻ.
- *Quyết định hiển thị (2026-10-09)*: dashboard tổng hợp các chặng theo catalog thực tế (catalog chuẩn có 5 chặng). Tiến độ bằng số bài `completed` còn tồn tại trong chặng chia tổng số bài của chặng; không dùng số 4 cố định cho database cũ, không tính bài đang luyện tập hoặc bài đã xóa.
- Chặng hiện tại là chặng đầu tiên theo thứ tự chưa hoàn thành, kể cả khi bị khóa; không lấy `Child.currentStageId` làm nguồn chuẩn. Khi tất cả chặng có bài và đã hoàn thành thì không tạo chặng kế tiếp. Catalog trống/chặng chưa có bài không được coi là hoàn thành.
- Quyền mở chặng dùng lại `StagesService`, không thay đổi subscription hay quyền replay. Nhãn khóa ưu tiên: chưa có bài, cần gói học còn hiệu lực (vẫn cần hoàn thành chặng trước), cần hoàn thành chặng trước. Gói hết hạn không xóa tiến độ đã đạt.
- *Giả định hiển thị nhật ký*: 10 ghi nhận mới nhất, trộn trạng thái gần nhất của mỗi bài (`LessonProgress.updatedAt`), bản thu âm và lần khám phá đầu tiên mỗi truyện/bài văn hóa. Đây không phải lịch sử mọi lượt truy cập hay mọi lần làm bài; nhãn khám phá không khẳng định đã nghe audio. Nội dung bị xóa có nhãn không còn khả dụng.
- Số dư ViVi lấy từ báo cáo server; liên kết điểm mở kho điểm hiện có `/diem-thuong` trong không gian bé (chịu giới hạn giờ học), không thay thế trang ledger đầy đủ. Bốn năng lực giữ công thức MVP và phải ghi rõ là chỉ số tham khảo, không phải đánh giá chuyên môn.
- Bốn năng lực: nghe hiểu, nói & giao tiếp, nhận diện mặt chữ, tư duy & văn hóa.
- Mốc trạng thái: từ 70% là `Đã khám phá`, trên 0% là `Đang luyện tập`, còn lại `Chưa bắt đầu`.
- *Quyết định nghiệp vụ (Server-side Parent Gate Step-Up Auth)*: Cổng phụ huynh được bảo vệ bằng quy trình xác thực nâng cấp (step-up token) có chữ ký số từ server:
  - Client gọi `GET /parent/gate/challenge` để nhận phép nhân ngẫu nhiên và `challengeToken` ngắn hạn (5 phút).
  - Phụ huynh giải toán hoặc nhập PIN gửi đến `POST /parent/gate/verify`, server kiểm tra và phát hành `gateToken` có hạn 15 phút.
  - Các API nhạy cảm (`GET /parent/progress/:childId`, `PATCH /parent/screen-time`) bắt buộc gửi kèm header `X-Parent-Gate-Token`. Nếu thiếu hoặc hết hạn, server từ chối truy cập bằng lỗi `403 PARENT_GATE_REQUIRED`.
  - *Quyết định triển khai (2026-10-09)*: reload trong cùng tab giữ token Parent Gate còn hạn khi khôi phục phiên đăng nhập; không coi bước khôi phục `user: null -> user` là đăng nhập mới. Đăng nhập/đăng ký tường minh, đăng xuất, khôi phục phiên thất bại hoặc đổi tài khoản đã tải phải xóa token và thời hạn mở khóa. Server vẫn kiểm tra chủ token và hạn dùng, không thay bằng niềm tin ở client.

## 8. Admin

- Chỉ role `admin` được xem KPI, learners, redemptions và thao tác quản trị bài học / đơn hàng.
- Tất cả mutation của admin (`createLesson`, `updateLesson`, `updateRedemption`) bắt buộc qua Zod schema validation:
  - `createLessonSchema`: validate ObjectId `stageId`, `order` nguyên dương 1–100, `title`, `activities` thuộc 7 loại hợp lệ.
  - `updateRedemptionSchema`: yêu cầu ít nhất 1 trường thay đổi, validate `status` thuộc `['pending', 'shipped', 'delivered', 'cancelled']`, trackingCode, carrier.
- Các API truy vấn danh sách (`getLearners`, `getRedemptions`) áp dụng giới hạn tối đa 100 bản ghi mỗi yêu cầu.


