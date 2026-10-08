# 08 — Đối chiếu yêu cầu khách hàng và phạm vi sửa ngày 2026-10-08

Nguồn yêu cầu: [Google Docs của khách hàng](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit).

Tài liệu này bổ sung baseline ngày 2026-10-01. Các dòng “hoàn thiện” trong inventory cũ không đồng nghĩa đã nghiệm thu theo tài liệu khách hàng. Không thay đổi chính sách điểm, giá subscription hoặc quyền mở khóa trong đợt này.

## Phạm vi đã được duyệt

- Sửa lỗi các luồng hiện có: giới hạn phiên học, khôi phục hồ sơ phụ huynh khi reload, lỗi Parent Gate, địa chỉ nhận quà, trạng thái audio và hủy đơn/điều chỉnh kho.
- Bổ sung catalog có 5 chặng × 4 bài, danh mục 21 truyện/đồng dao và 8 chủ đề văn hóa theo cấu trúc yêu cầu.
- Seed phải chạy lại an toàn, không xóa tài khoản, tiến độ, điểm, đơn đổi quà hoặc nội dung đã biên tập.
- Kiểm thử qua API, UI và ranh giới seed; không suy diễn rằng unit/integration tests thay thế nghiệm thu trên thiết bị thật.

## Quyết định nghiệp vụ — đơn đổi quà

- Hủy đơn chỉ hoàn điểm/tồn kho một lần; `cancelled` không thể chuyển về trạng thái khác. Cho phép sửa ghi chú của đơn đã hủy.
- Các mutation trên cùng đơn dùng khóa `Redemption.mutationInProgress` ở database. Request cạnh tranh nhận 409 và cần tải lại trạng thái; trường khóa không xuất hiện trong API.
- Trong lúc hoàn điểm, `Child.refundLock` và `ShopItem.refundLock` khóa số dư/tồn kho theo ID đơn. Đổi quà và sửa kho phải tôn trọng khóa để không tiêu dùng khoản hoàn tạm thời trước khi đơn ghi xong. Hoàn tất rồi mới mở khóa; lỗi mở khóa sau commit không được rollback tiền/điểm đã có thể tiêu dùng.
- Nếu một bước ghi refund thất bại, hệ thống bù các bước đã thực hiện trước khi mở khóa. Nếu tiến trình bị dừng đột ngột hoặc bù lỗi thất bại, giữ khóa để chặn hoàn lặp; không tự mở khóa theo timeout.
- **Giới hạn vận hành:** khóa không phải MongoDB transaction. Với đơn bị kẹt khóa, vận hành phải kiểm tra ledger `reason=refund, refId=redemptionId`, số dư, stock và trạng thái đơn trước khi phục hồi. Không chạy thao tác mở khóa hàng loạt; cần backup và đối soát từng đơn. Tự phục hồi sau crash chưa nằm trong đợt này.
- Log lỗi có `redemptionId` để truy vết. Khi đối soát phải kiểm tra cả khóa đơn lẫn khóa tài nguyên (field `select: false`, cần truy vấn chọn rõ); chỉ xóa khóa có owner đúng ID đơn đã đối soát. Nếu trạng thái đã hủy và refund/stock đã ghi đủ thì chỉ hoàn tất mở khóa, không hoàn lần nữa. Không suy đoán kết quả từ một field riêng lẻ.
- Nút cộng/trừ kho gửi `stockDelta`, server `$inc` kèm điều kiện không âm. API `stock` tuyệt đối được giữ để tương thích; client cũ dùng nó vẫn có rủi ro ghi đè dữ liệu đã cũ. Không gửi đồng thời `stock` và `stockDelta`.

## Quyết định dữ liệu — catalog và seed

