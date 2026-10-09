---
title: Sửa lag production và hoàn thiện trang ViVi Points theo tài liệu khách hàng
status: in progress — Pha 3, 4, 5 đang làm; Pha 1, 2 (deploy/hiệu năng) TẠM HOÃN theo yêu cầu 2026-10-09 (ưu tiên tính năng trước); D3 áp dụng đề xuất mặc định; D4 còn chờ
created: 2026-10-09
branch: main (tạo nhánh feature trước khi code)
sources:
  - Tài liệu khách hàng: Google Doc "ViVi Points" (tab t.78541832u3l9) — 3 mục: số dư, lịch sử, vật phẩm
  - docs/02-business-rules.md §4 ViVi Points
  - docs/06-review-findings.md (P2-FE.2: code-splitting còn tồn)
---

# Mục tiêu

1. Trang chạy nhanh trên Vercel + Render: không còn chờ 30–60 giây khi mở lần đầu, F5 không bị chặn bởi 3 request nối tiếp, bundle đầu < 300KB (mục tiêu đã ghi trong `docs/06-review-findings.md`).
2. Trang `/diem-thuong` khớp đủ 3 mục trong tài liệu khách hàng: số dư, lịch sử cộng/trừ đầy đủ, vật phẩm đổi thưởng theo loại (huy hiệu, avatar, trang trí hồ sơ, vật phẩm sưu tầm).

Ký hiệu: **[QĐ]** là quyết định nghiệp vụ đã có trong docs; **[GĐ]** là giả định/đề xuất của plan, cần chốt ở mục "Quyết định cần chốt".

# Tổng quan pha

| Pha | Nội dung | Phụ thuộc | Cần quyết định |
|---|---|---|---|
| 1 | Hạ tầng và server: cold start, region DB, nén response, rate limit sau proxy | — | Có (chi phí Render) |
| 2 | Client: khởi động auth, chia nhỏ bundle, font, ảnh | — | Không |
| 3 | Trang điểm: sửa hiển thị (không đổi nghiệp vụ) | — | Không |
| 4 | Loại vật phẩm và dùng avatar/trang trí | 3 | D5 |
| 5 | Quy tắc điểm mới: hoạt động, thử thách, cấu hình, sử dụng phần thưởng | 3 | D1–D4 |
| 6 | Tài liệu, test, rollout | 1–5 | — |

Pha 1, 2, 3 làm song song được và không cần chờ khách hàng.

---

# Pha 1 — Hạ tầng và server

**Vấn đề:** Render gói free ngủ sau ~15 phút; request đi Vercel → Render (Singapore) → MongoDB; server không nén; `trust proxy = 1` trong khi có 2 lớp proxy nên rate limiter nhiều khả năng đếm theo IP của Vercel.

Việc cần làm:

1. **Cold start** (theo D0 đã chốt): giữ Render free; thêm `.github/workflows/keep-warm.yml` chạy cron `*/10 * * * *` gọi `curl -fsS https://vietverse.onrender.com/health` (có retry). Lưu ý: GitHub cron có thể trễ vài phút, nên giữ thêm phương án dự phòng UptimeRobot nếu thấy server vẫn ngủ.
2. **Region DB** (cấu hình): kiểm tra region cluster MongoDB Atlas; nếu khác Singapore (`ap-southeast-1`) thì chuyển cluster hoặc chuyển Render sang cùng region. Backup (`mongodump`) trước khi chuyển.
3. **Nén response**: thêm `compression` vào `server/src/app.ts` trước các router; bỏ qua `/health`.
4. **Rate limit sau proxy**: trước tiên log tạm `X-Forwarded-For`, `x-real-ip`, `x-vercel-forwarded-for` và `req.ip` trên staging để xác nhận số hop. Sau đó đặt `app.set('trust proxy', <số hop đã đo>)` hoặc cho `keyGenerator` của `apiLimiter`/`authLimiter` đọc đúng IP client. Thêm test cho hàm lấy IP.
5. **Mongo**: đặt `maxPoolSize` hợp lý (mặc định 100 là đủ), thêm `socketTimeoutMS`; không đổi gì khác.
6. **Giảm query trong `submitLesson`**: `lessons.service.ts:152-161` tải toàn bộ lesson của chặng mỗi lần nộp bài; đổi thành `countDocuments` + `distinct` để giảm dữ liệu trả về.

Tiêu chí chấp nhận: khi workflow keep-warm đang chạy, request lúc bất kỳ trả về < 2 giây (trừ ngay sau deploy/restart); header `content-encoding: gzip` có trên `/api/v1/*` JSON lớn; hai máy khác IP gọi API thì bị đếm rate limit riêng.

# Pha 2 — Client

