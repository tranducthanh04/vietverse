# 08 — Đối chiếu yêu cầu khách hàng và phạm vi sửa ngày 2026-10-08

## Bốn hoạt động mới — nghiệm thu local 2026-10-09

Quyết định đã duyệt: thêm `multi_select`, `group_sort`, `fill_blanks`, `follow_steps` xuyên server/player/session/CMS/catalog; giữ bảy loại cũ và policy điểm/quyền/version. Spec/plan ở `superpowers/`. Chưa import DB thật, publish hoặc tạo audio/ngữ liệu ngoài nguồn.

- Full backend 244/244 (24 suites), frontend cuối 122/122 (17 suites). Hai phía typecheck/build đạt; lint frontend 0 lỗi/102 warning (baseline trước feature 101). Bundle JS 648,08 KB, gzip 191,99 KB; còn warning chunk >500 KB và React Router v7. Không giảm assertion/ngưỡng lint để che lỗi.
- Chrome headless local: 1366x844 và 390x844 với touch context; repeated-M bằng bàn phím, chọn đủ ba ID; nhóm nhiều-về-một và sửa lại nhóm; input cả hai slot giữ dấu câu; steps đủ bước/tự báo cáo; CMS đổi type mở native modal, Escape giữ loại cũ. Không tràn ngang, target tương tác mới ≥44px, không pageerror/console error. Đã nhìn screenshot mobile.
- IndexedDB thật trong Chrome: gõ hai input nhanh → đổi bé → cache bé cũ giữ lựa chọn mới nhất, bé mới trống → restore đúng input → clear xóa và không hồi sinh. Tích hợp unit/API còn bao phủ capability/neutral grading/storage failure/account/version/offline roundtrip/CAS/preview side effects/import skip.
- Browser tích hợp khởi động lỗi hai lần; fallback runtime Playwright có sẵn, không cài dependency. Harness đầu thiếu Tailwind do cwd, sửa riêng harness về client rồi chạy xanh; không sửa CSS sản phẩm để che failure. Fixture UI cô lập, chỉ loopback, không DB/payment/micro hoặc asset ngoài máy.
- Giới hạn rõ: chưa chứng nhận full-app E2E offline reconnect/complete kết quả đúng-sai/CAS/audio lỗi qua browser trong release mới; các nhánh này được integration tests kiểm tra, không gọi là browser đã nghiệm thu. Chưa Safari/thiết bị thật/axe/deploy/import/audio/bản quyền production.
- Review fresh-context: một Important mất queued input khi đổi phiên; bốn test chứng minh RED→GREEN, full suite xanh sau sửa. Không Critical/Minor; không dispatch lại reviewer. Thay đổi cuối được kiểm whitespace, deploy chỉ sau review và test.

### Các quyết định executor và chi phí nếu sai

Theo thứ tự ledger:

1. Dùng main hiện hữu, không worktree/dev merge, theo yêu cầu người dùng; rủi ro nhánh chung nên review trước push.
2. Tách test validator mới và helper contract chung để không trộn legacy; chi phí là thêm module cần duy trì.
3. Capability là đúng chuỗi `2`, không coercion `02`/array; client không chuẩn phải sửa query.
4. Projection nhận canonical `LessonContent`, không Record lỏng; caller phải cung cấp đúng kiểu.
5. Audio native thay AudioButton có fallback TTS không rõ nguồn; chi phí khác styling, không cung cấp TTS trong loại mới.
6. Frame media/error dùng chung, bốn tương tác riêng; đổi frame cần test cả bốn UI.
7. Shared option editor giữ ID/path ghi chú theo index; đổi path cần test editor.
8. Reviewer không đánh giá production DB/publish/assets: giữ ngoài phạm vi và chờ deploy/content owner, không suy nghiệm thu từ test local; nếu sai về readiness phải trì hoãn publish.
9. Reviewer không chứng nhận Safari/device/axe/full-app browser flows: chỉ ghi đúng smoke đã chạy, còn lại gate QA triển khai; nếu thiết bị thật khác phải sửa trước phát hành.
10. Reviewer để legacy answer exposure/media ngoài phạm vi: giữ compatibility theo spec, chưa gọi là hardening toàn bộ; chi phí là nợ legacy cần đợt riêng.
11. Reviewer để Task7 checklist cho executor: cập nhật theo evidence, không dùng trạng thái kế hoạch làm bằng chứng deploy; nếu sai cần sửa biên bản/checklist.