- Seed mặc định chỉ thêm bản ghi còn thiếu; không thay thế giáo án, đổi stage của lesson, reset tồn kho hay tái tạo tài khoản đang tồn tại.
- Database mới nhận giáo án mẫu theo 5 mục tiêu: làm quen tiếng Việt; âm/chữ/thanh/vần; ghép tiếng/đọc; nói/kể chuyện; đọc hiểu/vận dụng. Bài 20 có năm thử thách.
- Database cũ giữ nguyên lesson IDs và nội dung, kể cả bài khung. Thay bài khung cần một migration đã xem trước và duyệt riêng, vì progress/recording đang tham chiếu lesson IDs và activity IDs.
- Danh mục tác phẩm lấy từ khách hàng không đồng nghĩa đã có nguyên tác, quyền sử dụng và file âm thanh. Bài đọc biên soạn phải được ghi nhãn rõ, không gán là lời nguyên tác.
- `Story.audioUrl` có thể trống khi chưa có media; UI phải hiển thị chưa có âm thanh thay vì mô phỏng đang phát.

### Chạy seed an toàn

- Từ thư mục repo, kiểm tra trước `MONGODB_URI` trỏ đúng database dự kiến (không đưa URI/mật khẩu vào log hoặc commit). Windows PowerShell dùng `npm.cmd` để truyền đúng CLI flags.
- Xem kế hoạch không ghi: `npm.cmd run seed -w server -- --dry-run`. Linux/macOS dùng `npm` thay `npm.cmd`.
- Sau khi duyệt kế hoạch, thêm bản ghi thiếu: `npm.cmd run seed -w server`. Chỉ môi trường demo/local mới dùng `-- --demo-users`; production từ chối cờ này.
- Nếu phát hiện xung đột stage/order/tên đã chuẩn hóa, seed dừng trước khi ghi. Không xóa dữ liệu để vượt qua lỗi; đối soát định danh trước.
- Collection `seed_locks` có khóa `vietverse-catalog-seed` chống hai seed ghi đồng thời. Nếu tiến trình crash, kiểm tra không còn seed chạy và đối soát bản ghi đã thêm trước khi vận hành mở khóa; không tự hết hạn khóa.
- Kiểm thử đợt này chạy trên database local tách biệt. Chưa nạp catalog vào database được cấu hình cho môi trường thật.

## Giả định cần khách hàng xác nhận

- Giáo án mẫu, câu hỏi và nội dung văn hóa biên soạn là dữ liệu thử nghiệm cần chuyên môn giáo dục duyệt trước phát hành.
- Khách hàng/content team cung cấp hoặc duyệt nguyên tác, tác giả, quyền sử dụng, ảnh và bản thu âm. Không xem URL chưa tồn tại là asset hoàn thiện.
- Giữ tiến độ tổng hợp trong Góc Phụ Huynh; việc thêm trang tiến độ dành riêng cho bé cần chốt sau.

## Khoảng trống chưa triển khai trong đợt này

- Đăng ký Google OAuth và ngôn ngữ đồng hành chọn nhiều (hiện model lưu một ngôn ngữ).
- Dashboard phụ huynh đầy đủ chặng hiện tại, tiến độ 5 chặng, hoạt động gần đây và điều hướng điểm thưởng. Công thức năng lực hiện tại vẫn là benchmark MVP, chưa phải đánh giá chuyên môn toàn khóa.
- CMS biên tập đủ activities/vocabulary, truyện và văn hóa; admin hiện chủ yếu chỉnh metadata bài học.
- Pagination toàn bộ lịch sử điểm (API hiện giới hạn 100 bản ghi), thanh toán subscription, chính sách hoàn quà ảo/đơn đã giao.
- Kiểm thử trình duyệt thật, mobile, accessibility và audio/media production; giảm bundle bằng lazy routes.

## Tiêu chí kiểm tra trước push

- API: nhiều request hủy một đơn chỉ có một refund; không mở lại đơn hủy; lỗi ghi ledger được bù và retry an toàn; stock delta không âm, không mất cập nhật.
- UI: reload phụ huynh tải hồ sơ; có empty/error/retry; lesson bị chặn khi hết giờ; gia hạn không bị timer cũ khóa lại; thiếu challenge không submit; city nhập được; thiếu audio không báo phát giả.
- Seed: preview không ghi; chạy lại không thay đổi tài khoản/ledger/stock/progress/nội dung; dữ liệu đúng schema và đáp án chấm được; báo xung đột định danh trước ghi.
- Chạy test toàn repo, typecheck, build và lint FE. Lint toàn repo đang thiếu script phía server; không báo toàn repo lint sạch.
