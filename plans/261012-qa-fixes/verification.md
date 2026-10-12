# Kiểm chứng sửa lỗi QA - 2026-10-12

## Kết quả

- F01: bốn mục footer chưa có policy được duyệt ghi rõ `Chưa khả dụng`, không còn giả link.
- F02: tab chặng chỉ có một prefix, hỗ trợ cả title có/không prefix.
- F03: truyện không có audio ghi `Bản đọc`; có audio nhưng thiếu duration ghi `Có bản thu`; duration dương hữu hạn mới ghi số giây.
- O01: bỏ cam kết thử 7 ngày/trọn đời và 23 bài karaoke chưa xác nhận; không đổi giá/quyền hoặc checkout.
- Cloudinary: hỗ trợ lỗi SDK lồng `error.http_code` và dạng phẳng. Chỉ404 cho phép retry reupload; 401/403/429/500 trả503 an toàn, không xuất SDK request credentials.

## Bằng chứng tự động

- RED trước sửa: presentation 8 failed/2 passed; directAudioStorage 1 failed/25 passed.
- GREEN targeted: client presentation/pricing/directRecordingUpload/recordingSubmission 32/32; server directAudioStorage/recordingFinalize 40/40.
- `npm exec -w client -- vitest run --maxWorkers=1`: 26 files, **207/207 pass**.
- `npm test -w server`: 44 files, **398/398 pass**, dùng MongoMemoryReplSet cô lập và binary local8.2.3; cảnh báo khác requested7.0.24, không lỗi.
- `npm run typecheck`, `npm run build`: pass. Build JS712.09KB, cảnh báo chunk>500KB vẫn còn; chưa đo performance regression.
- `npm run lint -w client`: 0 errors/87 warnings, dưới ngưỡng200; nợ kỹ thuật có sẵn.

## Browser smoke

`browser-smoke.mts` chạy Vite từ client, Playwright Chrome headless, chặn mọi backend/external request. Cả1366x844 và390x844: footer/copy landing/pricing đúng, không overflow ngang ở footer, không pageerror. Screenshots `footer-1366.png`, `footer-390.png` đã lưu; ảnh mobile đã kiểm trực quan.

Lượt đầu harness dùng nhầm `/bang-gia` và cwd Tailwind sai; đã sửa thành route thật `/gia` và cwd client rồi chạy lại exit0. Đây là lỗi harness, không sửa router sản phẩm. Tài nguyên CDN/font/icon bị chặn nên ảnh không dùng làm nghiệm thu typography/icon. Map/story có component regression tests nhưng không có browser backend integration mới trong lượt này.

## Review và giới hạn

Simplifier theo gate ak:cook đã rà code/test, không chỉnh code; sửa thứ tự heading docs theo nhận xét. Diff không đổi payment logic, schema, quyền, điểm hay dữ liệu seed.

Cả bốn biến Cloudinary local còn thiếu/placeholder: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_RECORDING_UPLOAD_PRESET. Không gọi provider thật hoặc lấy credential từ nơi khác. Chưa nghiệm thu microphone giả/thiết bị thật, metadata audio và upload/finalize live. Owner cần môi trường staging có signed preset và credentials được duyệt; thực hiện gate ở `docs/vercel-deployment.md` trước rollout.

Không deploy, push, tạo giao dịch tiền thật, seed DB thật hoặc đổi network whitelist. Full suite có payment tests cô lập hiện hữu nhưng không sửa chúng và không gọi PayOS thật. CLI ak không có; file kế hoạch là trạng thái chuẩn, không tuyên bố sync index.

## Production follow-up

User yêu cầu tiếp tục tới production. Metadata Vercel xác nhận FE `vietverse` (root client), BE `vietverse-backend` (root server). `vercel env ls production` đúng project BE chỉ có GOOGLE_CLIENT_ID, MONGODB_URI, JWT_REFRESH_SECRET, JWT_SECRET, CLIENT_ORIGIN, CMS_PUBLISH_ENABLED và NODE_ENV; chưa có biến CLOUDINARY_* nào. Không đọc giá trị secret.

GET mới tới BE /health, /ready, FE / và FE /api/v1/stories đều200. Đây là availability check, không chứng minh recording. Chưa deploy code fix vì gate Cloudinary thật chưa đủ. Owner cần cấu hình Cloudinary qua secret store đúng project và xác nhận môi trường/account test; không gửi API secret trong chat. Không thay PayOS, env, alias, dữ liệu hoặc network access.
