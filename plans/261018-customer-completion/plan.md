# Hoan thien yeu cau khach hang theo thu tu

Baseline: main@35c51ca; origin/main cung revision. Remote khong co nhanh dev.
Nguon: ../reports/2026-10-18-customer-docs-full-audit.md va Google Docs da doi chieu.
Pham vi owner da yeu cau: sua/thuc hien cac muc con thieu, kiem chung tung dot.
Khong tu deploy, publish CMS, migrate DB that, mua dich vu hoac thay doi quy tac chua chot.

## Thu tu va tieu chi

1. Integrity (F04/F05/F06/F11): canonical grading fail-closed, doi ao mot lan khi dong thoi, finalize tra receipt da commit, paid active + expiry hop le. Test tai hien truoc sua, DB tam cho concurrency, khong doi gia/diem/pass threshold.
2. Audio/thu am (F09/F12): nghe mau trong record_voice; error/retry danh sach va playback; khong tu gia dinh da cau hinh storage/AI. Provider/audio va nghiem thu thiet bi that la gate ngoai code.
3. Player/song ngu (F01/F13): doi chieu quy tac retry tung cau voi quyet dinh server-grade-final cho 4 loai moi; nhap dung ban dich da co, khong overwrite snapshot bat bien. Neu mau thuan can owner chot truoc thay API/diem.
4. Curriculum: duyet tung hoat dong B1-B20, 21 truyen, 8 nhom van hoa; nguon/audio/quyen va gia dinh bien soan phai tach ro.
5. Tien do/thuong: tu vung, link chang, huy hieu; cong thuc diem hoc tap va moc B20 can quyet dinh.
6. UI/admin: gia tri 0, error states, CTA/header/footer; khong bia Facebook/legal.
7. Auth/privacy/offline/van hanh: tinh nguyen tu refresh, late-upload cleanup, cache sync, PIN/email policy, rollout gates.

## Kiem chung

- Moi fix co test fail vi loi cu, pass sau sua; khong lam yeu test.
- Chay focused suites, npm test, typecheck/build va review diff.
- Cap nhat docs owning behavior/API va journal bang chung; khong danh dau production da sua khi chua deploy/nghiem thu.
- CLI ak khong co tren may; khong the dong bo index/status bang ak plan. Bang chung tien do ghi trong journal, khong tu dong dong plan.
