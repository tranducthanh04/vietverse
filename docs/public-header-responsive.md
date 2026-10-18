# Public header responsive - 2026-10-18

## Phạm vi và nguyên nhân

- Sửa bố cục `client/src/app/layouts/PublicLayout.tsx`, dùng chung cho các trang công khai. Không sửa nội dung Khám phá, API, dữ liệu, quyền, điểm hoặc từ điển VI/EN.
- Trước sửa, khung header bị giới hạn 1280px nhưng từ breakpoint 1536px lại hiện slogan và tăng khoảng cách menu. Với font Be Vietnam Pro thật, hàng tiếng Việt cần 1457px; nút đăng ký vượt viewport 1536px. Bản tiếng Anh cũng vượt khung trong một số kích thước, dù chưa ra ngoài màn hình.
- Test còn tái hiện tràn ở 1280px tiếng Việt và một số kích thước mobile/tablet, đặc biệt khi có nút vào học của người đã đăng nhập.

## Quyết định kỹ thuật và giả định trình bày

- Header dùng chiều rộng tối đa 1536px; các khối nội dung trang vẫn giữ chiều rộng cũ. Giảm padding liên kết desktop dưới 1536px, không rút gọn nhãn hay cắt chữ.
- Slogan chỉ hiện ở các khoảng đủ chỗ: 1024-1279px và từ 1536px. Logo nhỏ hơn trên mobile; ẩn ngôi sao trang trí dưới 360px.
- Nút đăng nhập/đăng ký trên hàng chính hiện từ 768px. Nút vào học trên hàng chính hiện từ 640px. Dưới các mốc này, thao tác tương ứng vẫn có trong menu điều hướng.
- VI/EN luôn hiển thị, mỗi nút có vùng bấm ít nhất 44x44px. Giữ menu đầy đủ từ 1280px, header cố định cao 80px và khoảng chừa đầu trang hiện tại.
- Đây là các giả định bố cục theo nhãn VI/EN hiện có, không phải quyết định nghiệp vụ mới. Nhãn mới dài hơn cần chạy lại test responsive.

## Kiểm chứng và giới hạn

- Script hồi quy: `node plans/261018-public-header/browser-smoke.mjs`. Dùng PublicLayout, LoginPage, router, store, CSS Tailwind và font thật; fixture tài khoản giả, không đăng nhập hoặc ghi dữ liệu production.
- Trước sửa: test thất bại do tràn khung/nút ra ngoài viewport. Đo cả khung header và từng control vì header fixed có thể tràn mà `document.scrollWidth` không tăng.
- Test sau sửa kiểm tra khách/phụ huynh, VI/EN, các mốc 320-1920px và sát breakpoint: không tràn/chồng nút, năm liên kết điều hướng, nút tài khoản trong menu, đóng menu khi điều hướng, đổi ngôn ngữ bằng chuột/bàn phím và vùng chạm VI/EN.
- Kết quả trên nhánh PR độc lập từ `main@35c51ca`: 68/68 trường hợp trình duyệt, 304/304 test frontend, build (gồm TypeScript) và lint file sửa đều qua. Test `audioPlayback.test.tsx` còn cảnh báo `act()` có sẵn; không sửa audio trong PR này. Bản sửa cũng qua 325/325 test frontend trên thư mục chung có thay đổi đang làm của hai chat khác, nhưng các thay đổi đó không được đưa vào PR.
- Playwright và Chrome lấy từ môi trường hiện tại; có thể đặt `PLAYWRIGHT_MODULE`/`CHROME_PATH` để chạy ở máy khác. Google Fonts cần truy cập mạng; test xác nhận font đã tải, không âm thầm dùng font fallback.
- Chưa deploy, chưa nghiệm thu Safari/iOS/Android thật. Không coi fixture tài khoản là kiểm thử đăng nhập hoặc API.
