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
- Đối chiếu lại ngày 2026-10-09: tab Kho Truyện đã có văn bản cho cả 21 bài, một số kèm liên kết nguồn và dị bản. Seed hiện tại mới dùng tên tác phẩm và bài đọc minh họa; đây là phần triển khai chưa sử dụng dữ liệu đã được cung cấp, không phải khách hàng chưa gửi lời. Quyền sử dụng và file âm thanh là các thông tin riêng, không suy ra từ việc có văn bản.
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
- Dùng văn bản khách hàng đã gửi làm nguồn nhập CMS, giữ liên kết và nhãn tác giả/thể loại như nguồn. Chỉ yêu cầu làm rõ chỗ mâu thuẫn, dị bản cần chọn và quyền sử dụng/media chưa xác nhận; không yêu cầu gửi lại toàn bộ nội dung. Không xem liên kết bài viết là URL audio hoặc tự đặt thời gian karaoke.
- Giữ tiến độ tổng hợp trong Góc Phụ Huynh; việc thêm trang tiến độ dành riêng cho bé cần chốt sau.

## Đính chính nguồn nội dung khách hàng — 2026-10-09

Đã mở và xuất riêng ba tab nội dung từ tài liệu gốc. Xuất tab Cấu trúc toàn bộ web không bao gồm các tab còn lại; không dùng riêng bản xuất đó để kết luận khách hàng thiếu dữ liệu.

- [Khám phá](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit?tab=t.6aij8uhnuc6p): có 5 chặng, 20 bài, mục tiêu, từ vựng, câu mẫu, đáp án và mô tả hoạt động ở mức chi tiết khác nhau. Không phải chỉ có khung tên bài. Một số hoạt động vẫn là mô tả cần chuyển thành dữ liệu tương tác; ví dụ ôn tập 5 câu chưa liệt kê đủ câu và bài nghe truyện chưa có bản thu.
- [Kho Truyện](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit?tab=t.4844z8cb97b): có 21 mục với lời bên dưới, từ Trồng nụ trồng hoa đến Nhạc rừng; có liên kết nguồn ở một số bài, hai bản Lộn cầu vồng và hai đoạn Kéo cưa lừa xẻ. Không gộp dị bản âm thầm, không thay lời bằng đoạn minh họa tự viết. Nhãn Nhạc rừng/Thanh Lan/Thơ được giữ như thông tin nguồn, chưa phải xác minh độc lập về tác giả hay thể loại.
- [Khám Phá Văn Hóa](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit?tab=t.7s9fq5a2a7uw): có 8 nhóm, ví dụ card, bố cục chi tiết và câu hỏi/đáp án về bánh chưng; chưa có toàn văn từng bài và 3–4 thông tin thú vị cho mọi chủ đề.
- Chưa thấy file/URL audio trực tiếp hoặc mốc đồng bộ lời trong ba tab đã kiểm tra. Các dòng “Audio” ở giáo án mô tả lời cần phát, không phải file âm thanh đã được giao. Không kết luận về các tài sản có thể được gửi ngoài tài liệu này.

**Yêu cầu người dùng:** hoàn thiện CMS với dữ liệu khách hàng đã cung cấp, không chỉ tạo editor trống hoặc dùng lại toàn bộ dữ liệu mẫu. **Đề xuất kỹ thuật:** nhập có nguồn vào draft, đối soát ID hiện hữu và xuất bản qua cơ chế phiên bản; xem thiết kế CMS. Đây là phạm vi tiếp theo, chưa có import hoặc thay đổi database trong lượt đính chính này.

## Khoảng trống chưa triển khai trong đợt này

- Đăng ký Google OAuth và ngôn ngữ đồng hành chọn nhiều (hiện model lưu một ngôn ngữ).
- Dashboard phụ huynh đã bổ sung chặng hiện tại, tiến độ theo catalog (5 chặng ở seed chuẩn), 10 ghi nhận gần nhất và điều hướng kho điểm ngày 2026-10-09. Công thức năng lực hiện tại vẫn là benchmark MVP, chưa phải đánh giá chuyên môn toàn khóa. Nhật ký không lưu mọi lượt truy cập; lịch sử điểm đầy đủ vẫn là khoảng trống riêng.
- CMS biên tập đủ activities/vocabulary, truyện và văn hóa; admin hiện chủ yếu chỉnh metadata bài học.
- Pagination toàn bộ lịch sử điểm (API hiện giới hạn 100 bản ghi), chính sách hoàn quà ảo/đơn đã giao.
- Khi hợp nhất `origin/main`, giữ nguyên module thanh toán PayOS đã được phát triển độc lập. Code checkout/webhook đã có; kiểm thử giao dịch production vẫn cần cấu hình và người dùng xác nhận theo `03-feature-inventory.md`. Đợt này không tạo giao dịch thật.
- Kiểm thử trình duyệt thật, mobile, accessibility và audio/media production; giảm bundle bằng lazy routes.

## Tiêu chí kiểm tra trước push

- API: nhiều request hủy một đơn chỉ có một refund; không mở lại đơn hủy; lỗi ghi ledger được bù và retry an toàn; stock delta không âm, không mất cập nhật.
- UI: reload phụ huynh tải hồ sơ; có empty/error/retry; lesson bị chặn khi hết giờ; gia hạn không bị timer cũ khóa lại; thiếu challenge không submit; city nhập được; thiếu audio không báo phát giả.
- Seed: preview không ghi; chạy lại không thay đổi tài khoản/ledger/stock/progress/nội dung; dữ liệu đúng schema và đáp án chấm được; báo xung đột định danh trước ghi.
- Chạy test toàn repo, typecheck, build và lint FE. Lint toàn repo đang thiếu script phía server; không báo toàn repo lint sạch.

