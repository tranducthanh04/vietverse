# Bảng điểm UI theo ui-ux-pro-max — 2026-10-16

- Nhánh chấm: `fix/ui-polish-all-screens` (commit `afa1393`).
- Thang chấm: `ak-ui-ux-pro-max/references/quick-reference-rules.md` (§1–§10), Web Interface Guidelines của Vercel (tải 2026-10-16), mục web của `pre-delivery-checklist.md`.
- Cách chấm: 4 worker Opus 4.8 chạy song song, chỉ đọc code + ảnh chụp (`crawl.mjs`, `states.mjs`), tương phản tính theo công thức WCAG. Phiên chính mở code xác minh từng finding Critical/High/Medium trước khi giao sửa.
- Trọng số tổng: §1, §2 ×3; §3, §4, §5, §9 ×2; còn lại ×1.

## Điểm trước khi sửa

| § | Nhóm | Public | Khu bé | Phụ huynh + dùng chung | Admin |
| --- | --- | --- | --- | --- | --- |
| 1 | Accessibility | 5 | 6 | 6 | 7 |
| 2 | Touch & Interaction | 7 | 7 | 8 | 6 |
| 3 | Performance | 8 | 8 | 8 | 8 |
| 4 | Style Selection | 8 | 8 | 7 | 7.5 |
| 5 | Layout & Responsive | 6 | 7 | 7 | 8.5 |
| 6 | Typography & Color | 7 | 8 | 8 | 7 |
| 7 | Animation | 8 | 7 | 7 | 9 |
| 8 | Forms & Feedback | 6 | 7 | 7 | 7.5 |
| 9 | Navigation | 8 | 8 | 8 | 7 |
| 10 | Charts & Data | N/A | N/A | 8 | 8.5 |
| | **Tổng có trọng số** | **6.9** | **7.2** | **7.3** | **7.4** |

## Finding đã xác minh (giao sửa)

### Dùng chung toàn app
- [High] `client/index.html:6` viewport `maximum-scale=1.0, user-scalable=no` chặn zoom (WCAG 1.4.4). Cả 4 người chấm cùng phát hiện. Quyết định: cho phép zoom toàn app.
- [Low] `Button size="sm"` cao 40px (< 44px); `transition-all` ở `Button` và `.btn-3d-*`; chuỗi loading dùng `...`; thiếu `theme-color`.

### Public
- [Medium] Lỗi đăng nhập thiếu `role="alert"`; chữ `stone-400` 2.4–2.5:1; chip lọc < 44px; Văn hoá thiếu empty-state; đáp án sai quiz truyện chỉ báo bằng màu; thiếu nút hiện/ẩn mật khẩu; thiếu skip-link.
- [Low] Nhảy bậc tiêu đề; thiếu `autocomplete`/`spellCheck`; `min-h-screen` thay `dvh`; body text 14px trên mobile; chữ lỗi `red-600` 4.41:1.

### Khu bé + bài học
- [Medium] Confetti bỏ qua reduced-motion; form đổi quà dùng placeholder thay nhãn; đúng/sai ở nghe-chọn và ôn tập chỉ báo bằng màu tại nút.
- [Low] Nút phụ Phòng báu vật < 44px; ghép sai ở nối từ không phản hồi; menu chọn bé thiếu `aria-expanded`, không đóng bằng Esc/click ngoài, chữ 2.52:1; điểm không format locale; ProgressBar animate `width`; VictoryModal không có tên khả truy cập; chặng khoá vẫn bấm đổi được.

### Phụ huynh + onboarding
- [Medium] Ô Parent Gate không nhãn; chọn thời gian thiếu ngữ nghĩa radio; lỗi onboarding không được đọc; ScreenTimeLimitModal thiếu focus-trap/khoá cuộn.
- [Low] Loader thiếu `role="status"`; thanh năng lực animate `width` 700ms.

### Admin + CMS
- [High] Chữ trạng thái `emerald-600`/`red-500/600` 3.66–4.38:1; nút trong bảng 32–36px.
- [Medium] Hai modal tự dựng thiếu Esc/focus-trap; báo lỗi bằng `alert()`; huỷ đơn & hoàn điểm không xác nhận; bộ lọc/tab/trang không lên URL.
- [Low] Nhảy bậc tiêu đề dashboard; thiếu `tabular-nums`; ảnh thiếu kích thước, fallback `via.placeholder.com`.