1. **Khởi động auth**: trong `authStore.fetchMe`, nếu chưa có access token trong bộ nhớ thì gọi `/auth/refresh` trước rồi mới gọi `/auth/me`, bỏ được 1 lượt 401. Phương án tốt hơn [GĐ]: cho `/auth/refresh` trả luôn `user` + `subscription` để F5 chỉ còn 1 request. Đổi API thì cập nhật `docs/05-api-and-data-contracts.md`.
2. **Code splitting**: chuyển các trang trong `client/src/app/router.tsx` sang `React.lazy` + `Suspense` (dùng chung spinner hiện có). Ưu tiên tách nhóm admin/CMS, parent, lesson player. Landing và login giữ import tĩnh.
3. **Font**: giảm số độ đậm Google Fonts xuống những độ đậm thực sự dùng; Material Symbols chỉ tải đúng trục cần (`FILL`, `wght` cố định) thay vì bản variable đầy đủ.
4. **Ảnh**: tự host ảnh mascot đang hotlink `lh3.googleusercontent.com` (ví dụ `PointsShopPage.tsx:174`) vào `client/public` hoặc Cloudinary; thêm `loading="lazy"` cho ảnh vật phẩm.
5. **Cache tĩnh**: thêm header `Cache-Control: public, max-age=31536000, immutable` cho `/assets/*` trong `client/vercel.json`.

Tiêu chí chấp nhận: `vite build` báo chunk entry < 300KB (chưa gzip); F5 trên trang protected chỉ còn 1 request auth; Lighthouse mobile của landing không thấp hơn trước khi sửa.

# Pha 3 — Trang điểm: sửa hiển thị (không đổi nghiệp vụ)

File chính: `client/src/features/points/PointsShopPage.tsx`, `server/src/modules/points/*`.

1. **Số dư**: tiêu đề theo đúng tài liệu: "✨ ViVi Points của bé" và dòng số "XXX ViVi Points"; dòng phụ "Đây là số ViVi Points hiện có và được cập nhật sau mỗi hoạt động."
2. **Bỏ số liệu viết cứng**:
   - "Tổng tích lũy": server trả thêm `totalEarned` (tổng `delta > 0`, không tính `refund`) trong `GET /points/children/:childId`.
   - "Có sẵn 5 món": đếm từ danh sách vật phẩm thực tế.
   - "Hạng học tập": bỏ thẻ vì tài liệu không yêu cầu và chưa có quy tắc xếp hạng. Việc này cũng phù hợp nguyên tắc "không xếp hạng trẻ" trong `docs/02-business-rules.md`.
3. **Nhãn giao dịch**: tách bảng nhãn `reason → nhãn` ra một hằng dùng chung; thêm nhãn cho `refund` ("Hoàn điểm đổi quà"), hiện thêm `description` của giao dịch.
4. **Thời gian**: "Hôm nay" / "Hôm qua" / `dd/MM/yyyy` theo múi giờ của trình duyệt.
5. **Lịch sử đầy đủ**: API phân trang theo cursor `?before=<createdAt>&limit=20` (giữ tương thích response hiện tại); UI có nút "Xem thêm". Dạng bảng 3 cột "Thời gian / Hoạt động / ViVi Points" trên desktop, thẻ trên mobile.
6. **Bố cục**: thứ tự Số dư → Lịch sử → Vật phẩm đổi thưởng (xếp dọc như tài liệu); tiêu đề mục "VẬT PHẨM ĐỔI THƯỞNG"; mỗi thẻ có tên, mô tả ngắn, "✨ N ViVi Points", nút "Đổi thưởng →".
7. **Cập nhật sau hoạt động**: sau khi nộp bài/quiz, invalidate query `['childPoints', childId]` để số dư và lịch sử tự cập nhật.

Tiêu chí chấp nhận: các test trong `client/src/test` cho các trường hợp hôm nay, hôm qua, giao dịch refund, phân trang và số liệu không viết cứng.

# Pha 4 — Loại vật phẩm và dùng avatar/trang trí

1. **Model**: thêm `category: 'badge' | 'avatar' | 'profile_decoration' | 'collectible'` vào `ShopItem` (bắt buộc với `type: 'virtual'`); giữ nguyên `type` để không phá luồng quà hiện vật. Quà hiện vật hiển thị thành nhóm riêng "Quà gửi tận nhà" [GĐ].
2. **Migration** (backup trước khi chạy): vật phẩm ảo có `badgeCode` → `badge`, còn lại → `collectible`. Chạy dry-run có báo cáo trước, theo quy trình trong `docs/cms-operations.md`.
3. **Admin**: `GET/PATCH /admin/inventory` đọc và sửa được `category`; thêm `POST /admin/inventory` để tạo vật phẩm mới (hiện admin mới chỉ sửa được tồn kho), có audit log như các thao tác admin khác.
4. **Trang bé**: tab lọc theo loại: Tất cả / Huy hiệu / Avatar / Trang trí hồ sơ / Sưu tầm / Quà gửi tận nhà.
5. **Dùng vật phẩm** (theo D5): bé chọn avatar đã sở hữu → cập nhật `Child.avatarId`; chọn khung trang trí → `Child.profileDecorationId`. Server kiểm tra bé sở hữu vật phẩm. Hiển thị ở header `KidsLayout` và `TreasureRoomPage`.
6. **Seed**: thêm vật phẩm mẫu đủ 4 loại.

