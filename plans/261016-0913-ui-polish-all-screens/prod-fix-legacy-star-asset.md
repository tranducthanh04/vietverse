# Runbook — thay ảnh ngôi sao đen của vật phẩm cũ trên production

- Ngày soạn: 2026-10-16. Chủ sản phẩm đã đồng ý sửa dữ liệu production (2026-10-16).
- Phạm vi: chỉ collection `shopitems`, chỉ field `assetUrl`, chỉ các document có `assetUrl` **đúng bằng** ảnh cũ (ký tự "★" đen không nền, từ `server/src/seeds/catalog.ts` bản trước `fix/ui-polish-all-screens`). Không đổi tên, giá, tồn kho, trạng thái.
- Ảnh mới: `emojiAsset('🌟', '#FFF3C4')` — giống hệt seed hiện tại.
- Script: [`fix-legacy-star-asset.mongosh.js`](./fix-legacy-star-asset.mongosh.js). Mặc định chạy thử (không ghi); `APPLY=1` mới ghi. Chạy lại nhiều lần an toàn.
- Đã thử trên DB QA local `vietverse_uiqa`: chạy thử thấy 5 vật phẩm; chạy thật `matched=5 modified=5`, còn 0; chạy lại không đổi gì.
- Lý do người vận hành tự chạy: Claude Code bị chặn đọc biến môi trường chứa mật khẩu trong container production (chính sách an toàn), nên không tự chạy.

## Các bước (chạy từ máy có SSH tới máy chủ, thư mục gốc repo)

Trong Claude Code có thể gõ `! <lệnh>` để chạy và đưa kết quả vào hội thoại.

1. Chép script lên máy chủ:

   ```sh
   scp -P 2222 -i ~/.ssh/id_ed25519 plans/261016-0913-ui-polish-all-screens/fix-legacy-star-asset.mongosh.js anhduong@27.72.146.195:~/vietverse/fix-legacy-star-asset.mongosh.js
   ```

2. Sao lưu DB ngay trước khi sửa (file `vietverse-manual-<giờ>.archive.gz` trong `~/vietverse/backups`, không bị xoá tự động):

   ```sh
   ssh -p 2222 -i ~/.ssh/id_ed25519 anhduong@27.72.146.195 'bash ~/vietverse/app/deploy/selfhost/backup-now.sh'
   ```

3. Chạy thử (không ghi) — xem danh sách vật phẩm sẽ đổi:

   ```sh
   ssh -p 2222 -i ~/.ssh/id_ed25519 anhduong@27.72.146.195 'docker exec -i -e APPLY=0 vietverse-mongo sh -c "mongosh --quiet -u \"\$MONGO_INITDB_ROOT_USERNAME\" -p \"\$MONGO_INITDB_ROOT_PASSWORD\" --authenticationDatabase admin vietverse" < ~/vietverse/fix-legacy-star-asset.mongosh.js'
   ```

   Kỳ vọng: `Mode: DRY RUN` và danh sách các vật phẩm như "Huy hiệu Sao Sáng Lí Lắc", "Nón Lá Tí Hon cho Mascot", "Áo Dài Gấm Mini cho Vivi", "Bộ Sticker Bảng Chữ Cái Vietverse", "Truyện Tranh Tích Xưa Nước Nam" (có thể khác nếu admin đã đổi ảnh).

4. Chạy thật — chỉ khi bước 3 đúng như mong đợi:

   ```sh
   ssh -p 2222 -i ~/.ssh/id_ed25519 anhduong@27.72.146.195 'docker exec -i -e APPLY=1 vietverse-mongo sh -c "mongosh --quiet -u \"\$MONGO_INITDB_ROOT_USERNAME\" -p \"\$MONGO_INITDB_ROOT_PASSWORD\" --authenticationDatabase admin vietverse" < ~/vietverse/fix-legacy-star-asset.mongosh.js'
   ```

   Kỳ vọng: `Updated: matched=N modified=N` và `Remaining legacy: 0`.

5. Kiểm tra: mở `https://vietverse.io.vn/diem-thuong` (bé) và `/admin/doi-qua` → tab "Kho vật phẩm": các vật phẩm trên hiện ngôi sao vàng có nền tròn thay vì ngôi sao đen. Dữ liệu được đọc trực tiếp từ DB nên không cần deploy lại.

## Hoàn tác

Ảnh cũ là giá trị cố định, không phụ thuộc dữ liệu khác. Khôi phục nhanh chỉ các document vừa đổi bằng cách chạy lại updateMany ngược (đổi `NEW` → `OLD`) hoặc khôi phục toàn DB từ bản sao lưu bước 2 bằng `deploy/selfhost/restore.sh` (xem `docs/self-host-deployment.md`).
