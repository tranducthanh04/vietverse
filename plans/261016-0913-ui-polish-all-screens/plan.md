# Plan — Rà và chỉnh UI toàn bộ màn Vietverse

- Ngày: 2026-10-16
- Phạm vi: chỉ giao diện client (layout, kiểu dáng, khả năng truy cập). Không đổi API, quyền, quy tắc điểm hay dữ liệu.
- Môi trường test: local, DB riêng `vietverse_uiqa` (seed + `--demo-users`), API :5055, web :5173.
- Kích thước kiểm: desktop 1366px và mobile 390px.
- Công cụ: Playwright (Chrome hệ thống). `crawl.mjs` đi theo route; `states.mjs` chặn API để dựng trạng thái bên trong màn (từng dạng hoạt động, popup, CMS biên tập).

## Cách đánh dấu

- **Đã sửa (đợt 1)**: sửa ngày 2026-10-15, đã kiểm lại bằng ảnh chụp.
- **Sửa đợt 2**: lỗi phát hiện ngày 2026-10-16, sửa trong plan này.
- **Ổn**: đã xem ảnh cả hai kích thước, không cần sửa.
- **Chưa chụp được**: kèm lý do và cách kiểm thay thế.

## 1. Khách (public)

| Màn | Route / trạng thái | Kết quả |
| --- | --- | --- |
| Trang chủ | `/` | Ổn |
| Bảng giá | `/gia` | Đã sửa (đợt 1): nhãn "yêu thích nhất" gãy dòng, dòng tiết kiệm dính giá, thẻ lệch hàng |
| Đăng nhập | `/dang-nhap`, sai mật khẩu | Ổn (thông báo lỗi hiển thị trong thẻ) |
| Đăng ký | `/dang-ky`, gửi form trống | Ổn (dùng validation của trình duyệt) |
| Kho truyện | `/kho-truyen` | Đã sửa (đợt 1): thẻ mobile dạng ngang; thẻ là link thật |
| Chi tiết truyện | `/kho-truyen/:id` | Đã sửa (đợt 1): khung đọc trống lớn (lỗi user báo) |
| Văn hoá | `/van-hoa` | Đã sửa (đợt 1): như kho truyện |
| Chi tiết văn hoá + quiz | `/van-hoa/:id` | Đã sửa (đợt 1): đáp án quiz không có viền; đã kiểm trạng thái chọn đáp án |
| 404 | `/bat-ky` | Đã sửa (đợt 1): chữ nút tối trên nền đỏ (lỗi `cn`) |
| Kết quả thanh toán | `/thanh-toan` | Đã sửa (đợt 2): căn giữa, thêm logo và mascot, nút đồng bộ |

## 2. Bé

| Màn | Route / trạng thái | Kết quả |
| --- | --- | --- |
| Header khu bé | mọi trang bé | Đã sửa (đợt 2): tên bé cắt gọn, mobile hiện "Phụ huynh", không gãy dòng kể cả 3 chữ số điểm |
| Menu chọn bé | bấm tên bé | Ổn |
| Onboarding bước 1–3 | `/bat-dau` | Bước 1 đã sửa (đợt 1): placeholder bị cắt. Bước 2 đã sửa (đợt 2): ẩn nhãn trang trí trên mobile, nút "Quay lại" không gãy dòng |
| Onboarding bước 4 | sau "Hoàn tất thiết lập" | Không chụp (bước này tạo hồ sơ bé); kiểm bằng đọc code: dùng cỡ chữ responsive, không có chiều rộng cố định |
| Bản đồ | `/kham-pha` | Ổn |
| Đổi quà | `/diem-thuong` | Đã sửa (đợt 1): ngôi sao đen (seed), chữ "bé Bé" lặp |
| Đổi quà khi đủ điểm, popup đổi | `/diem-thuong` | Đã sửa (đợt 2): tiêu đề popup quá to, gãy 3 dòng trên mobile (sửa ở `Modal` dùng chung) |
| Phòng báu vật | `/phong-bau-vat` | Ổn |
| Popup Parent Gate | nút Góc Phụ Huynh | Ổn |
| Popup hết giờ dùng màn hình | ScreenTimeGuard | Không chụp (cần chờ hết giờ thật); kiểm bằng đọc code: nút xếp dọc trên mobile, cỡ chữ responsive |

## 3. Màn học bài (`/hoc/:id`)

