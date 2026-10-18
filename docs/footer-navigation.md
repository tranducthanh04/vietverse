# Footer navigation — 2026-10-18

## Nguồn và phạm vi

- Nguồn khách: [VIETVERSE WEBSITE, tab Footer](https://docs.google.com/document/d/1Bi_owABMnxrkFRoZQHoIPW0xu_UDPnWJLh2nbHY-VvM/edit?tab=t.5rc9r5kx642b), audit 5.10, completion plan bước 6.
- **Yêu cầu nghiệp vụ:** footer public có sáu mục: VietVerse là gì, Hành trình, Lộ trình học tập, Khóa học, Kho truyện, Khám phá văn hóa.
- **Phân công FOOTER-NAV:** chỉ bổ sung hai mục còn thiếu. Bốn mục cũ giữ cả nhãn và đích; không diễn giải lại nội dung khách đã chốt.
- **Giả định trình bày:** `Lộ trình học tập` là phần năm chặng hiện có trên Landing, không phải trang riêng hoặc nội dung khóa học mới. `Khóa học` dẫn tới trang gói học hiện có `/gia`.

## Hành vi

| Nhãn VI / EN | Đích |
| --- | --- |
| Lộ trình học tập / Learning roadmap | `/#lo-trinh-hoc-tap` |
| Khóa học / Courses | `/gia` |

- Actor: khách hoặc người đã đăng nhập; không có tiền điều kiện mới. Các route public vẫn không yêu cầu tài khoản.
- Liên kết lộ trình dùng hash ổn định, chuyển focus tới tiêu đề `h2` của phần năm chặng sau khi Landing mount. Xử lý cùng trang, khác trang, tải trực tiếp, reload, mount chậm, bấm lại cùng hash và Back/Forward.
- **Quyết định kỹ thuật:** hiệu ứng cục bộ Landing chỉ nhận đúng `#lo-trinh-hoc-tap`; `location.key` nhận biết lần điều hướng mới. Không thêm listener/observer toàn ứng dụng, không chuyển focus với hash lạ.
- Tiêu đề dùng `tabIndex=-1`, không thêm một điểm Tab thừa. `scroll-margin-top: 6rem` chừa khoảng trống trên header cố định 5rem; không thêm hiệu ứng cuộn động.
- Sáu link điều hướng giữ vùng bấm cao tối thiểu 44px và cho nhãn xuống dòng.
- Menu mobile đóng khi điều hướng, kể cả chỉ đổi hash hoặc bấm lại cùng đích, để không che tiêu đề lộ trình.
- Giữ nguyên email `vietverseallsatar@gmail.com`, số điện thoại, thông tin hỗ trợ và bốn dòng legal chưa khả dụng. Không tạo URL Facebook hoặc trang legal khi chưa có nguồn.
- Không đổi API, dữ liệu, store, route guards, ba CTA Landing, điểm, checkout hoặc audio. Không migration hay ghi production.

## Kiểm chứng và giới hạn

- `npm run test -w client -- src/test/footerNavigation.test.tsx`: 22 ca VI/EN; test được chạy đỏ trước thay đổi, gồm menu đang mở khi điều hướng hash mới/lặp lại. Dùng layout/trang/store/router thật; chỉ thay scroll API mà jsdom không có. Focus là DOM focus thật.
- `node plans/261018-footer-navigation/browser-smoke.mjs`: router production, PublicLayout/Landing/Pricing và CSS thật với guest local, không bootstrap API. Nhánh fixture riêng dùng Suspense để kiểm tra mount chậm có điều khiển.
- Chromium, VI/EN × 320/640/1366px: sáu link đúng đích, vùng bấm/nhãn không tràn hoặc chồng nhau; 36 lượt chuột và Tab/Enter tới hai đích. Kiểm tra direct/reload/repeat/Back/Forward/hash lạ/mount chậm, focus tiêu đề và không bị header che. Font Be Vietnam Pro tải thật.
- Chỉ kiểm chứng local, không phải nghiệm thu thiết bị thật hoặc deploy production. Không coi lỗi ghi âm F04 đã được sửa nếu test baseline tình cờ xanh.
- Kiểm tra Back/Forward chờ trang giá hiển thị trước khi quay lại. Một lượt trước đó timeout khi chỉ chờ URL đổi; reviewer ghi nhận URL có thể đổi trước khi Pricing mount. Không tái hiện timeout trong 15 lượt chẩn đoán, nên chưa xác định nguyên nhân timeout cũ; không sửa production dựa trên giả thuyết này hoặc tuyên bố đã kiểm chứng mọi lần hủy chuyển trang tức thì.
- Rollback: revert riêng thay đổi FOOTER-NAV; không ảnh hưởng dữ liệu hoặc quyền.
