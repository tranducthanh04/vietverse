---
title: Chuyển toàn bộ Vietverse (frontend + backend + MongoDB) sang máy chủ vật lý riêng, cô lập hoàn toàn với các dự án khác
status: draft — Pha 0 xong (2026-10-13); đã chốt chuyển cả FE (D2); chờ chốt D1, D4, D5, D6 trước Pha 1
created: 2026-10-13
depends_on: nhánh fix/post-vercel-audit (CORS, cookie Lax, audio, hiệu năng) nên merge trước
---

# Mục tiêu

1. Frontend, backend Express và MongoDB chạy chung trên máy chủ riêng ở Việt Nam: người dùng VN ↔ máy chủ ước tính 5–20 ms, mỗi lượt DB dưới 1 ms, không còn chặng Vercel.
2. **Cô lập tuyệt đối từ lúc cài đến lúc gỡ**: không sửa, không dừng, không chiếm tài nguyên của bất kỳ dự án nào khác trên máy. Gỡ bỏ chỉ là xóa đúng những thứ mang tên `vietverse`.
3. Rollback về Vercel + Atlas trong vài phút bằng cách đổi DNS.

Ký hiệu: **[QĐ]** quyết định cần chủ dự án chốt; **[GĐ]** giả định của plan.

# Kiến trúc trên máy chủ

