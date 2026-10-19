# Tự host Vietverse (FE + API + MongoDB) — runbook

Trạng thái: **Pha 1 (code) xong 2026-10-13, chưa chạy trên máy chủ.** Plan tổng: [`plans/261013-0900-self-host-backend-mongodb/plan.md`](../plans/261013-0900-self-host-backend-mongodb/plan.md). File cấu hình nằm trong [`deploy/selfhost/`](../deploy/selfhost/).

Ký hiệu: **[QĐ]** quyết định của owner; **[GĐ]** giả định kỹ thuật chưa kiểm chứng trên máy thật.

## Quyết định đã chốt

- **[QĐ] D1 (2026-10-13):** domain `vietverse.io.vn`, FE và API cùng origin. `www.vietverse.io.vn` redirect 301 về apex ở nginx host.
- **[QĐ] D2:** chuyển cả FE về máy chủ.
- Máy chủ: Ubuntu 24.04, Docker 29 / Compose v5, user `anhduong` (nhóm `docker`, không có sudo). Nginx host lo TLS và proxy `vietverse.io.vn` → `http://127.0.0.1:15081`.

## Kiến trúc

```
Internet ─443─► nginx host (TLS; /etc/nginx/sites-available/vietverse.conf)
                  └─► 127.0.0.1:15081 ─► vietverse-web (nginx:1.27-alpine, SPA build)
                                            ├─ /            file tĩnh, SPA fallback index.html
                                            ├─ /api/*       ─► vietverse-api:5000  (Node 22, dist/server.js)
                                            └─ /healthz     ─► vietverse-api:5000/health
                         vietverse-api ─► vietverse-mongo:27017 (mongo:7, rs0, keyFile, auth)
                         vietverse-backup (mongo:7, mongodump + tar.gz audio hằng ngày → ~/vietverse/backups)
                         vietverse-api ─► volume vietverse_audio (/data/audio: bản thu + audio nội dung)
                         vietverse-mongo-keyfile / vietverse-mongo-init / vietverse-audio-init: one-shot, chạy mỗi lần `up`
```

| Thành phần | Giá trị cố định |
| --- | --- |
| Compose project | `vietverse` (đặt trong `compose.yml` bằng `name:`; script luôn kèm `-p vietverse`) |
| Container | `vietverse-web`, `vietverse-api`, `vietverse-mongo`, `vietverse-backup`, one-shot `vietverse-mongo-keyfile`, `vietverse-mongo-init`, `vietverse-audio-init` |
| Network | `vietverse_net` (bridge riêng) |
| Volume | `vietverse_mongo_data`, `vietverse_mongo_config`, `vietverse_mongo_keyfile`, `vietverse_audio` (audio BE, mount `/data/audio`) |
| Image | `vietverse/api:<git sha 12>`, `vietverse/web:<git sha 12>`, nhãn `io.vietverse.project=vietverse` |
| Port publish | duy nhất `127.0.0.1:15081` → `vietverse-web:80`; API và Mongo không publish |
| Giới hạn | mongo 2 GB / 2 CPU, api 1 GB / 2 CPU, web 256 MB / 1 CPU, backup 512 MB / 1 CPU |
| Thư mục | `~/vietverse/` = `app/` (git checkout), `compose.yml` (bản sao từ repo), `.env` (600), `backups/`, `.isolation/` |

Không có lệnh `docker system/volume/image/builder prune` nào trong script. Dọn image chỉ theo tên `vietverse/*` hoặc nhãn `io.vietverse.project=vietverse`.

### Thay đổi code đi kèm (server)

