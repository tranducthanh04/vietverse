# NAV-POINTS-LINK - 2026-10-18

## Phạm vi và quyết định

- Nguồn: điều phối PR giao audit mục 5.2 / plan hoàn thiện khách hàng bước 6. Worktree/nhánh riêng từ `origin/main@0b8dd3c`; không sửa PR #14 hoặc workspace chung.
- Nguyên nhân: số dư trong `KidsLayout` là `div`. Yêu cầu đã giao: chính pill phải mở Điểm thưởng. Chỉ đổi pill thành `Link` tới `/diem-thuong` và bổ sung một key accessible name cho mỗi ngôn ngữ. Không thay child-picker, nav khác, quyền, Parent Gate, screen time, API, store, sổ điểm hoặc số dư.
- Quyết định kỹ thuật/giả định trình bày được ghi tại `docs/03-feature-inventory.md`. Tái dùng định dạng số và focus-visible toàn cục, không thêm handler bàn phím thủ công.

## Bằng chứng

- RED: cả 5 test mới thất bại vì không tìm thấy liên kết trong header (không nhầm link Đổi quà ở bottom navigation).
- GREEN: 5/5 test mới qua; 43/43 test layout/i18n/child journey/focus liên quan qua. Có số 0, số 1.234.567.890 / 1,234,567,890, đổi bé và đổi ngôn ngữ; click đến đích và không thay số dư.
- `npm test -w client`: 309/309 test, 36 file qua trên baseline độc lập; không gồm 16 test F12 đang nằm trong PR #14. Warning `act()` có sẵn ở `audioPlayback.test.tsx` vẫn còn.
- Trước bàn giao đã merge `main@c7519c0` (PR #13 offline), không conflict, source NAV giữ nguyên. Chạy lại full client 319/319 test, 37 file và TypeScript/Vite build đều qua. Chỉ 8 file NAV khác main.
- `npm run build -w client`: TypeScript và Vite qua. ESLint cho layout/test/hai từ điển: 0 lỗi, 0 warning. `git diff --check` qua.
- `node plans/261018-kids-points-link/browser-smoke.mjs`: 16/16 ca (VI/EN x 320/390/640/1366px x 0/1234567890) qua. Layout, font/CSS, ProtectedRoute, ChildSessionGuard và PointsShopPage thật với API GET fixture cục bộ. Kiểm tra không tràn/chồng control, >=44px, VI/EN và Parent Corner còn hiện, Tab/Enter có viền focus và click đều tới Điểm thưởng. Không có lỗi runtime hoặc API mutation bất ngờ. Script hỗ trợ `PLAYWRIGHT_MODULE`/`CHROME_PATH` để thay đường dẫn runtime.
- Ảnh local trong thư mục tạm `vietverse-kids-points-fCyUCD`, đã xem ảnh tiếng Việt 320px; không upload công khai. Chạy script để tạo lại ảnh.
- Gia cố browser assertion sau góp ý đóng gói: bắt buộc `document.fonts.load` trả FontFace đã loaded, không chỉ dùng `fonts.check` có thể chấp nhận fallback. Chạy lại sau đồng bộ main vẫn 16/16 qua, ảnh mới `vietverse-kids-points-VDTowt`.
- Reviewer độc lập `review_kids_points` không có finding cần sửa, tự chạy lại 5/5 test; review chỉ đọc. Main triển khai/test/docs; git-manager chỉ đóng gói commit/push/PR.

## Giới hạn và bàn giao

- Không thay đổi nghiệp vụ hoặc mở rộng task; không phụ thuộc source PR #12/#13/#14. Không đóng các yêu cầu header khác trong audit.
- Chưa nghiệm thu iOS/Safari/Android thật hoặc screen reader; fixture không chứng minh auth/DB production. Không chạy lại backend cho thay đổi chỉ client. Không sửa vấn đề bố cục trang Điểm thưởng ngoài header.
- Không có CLI `ak` trên máy: ghi journal bằng file; không đổi trạng thái/index của plan chung. AgentWiki publish skipped.
- Rollback chỉ cần revert link/key nhãn; không migration hoặc khôi phục dữ liệu. Chờ review và CI từ điều phối trước merge; không self-merge, auto-merge hoặc deploy thủ công.