| Dạng / trạng thái | Kết quả |
| --- | --- |
| Khung màn (header, footer, thanh báo) | Đã sửa (đợt 1) |
| `word_card` | Đã sửa (đợt 1): chữ khổng lồ tràn khung |
| `listen_choose` | Đã sửa (đợt 1): đáp án chữ dạng hàng A/B/C |
| `listen_choose` đã trả lời | Ổn |
| `drag_match` | Đã sửa (đợt 2): ô cao theo nội dung, tiêu đề cột ngắn gọn |
| `fill_blank` | Đã sửa (đợt 2): thẻ câu xuống dòng, hết tràn ngang |
| `sort_order` | Đã sửa (đợt 2): thẻ và ô thả rộng theo chữ |
| `record_voice` | Đã sửa (đợt 2): cỡ chữ co theo độ dài (dùng chung `targetTextSize` với thẻ từ) |
| `review` | Ổn |
| `multi_select`, `group_sort` | Đã sửa (đợt 2) cùng nhóm dạng mới. Hai lần chụp đầu ra trang đăng nhập là do script dùng chung phiên, không phải lỗi app |
| `fill_blanks`, `follow_steps` | Đã sửa (đợt 2): tiêu đề căn giữa, thẻ viền dày, nút gửi đỏ đặc, trạng thái chọn rõ |
| Popup hoàn thành (đạt / chưa đạt) | Đã sửa (đợt 2): mascot nằm trọn trong popup |

## 4. Phụ huynh (`/phu-huynh`)

| Màn | Kết quả |
| --- | --- |
| Header | Đã sửa (đợt 1): gãy dòng trên mobile |
| Tiến độ 4 năng lực | Ổn |
| Bản thu âm | Ổn |
| Cài đặt thời gian | Ổn |
| Test thanh toán | Ổn |

## 5. Admin (`/admin`)

| Màn | Kết quả |
| --- | --- |
| Header + menu | Đã sửa (đợt 1): gãy dòng trên mobile |
| Bảng số liệu, Doanh thu, Học viên, Chi tiết học viên, Quy tắc điểm, Test thanh toán | Ổn |
| Đổi quà — đơn | Ổn |
| Đổi quà — kho vật phẩm | Đã sửa (đợt 2): bảng cuộn ngang với cột tên đủ rộng, nút không gãy dòng |
| CMS danh sách bài học / truyện / văn hoá | Đã sửa (đợt 1): restyle `content.css`, nhãn trạng thái |
| CMS biên tập (cả 3 loại) | Đã sửa (đợt 1 + 2): thanh thao tác chỉ dính từ tablet trở lên |
| CMS xem trước truyện / văn hoá | Đã sửa (đợt 2): chỉ hiện khung ghi chú khi có nội dung |
| CMS xem trước bài học | Ổn |

## Lỗi dùng chung đã sửa (đợt 1)

- `client/src/lib/utils.ts`: `tailwind-merge` coi `text-kid-*` là màu chữ nên xoá `text-white`, khiến mọi nút `size="kid"` hiện chữ tối trên nền đỏ. Đã khai báo các cỡ chữ tuỳ biến.

## Kết quả kiểm chứng (2026-10-16)

- Crawl 32 màn × 2 kích thước: không lỗi JS, không tràn ngang; qua Parent Gate.
- `states.mjs`: 70 ảnh trạng thái, không tràn ngang.
- Client: typecheck qua, 232/232 test qua, lint 0 lỗi (103 cảnh báo, không tăng).
- Server: 489/489 test qua (chạy 2026-10-15 sau thay đổi seed duy nhất).

## Thứ tự sửa đợt 2 (đã hoàn thành)

1. P1 — màn học bài: `drag_match`, `fill_blank`, `sort_order`, `record_voice`; header khu bé.
2. P2 — bốn dạng hoạt động mới; onboarding bước 2; kho vật phẩm admin; thanh thao tác CMS trên mobile; khung xem trước rỗng.
3. P3 — popup hoàn thành; trang kết quả thanh toán.
4. Chụp lại toàn bộ (`crawl.mjs` + `states.mjs`), xem lại từng màn trong bảng trên, cập nhật cột kết quả.
5. Typecheck, test client/server, lint.

## Ngoài phạm vi / cần người quyết

- Vật phẩm đã có trong DB production vẫn hiện ngôi sao đen; seed chỉ thêm mới nên không tự sửa. Cập nhật ảnh trên production là sửa dữ liệu thật, cần chủ sản phẩm đồng ý và sao lưu trước.
- CMS hiện "Sửa bởi" bằng ID người dùng thay vì tên; muốn hiện tên cần API trả thêm tên người sửa (thay đổi API, ngoài phạm vi UI).
- Ghi chú biên tập trong dữ liệu mẫu là tiếng Anh ("Legacy text answer…"); đây là dữ liệu, không phải UI.