- `SELF_HOSTED=1` (env, mặc định tắt) bật chế độ tự host: Express `trust proxy` = `TRUST_PROXY_HOPS` (mặc định 2 = nginx host + nginx web) và rate limit lấy IP từ `req.ip`. Vercel (`VERCEL=1`) và Render (`RENDER=true`) giữ nguyên hành vi; không đặt biến thì vẫn `trust proxy = 1` như trước. Giá trị khác `''/'0'/'1'` hoặc hop ngoài 1–5 làm API từ chối khởi động.
- Pool MongoDB khi `SELF_HOSTED=1`: `maxPoolSize` 20, `minPoolSize` 2 (tiến trình chạy lâu). Serverless giữ 5/0. Production vẫn `autoIndex:false`; index chỉ tạo bằng `node dist/seeds/prepareDeploymentIndexes.js --apply` (bản compile của `npm run deploy:indexes`, có sẵn trong image API, chỉ thêm, không xóa/sửa).
- `src/server.ts` (listener chạy lâu: kết nối DB rồi mới listen) là entrypoint của image; `src/index.ts` chỉ dành cho Vercel. Khi nhận SIGTERM, server đóng HTTP rồi đóng pool Mongo.
- IP người dùng: nginx host **ghi đè** `X-Forwarded-For` bằng `$remote_addr`, nginx web nối thêm địa chỉ nginx host. API bỏ qua mọi giá trị giả mạo phía bên trái. **[GĐ]** Nếu sau này đặt CDN/proxy trước nginx host thì phải tăng `TRUST_PROXY_HOPS` lên 3.

## Biến môi trường (`~/vietverse/.env`, quyền 600)

Mẫu đầy đủ: [`deploy/selfhost/.env.example`](../deploy/selfhost/.env.example). `init.sh` tự sinh mọi giá trị `__GENERATE__` (`openssl rand -hex`), không bao giờ ghi đè giá trị đã có.

| Nhóm | Biến | Bắt buộc |
| --- | --- | --- |
| Mongo | `MONGO_ROOT_USERNAME/PASSWORD`, `MONGO_APP_USERNAME/PASSWORD`, `MONGO_BACKUP_USERNAME/PASSWORD` | Có (tự sinh). Mật khẩu chỉ chữ/số |
| API | `CLIENT_ORIGIN=https://vietverse.io.vn`, `JWT_SECRET`, `JWT_REFRESH_SECRET` | Có (JWT tự sinh) |
| API cố định | `NODE_ENV=production`, `PORT=5000`, `SELF_HOSTED=1`, `TRUST_PROXY_HOPS=2`, `CMS_PUBLISH_ENABLED=false`, `AUDIO_STORAGE_DIR=/data/audio` (đặt trong `compose.yml`) | Đã có sẵn |
| Tích hợp | `GOOGLE_CLIENT_ID`, `CLOUDINARY_*` (4 biến, chỉ còn cho ảnh CMS), `PAYOS_*` (3 biến, đủ cả bộ hoặc trống) | Tùy chọn; thiếu thì Google/ảnh CMS/thanh toán không hoạt động. **Audio (thu âm + narration) lưu trên volume `vietverse_audio`, không dùng Cloudinary** |
| Vận hành | `VIETVERSE_TAG`, `VIETVERSE_PREVIOUS_TAG` (do `up.sh` ghi), `VV_UID/VV_GID` (do `init.sh` ghi), `BACKUP_HOUR=2`, `BACKUP_KEEP=14` | Tự động |

- `MONGODB_URI` **không** nằm trong `.env`: `compose.yml` ghép `mongodb://<app>:<pw>@vietverse-mongo:27017/vietverse?replicaSet=rs0&authSource=vietverse`.
- API chỉ nhận danh sách biến khai báo trong `compose.yml` (không `env_file`), nên không thấy mật khẩu root/backup của Mongo. Không truyền `SEED_*`: production không seed.
- **[QĐ cần owner]** JWT mới sinh trên máy chủ khác JWT của Vercel → người dùng phải đăng nhập lại sau cutover. Muốn giữ phiên thì owner tự chép đúng hai secret JWT của BE Vercel Production vào `.env` (ngoài chat).

## 1. Cài lần đầu (Pha 2, user `anhduong`, không sudo)