## Không sửa / cần người quyết
- ScreenTimeLimitModal dùng màu indigo "ban đêm" ngoài token thương hiệu: giữ, coi là quyết định mỹ thuật có chủ đích (chờ chủ sản phẩm xác nhận).
- Skeleton loading admin: tuỳ chọn, chưa làm.
- Mô tả thẻ truyện/văn hoá 14px: giữ vì là bản xem trước có line-clamp.
- Ngôi sao đen ở vật phẩm production: dữ liệu, cần chủ sản phẩm đồng ý sửa.

## Điểm sau khi sửa (chấm lại 2026-10-16, HEAD `f9ac3e8`)

4 worker chấm lại độc lập trên ảnh mới (`shots-after3`, `states3`) và code, đối chiếu từng finding cũ.

| § | Nhóm | Public | Khu bé | Phụ huynh + dùng chung | Admin |
| --- | --- | --- | --- | --- | --- |
| 1 | Accessibility | 5 → 9 | 6 → 9 | 6 → 9 | 7 → 8.5 |
| 2 | Touch & Interaction | 7 → 8 | 7 → 9 | 8 → 9 | 6 → 9.5 |
| 3 | Performance | 8 → 8 | 8 → 9 | 8 → 9 | 8 → 8.5 |
| 4 | Style Selection | 8 → 8 | 8 → 9 | 7 → 7 | 7.5 → 9 |
| 5 | Layout & Responsive | 6 → 8 | 7 → 9 | 7 → 9 | 8.5 → 9 |
| 6 | Typography & Color | 7 → 8 | 8 → 8 | 8 → 9 | 7 → 9 |
| 7 | Animation | 8 → 8 | 7 → 8 | 7 → 8 | 9 → 9 |
| 8 | Forms & Feedback | 6 → 9 | 7 → 9 | 7 → 9 | 7.5 → 9 |
| 9 | Navigation | 8 → 9 | 8 → 9 | 8 → 8 | 7 → 8.5 |
| 10 | Charts & Data | N/A | N/A | 8 → 9 | 8.5 → 9 |
| | **Tổng có trọng số** | **6.9 → 8.4** | **7.2 → 8.9** | **7.3 → 8.6** | **7.4 → 8.9** |

- Toàn bộ finding Critical/High/Medium của lần chấm đầu: **đã sửa** (người chấm lại xác minh theo `file:line`). Không phát hiện hồi quy nặng.
- Finding mới khi chấm lại: 1 Medium (admin thiếu skip-link) và các Low. Đã sửa tiếp trong commit `f3a042f`: `SkipLink` dùng chung cho cả 4 layout; lỗi gửi quiz văn hoá có `role="alert"`; chữ thời gian trình phát audio `stone-600`; placeholder onboarding `stone-500`.

### Low còn lại (chưa sửa, có chủ đích hoặc ngoài phạm vi)
- `transition-all` còn rải rác ở nhiều component (đã sửa ở `Button` và `.btn-3d-*`, nơi dùng nhiều nhất).
- Bảng doanh thu chưa sắp xếp được; bộ lọc ngày trang Doanh thu chưa lên URL; tóm tắt lỗi CMS chưa có link neo tới trường.
- Chưa tự chuyển focus về `<main>` khi đổi route (đã có skip-link).
- Popup hết giờ dùng màu indigo "ban đêm" ngoài token — giữ, chờ chủ sản phẩm quyết.
- Footer link cao 32px; mũi tên "→"/"▼" dạng ký tự trang trí; hover zoom ảnh hero 700ms; vài mô tả 12–14px trên mobile; `autoFocus` ô tên ở onboarding; vài số điểm chưa qua `formatPoints`.

## Review lượt cuối toàn nhánh (so với `main`)

- Lượt 1 (HEAD `f3a042f`): **FAIL** — [I-1] khoá cuộn kẹt `hidden` khi hai `Modal` lồng nhau (màn hết giờ + Parent Gate) đóng cùng một commit; lỗi do commit tích hợp `d300d79`. Kèm Minor: mất focus khi đổi bước xác nhận huỷ đơn; `aria-controls` trỏ id chưa tồn tại.
- Sửa ở `704f108`: `Modal` đếm số modal đang mở, chỉ mở khoá khi về 0; test hồi quy `modalScrollLock.test.tsx` (đỏ trên bản cũ, xanh trên bản sửa); chuyển focus khi đổi bước; `aria-controls` có điều kiện.
- Lượt 2: **PASS** — client typecheck, 234/234 test, lint 0 lỗi (102 cảnh báo); server typecheck.
- Chưa kiểm tay trên thiết bị thật: luồng "hết giờ → Ba mẹ mở thêm giờ → Parent Gate đúng" (tự động hoá không đi tới được).