```
Internet ──443──► nginx của host (đã có sẵn)
                    └─ /etc/nginx/sites-available/vietverse.conf   ← file DUY NHẤT Vietverse thêm vào /etc
                         server_name <domain-vietverse>
                         proxy_pass http://127.0.0.1:15081
                                │
          ┌─────────────── Docker Compose project "vietverse", network riêng vietverse_net ───────────────┐
          │ vietverse-web  (nginx:alpine, chứa bản build client)  127.0.0.1:15081 → 80                     │
          │   ├─ /            → file tĩnh SPA (fallback index.html, cache /assets 1 năm)                   │
          │   └─ /api/*       → http://vietverse-api:5000 (chỉ trong network nội bộ)                       │
          │ vietverse-api  (Node 20, server/dist)   KHÔNG publish port                                     │
          │ vietverse-mongo (mongo:7, replica set rs0 1 node, auth)   KHÔNG publish port                   │
          │ vietverse-backup (mongodump theo lịch)                                                          │
          └────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Một domain, một cert, một file nginx host. FE và API cùng origin nên cookie `SameSite=Lax` hoạt động tự nhiên, không cần CORS.
- Chỉ **một** cổng được bind và chỉ trên `127.0.0.1` (`15081`); API và Mongo hoàn toàn nằm trong network riêng.

# Nguyên tắc cô lập (áp cho mọi pha)

| Tài nguyên | Quy ước riêng cho Vietverse | Không được làm |
|---|---|---|
| Thư mục | Mọi thứ trong `/home/anhduong/vietverse/` (mã nguồn, `compose.yml`, `.env`, `backups/`) | Không ghi file nào khác ngoài **một** file nginx (do chủ máy thêm bằng sudo); không cài gói hệ thống |
| Runtime | Docker Compose, project name cố định `vietverse` (luôn chạy với `-p vietverse`) | Không cài Node/MongoDB/PM2 lên host; không dùng `docker system prune`, `docker volume prune`, `docker image prune` (các lệnh này đụng tới dự án khác) |
| Container | `vietverse-web`, `vietverse-api`, `vietverse-mongo`, `vietverse-backup` | Không dùng chung container/image/network với dự án khác |
| Image | Build với tag `vietverse/*:<git-sha>`; dọn bằng `docker image rm vietverse/...` | Không xóa image theo kiểu toàn cục |
| Mạng | Network riêng `vietverse_net` | Không nối vào network của dự án khác; không sửa iptables/ufw |
| Port | Duy nhất `127.0.0.1:15081` (đã kiểm trống) | Không publish port Mongo/API; không chiếm 80/443 |
| Dữ liệu | Named volume `vietverse_mongo_data`, `vietverse_mongo_config` | Không bind mount thư mục ngoài `~/vietverse` |
| nginx host | Một file `vietverse.conf` (+ symlink trong `sites-enabled`), viết theo mẫu `booking.conf` đang có | Không sửa `nginx.conf` hay site khác; luôn `nginx -t` trước `reload`; chỉ `reload`, không `restart` |
| Cert | Cert riêng `certbot --nginx -d <domain-vietverse>` (chỉ sửa đúng file `vietverse.conf`) | Không chạy certbot cho domain khác, không `certbot renew --force` toàn bộ |
| Tài nguyên | `mem_limit`/`cpus`: mongo 2 GB / 2 CPU, api 1 GB / 2 CPU, web 256 MB / 1 CPU, backup 512 MB / 1 CPU | Không để container dùng không giới hạn |
| Log | Dùng log rotation sẵn có của Docker daemon (50 MB × 3) | Không đổi `daemon.json` |
| Lịch chạy | Backup bằng container `vietverse-backup` | Không thêm crontab/systemd của host |

## Kiểm tra "không ảnh hưởng" (chạy ở mọi bước có thay đổi trên máy)

Trước và sau mỗi lần cài, cập nhật, gỡ:
```bash
docker ps --format '{{.Names}} {{.Status}}' | grep -v '^vietverse' | sort > /tmp/vv-others.txt   # trạng thái container dự án khác
ss -ltn | awk 'NR>1{print $4}' | sort > /tmp/vv-ports.txt
for h in $(grep -h server_name /etc/nginx/sites-enabled/* | grep -v vietverse | awk '{print $2}' | tr -d ';' | sort -u); do
  printf '%s %s\n' "$h" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 https://$h/)"; done > /tmp/vv-sites.txt
```
So sánh file trước/sau: danh sách container khác, port khác và mã HTTP của các site khác **phải giống hệt**. Khác ở bất kỳ dòng nào → dừng và hoàn tác bước vừa làm.

## Gỡ bỏ hoàn toàn

```bash
# 1. Lấy backup cuối về máy khác trước khi xóa
cd ~/vietverse && docker compose -p vietverse down -v          # chỉ container/network/volume của project vietverse
docker image ls --format '{{.Repository}}:{{.Tag}}' | grep '^vietverse/' | xargs -r docker image rm
rm -rf ~/vietverse
# 2. Chủ máy (sudo):
sudo rm /etc/nginx/sites-enabled/vietverse.conf /etc/nginx/sites-available/vietverse.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot delete --cert-name <domain-vietverse>
# 3. Xóa DNS record của domain Vietverse
# 4. Chạy lại bước "Kiểm tra không ảnh hưởng" và so với trước khi gỡ
```

# Quyết định

| # | Câu hỏi | Trạng thái |
|---|---|---|
| D1 | Domain cho Vietverse trên máy chủ? | **Cần chốt.** Một domain cho cả FE + API (ví dụ domain riêng của Vietverse hoặc subdomain). Domain hiện tại `vietverse-nine.vercel.app` không trỏ về máy riêng được |
| D2 | FE để Vercel hay chuyển về máy chủ? | **Đã chốt 2026-10-13: chuyển cả FE về máy chủ** |
| D3 | Máy chủ đặt ở đâu? | **Đã rõ (Pha 0): Việt Nam** |
| D4 | Cửa sổ bảo trì để chuyển dữ liệu? | Cần chốt: 30–60 phút giờ ít người dùng |
| D5 | Atlas cluster nào là production thật? | Cần chốt: docs ghi cluster A (theo docs cũ), file `.env` gửi trong chat trỏ cluster B (theo file .env) |
| D6 | Backup ngoài máy chủ để đâu? | Cần chốt (Google Drive/S3/máy khác) |

# Pha 0 — Khảo sát máy chủ (ĐÃ XONG, chỉ đọc)

| Hạng mục | Kết quả | Hệ quả cho plan |
|---|---|---|
| OS / phần cứng | Ubuntu 24.04.4, 24 CPU, RAM 30 GB (còn ~24 GB), disk còn 787 GB | Dư tài nguyên cho giới hạn ở trên |
| Vị trí | Việt Nam | Người dùng VN ↔ máy chủ ~5–20 ms (ước tính) |
| Docker | 29.6.1, Compose v5.3.1; `anhduong` thuộc nhóm `docker` | Dựng container không cần sudo |
| Log Docker | Đã xoay vòng 50 MB × 3 | Không đổi cấu hình chung |
| sudo | Cần mật khẩu | Chủ máy tự chạy bước nginx/certbot (Pha 3); thư mục đặt ở `~/vietverse` |
| Reverse proxy | nginx 1.24 trên host, mỗi site một file trong `sites-enabled`, certbot đã cài | Thêm đúng một file `vietverse.conf` theo mẫu `booking.conf` |
| Port | `15081` trống (và `15080`) | Bind duy nhất `127.0.0.1:15081` |
| Trùng tên | Không có container/network/volume/thư mục nào tên `vietverse` | Tên project `vietverse` an toàn |

# Pha 1 — Chuẩn bị code (PR riêng trong repo)

1. **`deploy/selfhost/api.Dockerfile`**: multi-stage Node 20 alpine; cài deps theo lockfile; build `server`; chạy `node dist/server.js` bằng user không phải root; `HEALTHCHECK` `/health`.
2. **`deploy/selfhost/web.Dockerfile`**: stage 1 build `client` (Node 20); stage 2 `nginx:alpine` chứa `dist` + `deploy/selfhost/web.nginx.conf`:
   - SPA fallback `try_files $uri /index.html`; `/assets/` cache `max-age=31536000, immutable`; `/images/` 1 ngày; `index.html` no-cache; gzip.
   - `location = /healthz { proxy_pass http://vietverse-api:5000/health; }` để giám sát từ ngoài.
   - `location /api/ { proxy_pass http://vietverse-api:5000; client_max_body_size 6m; proxy_read_timeout 60s; }` và chuyển tiếp nguyên `X-Forwarded-For`, `X-Forwarded-Proto` từ nginx host.
3. **`deploy/selfhost/compose.yml`** (không chứa secret): 4 service như sơ đồ, network `vietverse_net`, volume `vietverse_*`, giới hạn tài nguyên, `restart: unless-stopped`, healthcheck; chỉ `vietverse-web` có `ports: ["127.0.0.1:15081:80"]`. Mongo chạy `--replSet rs0 --keyFile`, cache WiredTiger 1 GB.
4. **`deploy/selfhost/.env.example`**: `MONGODB_URI=mongodb://vietverse_app:<pw>@vietverse-mongo:27017/vietverse?replicaSet=rs0&authSource=vietverse`, `JWT_*`, `CLIENT_ORIGIN=https://<domain-vietverse>`, `CLOUDINARY_*`, `GOOGLE_CLIENT_ID`, `PAYOS_*`, `CMS_PUBLISH_ENABLED`, `SELF_HOSTED=1`, `TRUST_PROXY_HOPS=2`. File `.env` thật chỉ nằm trên máy, quyền `600`, secret sinh mới.
5. **IP client khi tự host** (`server/src/middlewares/clientIp.ts`): thêm chế độ `SELF_HOSTED=1` dùng `trust proxy = TRUST_PROXY_HOPS` (nginx host + nginx web = 2) và lấy IP từ `X-Forwarded-For`. Test đơn vị cho 1/2 hop và header giả mạo.
6. **DB**: khi `SELF_HOSTED=1` dùng pool cho tiến trình chạy lâu (`maxPoolSize` 20, `minPoolSize` 2); giữ nguyên cấu hình Vercel để rollback.
7. **Script vận hành trong `deploy/selfhost/`**: `up.sh` (build tag theo git sha, `up -d`, chạy `deploy:indexes`), `backup.sh`, `restore.sh`, `check-isolation.sh` (bước kiểm tra ở trên), `uninstall.sh` (phần không cần sudo). Mọi lệnh docker đều kèm `-p vietverse`.
8. Tài liệu `docs/self-host-deployment.md`, cập nhật `docs/04-system-architecture.md`.

# Pha 2 — Dựng môi trường trên máy chủ (chưa có traffic thật)

```bash
./check-isolation.sh before           # ghi trạng thái dự án khác
mkdir -p ~/vietverse/backups
git clone --depth 1 -b main https://github.com/tranducthanh04/vietverse.git ~/vietverse/app
cp ~/vietverse/app/deploy/selfhost/compose.yml ~/vietverse/compose.yml
# tạo ~/vietverse/.env (chmod 600) với secret sinh mới
cd ~/vietverse && docker compose -p vietverse up -d vietverse-mongo
# rs.initiate 1 lần; tạo user vietverse_app quyền readWrite chỉ trên DB vietverse
docker compose -p vietverse up -d --build
curl -s http://127.0.0.1:15081/healthz ; curl -s http://127.0.0.1:15081/api/v1/culture | head -c 200 ; curl -sI http://127.0.0.1:15081/
./check-isolation.sh after            # phải giống hệt "before"
```

Tiêu chí: web trả `index.html`, `/api/v1/...` trả JSON, `docker stats` trong giới hạn, kiểm tra cô lập không có khác biệt.

# Pha 3 — nginx host + HTTPS + chạy thử (chủ máy chạy bước sudo)

1. Trỏ DNS `<domain-vietverse>` về `27.72.146.195`.
2. Chủ máy tạo `/etc/nginx/sites-available/vietverse.conf` (mình soạn sẵn nội dung, theo mẫu `booking.conf`: `proxy_pass http://127.0.0.1:15081`, `X-Forwarded-For`, `X-Forwarded-Proto`, `client_max_body_size 6m`), symlink sang `sites-enabled`, `sudo nginx -t && sudo systemctl reload nginx`.
3. `sudo certbot --nginx -d <domain-vietverse>`.
4. Chạy thử end-to-end trên DB seed: đăng nhập, Google sign-in (thêm origin mới vào Google Console), học/nộp bài, thu âm (Cloudinary), điểm/đổi quà, CMS, thanh toán test.
5. Đo TTFB trang chủ, `/api/v1/culture`, mở bài, nộp bài từ máy ở VN; so với Vercel `hkg1` + Atlas.
6. Kiểm 2 IP khác nhau ra 2 bucket rate limit.
7. `check-isolation.sh after`.

Tiêu chí: mọi luồng chạy, nhanh hơn phương án Vercel; các site khác không đổi.

# Pha 4 — Chuyển dữ liệu (cửa sổ bảo trì D4)

1. Xác nhận cluster production (D5). Backup Atlas đầy đủ (`mongodump --archive --gzip`), lưu trên máy chủ và nơi offsite (D6).
2. Bật chế độ bảo trì trên hệ cũ (tạm khóa ghi).
3. Dump lần cuối → `mongorestore --nsInclude 'vietverse.*'` vào `vietverse-mongo` → `deploy:indexes`.
4. Đối soát số document từng collection Atlas vs mới (khớp 100 %); kiểm `Child.viviPoints` = tổng `PointTransaction` trên mẫu ngẫu nhiên.

# Pha 5 — Chuyển traffic

1. Cập nhật Google OAuth authorized origins, webhook PayOS sang domain mới, `CLIENT_ORIGIN`.
2. Công bố domain mới; [QĐ] `vietverse-nine.vercel.app` chuyển thành redirect 301 sang domain mới (đổi `client/vercel.json`) để người dùng cũ không lạc.
3. Theo dõi 24–48 giờ: lỗi 5xx, thời gian phản hồi, RAM/CPU, disk.
4. Giữ Atlas + Vercel **không xóa** ít nhất 14 ngày.

**Rollback (≤ 5 phút):** gỡ redirect trên Vercel (deploy lại commit trước) để người dùng quay về Vercel + Atlas. Dữ liệu ghi trên máy mới sau thời điểm chuyển phải dump/restore ngược về Atlas theo runbook.

# Pha 6 — Vận hành

- Backup hằng ngày trong `~/vietverse/backups` (giữ 14 bản) + bản sao offsite; **thử restore mỗi tháng** vào project tạm `vietverse-restoretest` (xóa ngay sau khi kiểm, cũng chỉ bằng `-p vietverse-restoretest`).
- Giám sát uptime ngoài cho `https://<domain-vietverse>/healthz` (nginx web proxy tới `/health` của API).
- Cập nhật phiên bản: `git pull` trong `~/vietverse/app` → `./up.sh` (build image tag mới, `up -d`, xóa image `vietverse/*` cũ). Chạy `check-isolation.sh` trước/sau.
- Nâng Mongo theo lịch, luôn backup trước.
- Xoay vòng secret: đổi ngay mật khẩu DB/admin đã dán vào chat.

# Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Ảnh hưởng dự án khác | Chỉ 1 port localhost, 1 file nginx, network/volume/image riêng, giới hạn tài nguyên, cấm lệnh prune toàn cục, `check-isolation.sh` trước/sau mọi thay đổi |
| Máy chủ một node: hỏng ổ / mất điện | Backup ngày + offsite; Atlas giữ 14 ngày làm rollback |
| Mongo thiếu replica set → transaction lỗi | Bắt buộc `rs0`, test nộp bài/đổi quà ở Pha 3 |
| Mất CDN của Vercel | Người dùng chủ yếu ở VN; nginx web cache `/assets` 1 năm, gzip |
| Rate limit gộp IP | Pha 1 mục 5 + kiểm ở Pha 3 |
| Lộ secret | `.env` quyền 600, secret mới, Mongo/API không publish port |

# Câu hỏi còn mở

1. Domain cho Vietverse (D1)?
2. Giờ bảo trì để chuyển dữ liệu (D4)?
3. Cluster Atlas production là cluster nào (D5)?
4. Backup offsite để đâu (D6)?
5. Có giữ `vietverse-nine.vercel.app` làm redirect sang domain mới không?