```bash
mkdir -p ~/vietverse
git clone --depth 1 -b main https://github.com/tranducthanh04/vietverse.git ~/vietverse/app
cd ~/vietverse/app/deploy/selfhost
chmod +x ./*.sh                      # chỉ cần nếu git chưa lưu bit thực thi (commit từ Windows)
./check-isolation.sh before          # chụp trạng thái các dự án khác TRƯỚC mọi thay đổi
./init.sh                            # .env + secret, keyfile, mongod rs0, rs.initiate, user app/backup
nano ~/vietverse/.env                # điền GOOGLE_CLIENT_ID, CLOUDINARY_*, PAYOS_* nếu dùng
./up.sh                              # build vietverse/{api,web}:<sha>, up -d, chờ healthy, indexes
curl -s http://127.0.0.1:15081/healthz
curl -sI http://127.0.0.1:15081/
curl -s http://127.0.0.1:15081/api/v1/culture | head -c 200
./check-isolation.sh after && ./check-isolation.sh diff     # phải "OK: không ảnh hưởng dự án khác"
```

`init.sh` chạy lại an toàn: chỉ sinh secret còn thiếu, `vietverse-mongo-keyfile` chỉ tạo keyfile khi chưa có, `vietverse-mongo-init` chỉ `rs.initiate` một lần và tạo/cập nhật user (đổi mật khẩu trong `.env` rồi chạy lại là xoay mật khẩu user app/backup; mật khẩu root chỉ có hiệu lực ở lần khởi tạo volume đầu tiên).

Thứ tự khởi động do Compose bảo đảm: keyfile xong → mongo (healthy khi là PRIMARY) + mongo-init thành công → api healthy (`/health`) → web. Backup chờ mongo healthy.

## 2. Bước chủ máy chạy bằng sudo (Pha 3)

Trỏ DNS `vietverse.io.vn` và `www.vietverse.io.vn` (A record) về IP máy chủ trước. Sau đó:

```bash
sudo cp /home/anhduong/vietverse/app/deploy/selfhost/host-nginx/vietverse.conf /etc/nginx/sites-available/vietverse.conf
sudo ln -s /etc/nginx/sites-available/vietverse.conf /etc/nginx/sites-enabled/vietverse.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d vietverse.io.vn -d www.vietverse.io.vn
sudo nginx -t && sudo systemctl reload nginx
```

- Chỉ `reload`, không `restart`; không sửa `nginx.conf` hay site khác; certbot chỉ cho hai tên trên.
- **[GĐ]** File mẫu chỉ `listen 80;` (IPv4). Nếu `booking.conf` hiện có cũng `listen [::]:80;` thì thêm dòng đó cho đồng bộ trước `nginx -t`.
- Sau certbot: thêm `https://vietverse.io.vn` vào Authorized JavaScript origins của Google OAuth client; đổi webhook PayOS sang `https://vietverse.io.vn/api/v1/payments/webhook` khi cutover (Pha 5).

## 3. Cập nhật phiên bản

```bash
cd ~/vietverse/app/deploy/selfhost
./check-isolation.sh before
./up.sh --pull          # git pull --ff-only, build tag mới, up -d, chờ healthy, indexes, dọn image cũ
./check-isolation.sh after && ./check-isolation.sh diff
```

`up.sh` giữ image của tag hiện tại **và tag trước đó** (ghi ở `VIETVERSE_PREVIOUS_TAG`) để rollback không cần build; image `vietverse/*` khác và image không tag mang nhãn Vietverse bị xóa. Build cache BuildKit là tài nguyên dùng chung của Docker daemon nên script không dọn; không dùng `docker builder prune` (ảnh hưởng dự án khác).

### Rollback bản build

```bash
cd ~/vietverse
sed -i 's/^VIETVERSE_TAG=.*/VIETVERSE_TAG=<tag trước, xem VIETVERSE_PREVIOUS_TAG>/' .env
docker compose -p vietverse up -d
```

Index đã thêm không bị gỡ (chỉ additive) nên bản cũ vẫn chạy được.

## 4. Backup và restore