Không có Minor hoãn lại từ final review. Báo cáo này giữ rulings bền vững; scratch của riêng plan được dọn sau khi commit, không đụng `.superpowers/qa` khác.

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

### Bộ nguồn CMS đã chuẩn bị — 2026-10-09

- Snapshot ba tab và SHA-256 nằm tại `customer-source/2026-10-09/manifest.json`; [báo cáo đối soát](./customer-source/2026-10-09/coverage.md) liệt kê từng mục: 20 giáo án, 21 bài đọc, tám nhóm văn hóa. Nội dung thiếu hoặc thao tác chưa hỗ trợ được ghi chú, không coi là bài hoàn chỉnh.
- `npm run cms:import-customer -w server -- --dry-run` chỉ đọc, trả kế hoạch create/skip/conflict và coverage. `--apply --admin-id=<id>` yêu cầu admin có thật và MongoDB transaction; nhập toàn bộ vào draft cùng nguồn/ghi chú, không sửa live, tài khoản hay dữ liệu học. Chưa chạy trên production.
- Quyết định: giữ stable seedKey nội bộ cả draft-only để xuất bản rồi đổi tên không bị seed tạo lại bản trùng. Chạy lại cùng checksum bỏ qua bản đã nhập kể cả đã sửa tay, xuất bản hoặc bỏ nháp; nguồn khác/conflict phải được đối soát riêng.
- Giả định lựa chọn dị bản và các ánh xạ renderer được ghi ở từng entry; bản quyền/audio và các khoảng trống của giáo án vẫn cần người biên tập xác nhận trước xuất bản.

- Đăng ký Google OAuth và ngôn ngữ đồng hành chọn nhiều (hiện model lưu một ngôn ngữ).
- Dashboard phụ huynh đã bổ sung chặng hiện tại, tiến độ theo catalog (5 chặng ở seed chuẩn), 10 ghi nhận gần nhất và điều hướng kho điểm ngày 2026-10-09. Công thức năng lực hiện tại vẫn là benchmark MVP, chưa phải đánh giá chuyên môn toàn khóa. Nhật ký không lưu mọi lượt truy cập; lịch sử điểm đầy đủ vẫn là khoảng trống riêng.
- CMS đủ form activities/vocabulary/truyện/văn hóa và preview đã triển khai local 2026-10-09; phần còn lại là xác nhận database đích, import/biên tập/xuất bản production và renderer mới cho các yêu cầu nguồn chưa hỗ trợ.
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

## CMS và dữ liệu khách hàng — nghiệm thu local 2026-10-09

