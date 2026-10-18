# Lưu giới hạn thời gian - xử lý lỗi 2026-10-18

## Phạm vi

Sửa phần Error state của audit khách hàng (F12, mục 6): `ParentSettingsPage.handleSave` trước đây chỉ có `try/finally`, không có thông báo lỗi hoặc xử lý promise bị từ chối. Phản hồi PATCH chậm còn có thể gọi `selectChild` cho bé cũ sau khi phụ huynh đã đổi hồ sơ.

## Quyết định kỹ thuật

- Giữ nghiệp vụ hiện có: 15/20/30 phút hoặc 0 là không giới hạn; PATCH `/parent/screen-time` qua API client có Parent Gate, sau đó `selectChild` để tải hồ sơ đã cập nhật. Không đổi server, API, quyền, điểm, thanh toán hoặc shared store/offline worker.
- Bắt lỗi cả PATCH và lần tải lại hồ sơ; hiển thị `role="alert"` theo ngôn ngữ VI/EN. Giữ lựa chọn để phụ huynh bấm lưu lại. Không hiển thị lỗi kỹ thuật thô từ exception.
- Thông báo ghi "Chưa xác nhận được việc lưu" vì PATCH có thể đã thành công nhưng lần tải lại thất bại, hoặc mạng mất sau khi server xử lý. Không hứa rằng request thất bại đồng nghĩa dữ liệu chưa thay đổi.
- Trong lúc lưu, khóa lựa chọn/nút lưu và dùng trạng thái loading hiện có. Chỉ hiển thị thành công bằng `role="status"` khi cả hai bước hoàn tất trong cùng ngữ cảnh hồ sơ/tài khoản. Bắt đầu lưu mới hoặc chỉnh lựa chọn thì bỏ thông báo cũ.
- Đổi bé/tài khoản làm mất hiệu lực callback đang chờ, xóa trạng thái cũ và lấy giới hạn của bé mới. Subscription cục bộ bắt cả chuỗi A -> B -> A trong một lần render. Không để `finally` của lượt cũ nhả loading của lượt mới.
- Unmount làm mất hiệu lực callback và dọn timer. PATCH đã gửi có thể vẫn được server xử lý cho bé ban đầu; không rollback hoặc tự phát sinh request chọn bé sau khi rời màn hình. Nếu request `selectChild` đã gửi trước lúc đổi bé/tài khoản, cơ chế selection version sẵn có của store tiếp tục bảo vệ active child.
- **Giả định trình bày:** trạng thái thành công tự ẩn sau 3 giây như trước. Lỗi không tự ẩn theo timer; biến mất khi thử lưu lại, sửa lựa chọn hoặc đổi ngữ cảnh.

## Kiểm chứng local

- Nhánh độc lập từ `main@35c51ca`, không chứa header của PR #11 hoặc thay đổi của các chat khác.
- Test mới `client/src/test/parentSettingsSave.test.tsx`: trước sửa 11/12 ca thất bại và 5 unhandled rejections; sau sửa 12/12 qua, bổ sung 4 ca giữ nguyên các mức phút và request hai bé chồng nhau, tổng 16/16 qua.
- Test dùng component/router/store/API interceptors thật, thay adapter mạng bằng response có kiểm soát. Bao phủ VI/EN, lỗi mạng, Parent Gate hết hạn, refresh lỗi, retry, giá trị 0, loading, đổi bé/tài khoản, unmount và phản hồi muộn. Không gọi API production.
- Toàn bộ frontend 320/320 test qua; build gồm TypeScript qua. Lint các file thay đổi không có lỗi; còn warning thiếu dependency `t` trong effect thanh toán có sẵn, ngoài phạm vi này. Test audioPlayback còn warning `act()` có sẵn.
- Browser smoke `node plans/261018-parent-settings-save/browser-smoke.mjs`: ParentLayout/route/cài đặt/CSS thật, fixture tài khoản và API. Bốn ca VI/EN ở 390/1280px qua: lỗi 503 có alert không tràn, giữ giá trị 0, Enter thử lại thành công, không có unhandled browser error. Không phải đăng nhập hoặc API production.
- Review độc lập code/component tests không có finding chặn; ghi nhận chưa có assertion timer giả cho thời hạn thông báo, hoặc ca riêng đổi tài khoản/unmount sau khi request refresh đã bắt đầu. Cơ chế invalidation/store đã được đọc và kiểm tra trong phạm vi hiện có, không suy ra nghiệm thu ngoài phạm vi.
- Chưa deploy hoặc nghiệm thu tài khoản/thiết bị thật. Test client không chứng minh rollback hay hủy một mutation mà server đã nhận.