- Tự động: `vietverse-backup` dump DB `vietverse` mỗi ngày sau `BACKUP_HOUR` giờ VN (mặc định 02:00) vào `~/vietverse/backups/vietverse-YYYY-MM-DD_HHMMSS.archive.gz`, giữ 14 bản daily mới nhất. Container chạy bằng UID của `anhduong` nên file thuộc user này (quyền 600). Dump lỗi → container chuyển `unhealthy` (xem `docker ps`, `docker logs vietverse-backup`).
- Audio: cùng vòng chạy, `dump-audio.sh` nén volume `vietverse_audio` (mount read-only `/audio`) thành `~/vietverse/backups/vietverse-audio-YYYY-MM-DD_HHMMSS.tar.gz`, giữ cùng `BACKUP_KEEP` bản. Lỗi dump audio cũng đẩy container sang `unhealthy`.
- Thủ công: `./backup-now.sh` → `vietverse-manual-*.archive.gz` (DB) và `vietverse-audio-manual-*.tar.gz` (audio); cả hai không bị xóa tự động.
- Khôi phục audio (volume ghi đè, không qua `restore.sh`): dừng API, giải nén tar vào volume, rồi bật lại API —

```bash
cd ~/vietverse
docker compose -p vietverse stop vietverse-api
# Giải nén vào gốc volume audio; tar đã chứa recordings/ và content/
docker run --rm -v vietverse_audio:/data/audio -v "$PWD/backups":/b:ro mongo:7 \
  sh -c 'cd /data/audio && tar -xzf /b/vietverse-audio-<time>.tar.gz'
docker run --rm -v vietverse_audio:/data/audio --user 0:0 mongo:7 \
  sh -c 'chown -R 1000:1000 /data/audio && chmod -R u=rwX,go=rX /data/audio'
docker compose -p vietverse start vietverse-api
```
- **[QĐ D6 chờ owner]** Bản sao ngoài máy: chưa chốt nơi lưu; tới khi chốt, chép thủ công `~/vietverse/backups/*` ra máy khác.
- Restore (chỉ vào DB `vietverse`):

```bash
./restore.sh ~/vietverse/backups/<file>.archive.gz --yes-replace-vietverse
# Dump Atlas có DB nguồn tên khác (ví dụ `test`, xem D5):
./restore.sh /path/atlas.archive.gz --yes-replace-vietverse --from-db test
```

  Script: kiểm `gzip -t` → backup an toàn (`backup-now.sh`, tắt bằng `--no-safety-backup`) → dừng `vietverse-api` → `mongorestore --drop --nsInclude '<db>.*'` (đổi tên sang `vietverse` nếu `--from-db`) → bật lại API → áp lại indexes. Collection có trong archive bị thay thế; collection không có trong archive giữ nguyên; user/DB khác trong archive bị bỏ qua.
- Diễn tập restore hằng tháng (Pha 6) vào project tạm `vietverse-restoretest` theo plan; chưa có script riêng.

Mật khẩu Mongo không bao giờ xuất hiện trên dòng lệnh (`ps` của host): mongosh đọc từ env trong container, mongodump/mongorestore đọc từ file `--config` tạm.

## 5. Kiểm tra cô lập

`check-isolation.sh before|after|diff` lưu vào `~/vietverse/.isolation/{before,after}/`:

- `containers.txt`: mọi container không phải `vietverse-*` với `name|image|state|health` (bỏ phần uptime vì đổi theo giây);
- `ports.txt`: socket TCP đang listen (`ss -ltnH`), trừ `127.0.0.1:15081`;
- `sites.txt`: mã HTTP của `https://<server_name>/` cho mọi `server_name` trong `/etc/nginx/sites-enabled/*` (bỏ `vietverse*`, `_`, wildcard/regex, `localhost`).

`diff` in khác biệt và trả exit 1 nếu có bất kỳ dòng nào khác → dừng và hoàn tác bước vừa làm. **[GĐ]** Site có mã trả về dao động hoặc dịch vụ dùng port ngẫu nhiên có thể gây báo động giả; khi đó đối chiếu thủ công trước khi kết luận.