- Admin có danh sách/tìm kiếm/lọc/phân trang, draft version/CAS, form cho cả ba nhóm, từ vựng/bảy activity, lyrics/timestamp/quiz/media và preview bản đã lưu. Lưu không publish; lỗi mạng/conflict giữ form, form bẩn cảnh báo khi rời trang, publish có xác nhận.
- Bộ nhập thực sự tạo 49 draft trong database QA tạm từ snapshot/checksum: 20 giáo án, 21 bài đọc và tám nhóm văn hóa. Test đối chiếu lời thực tế và dị bản, không chỉ kiểm số lượng. Không nạp dữ liệu production; không coi các trường còn thiếu/hoạt động chưa hỗ trợ là đã hoàn thiện.
- Browser: Chrome headless có sẵn, 1366x900 và 390x844, FE/API loopback với MongoMemoryReplSet riêng. Công cụ browser tích hợp bị lỗi khởi động sandbox; dùng runtime Playwright sẵn có, không cài dependency. PayOS/Cloudinary tắt, chặn request ngoài loopback, không cấp micro.
- Đã kiểm tra lời Rồng rắn thực tế trong editor/preview; bảy loại activity preview không tràn ngang toàn trang; publish rồi reload bé vẫn thấy phiên bản cũ; hai editor cùng bản tạo 409 và giữ chữ local; publish/ẩn truyện chặn GET public; văn hóa list/editor và lỗi audio có trạng thái đúng. Dashboard phụ huynh mở qua Parent Gate thật và reload giữ nguyên; không ghi database thật hay thanh toán.
- Không có pageerror trong lượt smoke hoàn tất. Console có 401 lúc bootstrap trước refresh token và lỗi tài nguyên ngoài loopback do QA chủ động chặn; không coi đây là lỗi app mới. Selector textarea phải lấy theo accessible textbox name vì Playwright getByLabel exact tính cả text con; đã kiểm tra riêng accessibility tree, không sửa label vô căn cứ.
- Rủi ro compatibility được kiểm tra: catalog cũ có bài order28 và audio HTTP vẫn đọc được; whitelist không trả CMS nội bộ. Draft/publish mới giữ chính sách media an toàn, stage/order vẫn bất biến.
- Giới hạn: chưa Safari/thiết bị thật/axe, media/bản quyền production, import database thật. Chi tiết bật cờ và rollback ở [CMS operations](./cms-operations.md).
- Kiểm chứng trước review độc lập: backend 167/167, frontend 84/84; typecheck/build đạt; lint FE 0 lỗi/101 warning tồn tại, git diff --check đạt. Bundle client 626,56 KB (gzip 186,26 KB), còn cảnh báo chunk >500 KB; React Router còn warning tương thích v7.
- Review độc lập và lượt sửa cuối: đã khắc phục seed trùng định danh nháp khách hàng và câu điền khuyết mất vế sau với marker dài. Test hồi quy đều chứng minh lỗi trước sửa, qua sau sửa. Kiểm chứng lại toàn repo: backend 171/171 (21 suites), frontend 87/87 (16 suites); typecheck/build đạt, lint FE 0 lỗi/101 warning, kiểm tra whitespace toàn diff so với origin/main đạt. Bundle 626,57 KB (gzip 186,27 KB), cảnh báo chunk/v7 vẫn còn.
- Browser smoke chạy lại sau sửa đạt toàn bộ các luồng CMS/bé/phụ huynh đã nêu, không có pageerror; database vẫn chỉ là replica set tạm. Chưa xác nhận deploy hoặc nhập dữ liệu thật. Ghi chú nguồn cạnh từng field và focus trap/Escape đầy đủ cho dialog là follow-up nhỏ; không chặn biên tập/lưu/publish hiện tại. Các quyết định và chi phí nếu giả định sai được lưu tại [bàn giao CMS](./superpowers/plans/2026-10-09-cms-completion.md).

## Hoàn thiện UX CMS sau bàn giao — 2026-10-09

- Theo yêu cầu tiếp tục, đã đóng hai follow-up trên: ghi chú nguồn cạnh field/nhóm tương ứng (kể cả mảng trống), accessible description cho text/number và select đáp án legacy; vẫn giữ tổng hợp toàn bộ ghi chú. Không sửa source, payload, điểm, quyền hoặc API.
- Dialog xác nhận và rời trang dùng native modal: nền inert, focus vào hủy/ở lại, Tab/Shift+Tab trong các nút dùng được, Escape hủy không gửi mutation, đóng trả focus về nút mở còn khả dụng. Giả định hỗ trợ: trình duyệt hiện đại có HTMLDialogElement.showModal; Safari/thiết bị thật/axe chưa nghiệm thu.
- Test-first: ba test keyboard/ghi chú và một test ghi chú chuyển đổi đáp án legacy thất bại trước sửa, qua sau sửa; bổ sung test văn hóa/media. Backend 171/171 không đổi; frontend 92/92, typecheck/build đạt; lint FE 0 lỗi/101 warning hiện hữu. Bundle 628,49 KB (gzip 186,93 KB), còn cảnh báo chunk lớn và React Router v7.
- Chrome thật headless, desktop 1366px và mobile 390px: xác nhận `:modal`, thử focus nền không thoát dialog, vòng Tab, Escape và focus về opener; note nối aria-describedby đúng, rời trang/Escape giữ chữ local, không có mutation hoặc pageerror. API dùng fixture local, không truy cập database/payment/asset ngoài loopback; đây là kiểm chứng UI, không chứng nhận nghiệp vụ production.
- Review độc lập không có Critical/Important; góp ý nhỏ về ghi chú legacy-answer select đã được xử lý bằng test hồi quy. Không có thay đổi production import hoặc bật publish trong lượt này.