## Kết quả kiểm chứng sau hợp nhất — 2026-10-09

- `npm.cmd test`: backend 58/58, frontend 30/30; backend dùng MongoDB replica set tạm do test setup của nhánh remote tạo. Không gọi cổng thanh toán thật.
- `npm.cmd run typecheck` và `npm.cmd run build`: đạt. Bundle client khoảng 598 KB chưa nén, còn cảnh báo chunk lớn.
- `npm.cmd run lint -w client`: 0 lỗi, 123 warning. Chưa chạy nghiệm thu trình duyệt/mobile/accessibility.
- Cài dependency theo lockfile bằng `npm.cmd install --ignore-scripts` báo 17 advisory (5 moderate, 7 high, 5 critical). Chưa đánh giá khả năng khai thác từng advisory và chưa tự nâng dependency; cần đợt xử lý riêng.

## Smoke test trình duyệt local — 2026-10-09

- Môi trường: API cổng 5509, FE cổng 5179, database riêng `vietverse_browser_20261009`; PayOS và Cloudinary bị tắt. Dùng cùng hostname `localhost` ở FE/API khi kiểm tra refresh cookie. Không nạp dữ liệu hay gửi giao dịch lên production.
- Bé: đăng nhập mẫu, bản đồ hiển thị 4 bài ở chặng 1, mở bài đầu và đi qua word card/chọn đáp án/điền từ/xếp câu. Màn thu âm yêu cầu micro; không cấp quyền hoặc ghi âm trong lượt này. Chưa nghiệm thu hoàn thành trọn bài bằng browser.
- Phụ huynh: phát hiện và sửa reload mất Parent Gate, tái hiện lại sau sửa thì ở nguyên dashboard; lưu cấu hình 15 phút hiển thị thành công. Desktop 1366px hiển thị dashboard; mobile 390px kiểm tra bài học và điều hướng.
- Truyện: tìm kiếm Nhạc rừng mở đúng bài đọc mẫu, có nhãn chưa có âm thanh; nút phát, nghe lại và thanh tua bị khóa.
- Admin: đăng nhập chuyển đúng `/admin`; tổng quan hiển thị 20 bài/5 vật phẩm, đơn quà trống có thông báo; kho local tăng từ 0 lên 1 khi bấm `+1`; bảng có cuộn ngang ở 390px. Preview bài học không yêu cầu tạo hồ sơ bé.
- Phát hiện nhỏ chưa sửa trong lượt này: tab admin ghi cứng chặng 3–5 là “Khung” dù catalog mới đã có activities; nút đăng nhập demo còn nhãn 45 điểm trong khi seed mới bắt đầu 0 điểm. Không dùng các nhãn này để kết luận dữ liệu thật.
- Giới hạn: đây là smoke test tương tác, không phải bộ E2E tự động toàn bộ ứng dụng; chưa kiểm thử Safari/thiết bị thật, axe, media production, mua quà đủ điểm hay hủy đơn qua browser. Các trường hợp concurrency vẫn được kiểm tra qua API tests.
- Kiểm chứng sau sửa reload: backend 58/58, frontend 36/36; typecheck/build đạt; lint FE 0 lỗi/123 warning. Review độc lập không phát hiện regression cần xử lý trong diff vòng đời gate.

## Hoàn thiện dashboard phụ huynh — 2026-10-09

- Đã triển khai phương án được duyệt: chặng hiện tại là chặng đầu chưa hoàn thành, tiến độ từng chặng theo catalog thực, lý do khóa, 10 ghi nhận gần nhất phân biệt học/thu âm/khám phá, số dư và liên kết kho điểm. Giữ công thức năng lực, chính sách điểm và mở khóa.
- API chỉ đọc, giữ ownership và Parent Gate; không thay schema hoặc chạy migration. Client vẫn hiển thị các phần cũ nếu API chưa triển khai trường mới. Có trạng thái loading/error/retry/empty, khóa query theo hồ sơ bé để không render response cũ sau khi đổi bé.
- Test-first: 4 test API và 5 test UI mới thất bại khi chưa có tính năng; sau triển khai, toàn bộ backend 63/63 và frontend 41/41 đạt. `typecheck`/`build` đạt; lint FE 0 lỗi/120 warning. Bundle khoảng 603 KB; lint toàn repo vẫn thiếu script server.
- Browser local với MongoDB replica set tạm: đăng nhập demo, mở Parent Gate, kiểm tra dashboard tại 390×844 và 1366×900, không tràn ngang toàn trang trên mobile, reload giữ dashboard, link điểm mở đúng `/diem-thuong`. Dữ liệu gồm catalog mẫu, một progress đang học và một khám phá truyện; không ghi database thật hoặc thanh toán. Tiến trình và script QA tạm đã được dọn.
- Review độc lập không có finding cần sửa. Giới hạn còn lại: chưa nghiệm thu thiết bị thật/Safari/axe; lịch sử điểm đầy đủ, CMS, Google OAuth, nội dung/audio production và thanh toán thật vẫn là các hạng mục riêng.
- Rollback: revert thay đổi báo cáo/UI; vì không có mutation/schema mới, không cần rollback dữ liệu.