## 6. Gỡ bỏ hoàn toàn

```bash
cd ~/vietverse/app/deploy/selfhost
./check-isolation.sh before
./backup-now.sh                     # rồi chép backup ra ngoài máy
./uninstall.sh --yes                # down -v (container, network, volume vietverse_*), xóa image vietverse/*
rm -rf ~/vietverse                  # sau khi đã giữ backup ở nơi khác
```

Chủ máy (sudo):

```bash
sudo rm /etc/nginx/sites-enabled/vietverse.conf /etc/nginx/sites-available/vietverse.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot delete --cert-name vietverse.io.vn
```

Xóa DNS record nếu không dùng nữa, rồi so lại trạng thái các dự án khác (bản snapshot `before` cần chép ra ngoài `~/vietverse` trước khi `rm -rf`).

## 7. Rollback về Vercel + Atlas (Pha 5)

Vercel FE/BE và Atlas giữ nguyên ít nhất 14 ngày sau cutover. Rollback ≤ 5 phút: gỡ redirect trên Vercel (deploy lại commit trước) hoặc trỏ người dùng về `vietverse-nine.vercel.app`; nếu đã có dữ liệu ghi trên máy mới thì `backup-now.sh` rồi `mongorestore` ngược về Atlas theo [vercel-deployment.md](./vercel-deployment.md). Chưa thực hiện bước nào ở mục này.

## Cloudinary trên self-host — 2026-10-17 (lịch sử; audio đã chuyển sang đĩa 2026-10-19)

> Từ 2026-10-19, audio (thu âm + narration) lưu trên volume `vietverse_audio` qua `AUDIO_STORAGE_DIR=/data/audio`, **không còn dùng Cloudinary**. `CLOUDINARY_RECORDING_UPLOAD_PRESET` không còn tác dụng (có thể bỏ khỏi `.env`); `CLOUDINARY_*` còn lại chỉ phục vụ ảnh bìa CMS. Mục dưới giữ làm lịch sử.

- Triệu chứng trước đó: bé thu âm xong báo "Lưu trữ thu âm chưa sẵn sàng" (503 `UPLOAD_STORAGE_UNAVAILABLE`) vì cả 5 biến `CLOUDINARY_*` trong `~/vietverse/.env` để trống.
- Đã nạp bằng `~/vietverse/set-env.sh` (sao lưu `.env` trước: `~/vietverse/.env.bak-20261017-122350`): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_RECORDING_UPLOAD_PRESET=vietverse_recordings_signed`, `CLOUDINARY_IMAGE_UPLOAD_PRESET=vietverse_content_images_signed`. Hai preset signed đã có sẵn trên account từ đợt Vercel. Giá trị secret không ghi vào repo.
- Kiểm chứng: từ trong container `vietverse-api`, upload thử 1 giây WAV qua preset thu âm thành công rồi xoá ngay. Chưa chạy luồng thu âm thật của phụ huynh/bé trên production.
- Việc nên làm: API secret đã được dán vào hội thoại với trợ lý, nên rotate trong Cloudinary rồi chạy lại `set-env.sh` với secret mới.

## Giới hạn / chưa kiểm chứng

- Pha 1 chỉ kiểm chứng local trên Windows không có Docker: typecheck, unit test, `bash -n` + shellcheck, `compose.yml` hợp lệ theo compose-spec JSON schema, `npm ci -w <workspace>` cài đúng phạm vi, script index compile chạy được, và luồng `init-replica.js` + mongodump/mongorestore bằng file `--config` đã chạy thử trên mongod 8.2 local (tạo root → khởi động lại với `--replSet --keyFile` → initiate → user → chạy lại idempotent → transaction bằng user app → dump bằng user backup → restore đổi tên DB).
- **Chưa chạy** `docker build`/`docker compose up` thật: build image (đặc biệt `bcrypt` trên Alpine/musl), healthcheck, `nginx -t` của `web.nginx.conf`, quyền bind mount với UID, giới hạn tài nguyên phải được nghiệm thu ở Pha 2.