# Pha 5 — Quy tắc điểm mới (chỉ làm sau khi chốt D1–D4)

1. **Cộng điểm theo hoạt động (D1)**: khi server chấm bài, mỗi hoạt động đạt lần đầu được +N điểm; `reason: 'activity'`, `refId: <lessonId>:<activityId>`; dùng index unique có sẵn để chống cộng trùng. Chỉ cộng khi server chấm canonical snapshot, không tin client [QĐ §4]. Outbox offline chưa cấp điểm cho đến khi server chấm [QĐ].
2. **Thử thách (D2)**: theo phương án được chốt; nếu là quiz văn hóa thì chỉ đổi nhãn hiển thị.
3. **Cấu hình điểm (D3)**: collection `PointRule` (key, amount, active) thay cho `POINT_RULES` viết cứng; admin sửa được số điểm, có audit log; giá trị seed bằng đúng số hiện tại để không đổi hành vi. Cache trong bộ nhớ 60 giây.
4. **Sử dụng phần thưởng (D4)**: thêm `reason: 'use_reward'` và luồng trừ điểm atomic giống `redeemItem` (kiểm tra số dư, compensation) — chỉ sau khi khách hàng định nghĩa rõ.
5. Mọi reason mới phải có nhãn ở bảng nhãn dùng chung của Pha 3 và có trong enum `PointReason`.

# Pha 6 — Tài liệu, test, rollout

1. Cập nhật `docs/02-business-rules.md` §4 (nguồn cộng/trừ điểm, loại vật phẩm, quy tắc dùng avatar), `docs/03-feature-inventory.md`, `docs/05-api-and-data-contracts.md` (API phân trang, `totalEarned`, inventory, auth refresh), `docs/04-system-architecture.md` (Render plan, compression, trust proxy), và đánh dấu đã xử lý code-splitting trong `docs/06-review-findings.md`.
2. Test server: idempotency cộng điểm theo hoạt động, phân trang lịch sử, `totalEarned`, sở hữu khi chọn avatar, migration category, lấy IP sau proxy.
3. Test client: các test ở Pha 3, chọn avatar, lazy route không vỡ điều hướng.
4. Chạy `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` ở root.
5. Rollout: staging trước; backup DB production; chạy migration category (dry-run → thật → đối soát số lượng); deploy server trước client vì API mới tương thích ngược.

# Rủi ro

- Đổi `trust proxy` sai số hop thì IP có thể bị giả mạo qua header; phải đo trên staging trước khi đặt.
- Cộng điểm theo hoạt động làm tăng điểm với các bài đã học: [GĐ] không cộng hồi tố cho bài đã hoàn thành trước ngày phát hành.
- Migration category chạy trên dữ liệu thật: bắt buộc backup và dry-run.
- Lazy loading có thể làm chậm lần mở đầu của trang admin; chấp nhận được.

# Quyết định cần chốt

| # | Câu hỏi | Trạng thái |
|---|---|---|
| D0 | Nâng Render lên gói trả phí hay dùng ping giữ server thức? | **Đã chốt 2026-10-09: ping giữ thức.** Giữ `plan: free`; thêm GitHub Actions cron gọi `https://vietverse.onrender.com/health` mỗi 10 phút. Chấp nhận vẫn có thể chậm sau deploy/restart hoặc khi hết giờ free trong tháng của Render. |
| D1 | "Hoàn thành hoạt động" có được cộng điểm riêng không, bao nhiêu? | **Đã chốt: +1 điểm/hoạt động đạt lần đầu, không cộng hồi tố.** |
| D2 | "Thử thách" là gì? | **Đã chốt: chính là quiz văn hóa hiện có (+5); chỉ đổi nhãn thành "Hoàn thành thử thách".** |
| D3 | "Hoạt động thưởng khác do hệ thống cấu hình" cần mức nào? | **Đã áp dụng:** admin sửa được số điểm của các quy tắc có sẵn, không tạo quy tắc mới tùy ý. |
| D4 | "Sử dụng phần thưởng" trừ điểm khi nào? | **Đã chốt 2026-10-09: dùng/bỏ dùng vật phẩm không trừ điểm; `use_reward` giữ sẵn cho phần thưởng tiêu hao tương lai.** |
| D5 | Avatar và trang trí hồ sơ sau khi đổi được dùng ở đâu? | **Đã chốt: bé tự chọn để dùng; hiện ở header khu bé và Phòng báu vật.** |
