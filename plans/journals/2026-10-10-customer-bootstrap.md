# Khởi tạo catalog mới — bằng chứng phiên thực hiện

## Quyền và phạm vi

Owner yêu cầu tự tạo dữ liệu mới từ Google Docs, sau đó cho phép biên soạn phần chưa đủ và tiếp tục thực hiện. Đây không phải phục hồi DB cũ. Catalog bổ sung riêng; không sửa snapshot checksum hoặc seed/import CMS hiện hữu. Quyết định vận hành ở `docs/cms-operations.md`; kế hoạch ở `plans/261010-customer-bootstrap/plan.md`.

## Kiểm chứng local

- Các test bảo vệ lời nguồn, validation, grader, đúng target URI, dry-run, hash-bound apply, catalog rỗng, không admin/CMS writer, transaction abort, giữ dữ liệu ngoài phạm vi, retry/conflict và giới hạn renderer.
- Test riêng 11/11 qua sau các regression RED → GREEN; typecheck/build exit 0. Full suite bản cuối qua 351/351 (37 files).
- Review độc lập xác nhận sửa renderer/receipt/launcher; phát hiện thêm JWT admin cũ có thể còn hợp lệ dù User admin rỗng. Đã bắt owner xác nhận cửa sổ không có admin token/writer ngoài luồng ở dialog riêng; không suy từ count là không còn token. Follow-up cuối không có Critical/Important mới, chấp nhận có điều kiện owner thực sự xác nhận và giữ cửa sổ độc quyền.
- AgentKit CLI không có; ghi bằng chứng trực tiếp, không tuyên bố chạy CLI hoặc đồng bộ plan index.

## Production

Launcher đã mở dialog riêng nhưng kết thúc `BOOTSTRAP_PASSWORD_CANCELLED_OR_FAILED`, exit 1; không có preflight hoặc receipt nạp DB. Mã này không phân biệt hủy/hết hạn/lỗi dialog, không suy ra nguyên nhân cụ thể. Launcher dừng trước khi gọi DB vì chưa nhận credential hợp lệ. Cần owner nhập lại mật khẩu ở dialog riêng và xác nhận cửa sổ độc quyền; không tự mở lại sau khi dialog đã kết thúc.

Lần tiếp tục sau yêu cầu “nạp đi”: poll session `72064` trả cùng mã `BOOTSTRAP_PASSWORD_CANCELLED_OR_FAILED`, exit 1, không có output preflight/verified. Vẫn chưa có bằng chứng nạp Production; không tự mở thêm dialog sau lần này. Cần owner yêu cầu mở lại và hoàn tất nhập mật khẩu DB qua dialog riêng, không gửi mật khẩu trong chat.

Fresh smoke trước apply: health/readiness200, BE/FE unknown API404, FE auth/me401, FE stories200/0 items. Không lấy lại secret Vercel hoặc URI `.env` cũ; không gọi seed/import/account/payment mutation thật trong phần bootstrap này.

Kiểm tra read-only ngày 2026-10-11: BE `/health` 200, `/ready` 200 nhưng `/api/v1/stories` trả `data: []`; FE proxy `/api/v1/stories` cũng trả `data: []`. Điều này xác nhận app và kết nối DB đang sống, nhưng catalog chưa được nạp; FE không phải nguyên nhân làm mất dữ liệu. Lần chạy apply trước bị dừng ở gate mật khẩu/xác nhận cửa sổ độc quyền trước preflight, nên không có ghi DB.

Lần thử tiếp ngày 2026-10-11: owner trả lời “xac nhan” cho điều kiện không có admin token/session hợp lệ và writer ngoài luồng sau khi được thông báo rủi ro. Launcher `--apply` đã được phép chạy, session `88273`, nhưng kết thúc `BOOTSTRAP_PASSWORD_CANCELLED_OR_FAILED`, exit 1, không có preflight/verified. Không biết từ mã này là hủy, hết hạn hay lỗi form; không coi đó là mật khẩu sai. Chưa gọi loader/ghi catalog. Không tự mở lại sau kết quả này; cần owner cho biết hộp thoại có hiển thị và có thể thao tác hay không.

Lần mở lại theo yêu cầu “mowr lai” ngày 2026-10-11 cũng kết thúc `BOOTSTRAP_PASSWORD_CANCELLED_OR_FAILED`, session `2533`, không có preflight/verified. Hộp thoại không nhận credential trong thời gian chờ; chưa gọi loader/ghi catalog. Cần xử lý khả năng cửa sổ không hiện trong desktop session trước khi thử lại; không coi đây là lỗi mật khẩu.

Chẩn đoán sau đó: đổi `windowsHide` sang false vẫn nhận mã lỗi chung sau khoảng 4 giây trong launcher, không có preflight. Probe không hiển thị form dựng thành công (`FORM_BUILD_OK`); probe môi trường trả UserInteractive=true, SessionId=8, STA. Một probe Node riêng với timeout chủ động 10 giây trả ETIMEDOUT, stdoutLength=0, stderr rỗng. Các bằng chứng này KHÔNG chứng minh `windowsHide` làm đổi/ẩn desktop session, cũng không chứng minh lỗi nằm ở MongoDB. Nhận định root cause trước đó trong commentary chưa đủ bằng chứng; đã bỏ thay đổi/comment suy đoán và khôi phục launcher. Không tiếp tục retry tự động hoặc bỏ gate; cần thử launcher từ terminal desktop do owner trực tiếp điều khiển hoặc xác nhận kiến trúc nhập credential khác trước khi sửa thêm.

## Giới hạn

Chưa có audio thu âm; không giả hoặc bypass Cloudinary. Nội dung bổ sung cần content owner rà soát, quyền nguồn/attribution chưa xác minh độc lập. Atlas mới có mạng tạm sáu giờ; không tự gia hạn/mở vĩnh viễn. Không nghiệm thu auth thực, gói trả phí hoặc PayOS. Chưa commit/push trong phần bootstrap.
