# 🇻🇳 VIETVERSE — Nền Tảng Học Tiếng Việt Tương Tác Cho Trẻ Em (5–8 Tuổi)

> **VIETVERSE** là nền tảng học tiếng Việt đa giác quan, kết hợp bản đồ khám phá 5 chặng, kho đồng dao - truyện cổ tích karaoke, góc văn hóa truyền thống và cơ chế thưởng điểm ViVi Points an toàn, tích cực dành cho trẻ em 5–8 tuổi.

---

## 📑 Mục Lục
1. [Công Nghệ & Kiến Trúc Monorepo](#1-công-nghệ--kiến-trúc-monorepo)
2. [Cài Đặt & Chạy Ở Local (3 Bước)](#2-cài-đặt--chạy-ở-local-3-bước)
3. [Tài Khoản & Dữ Liệu Demo](#3-tài-khoản--dữ-liệu-demo)
4. [Quy Tắc Điểm & Nghiệp Vụ Cốt Lõi](#4-quy-tắc-điểm--nghiệp-vụ-cốt-lõi)
5. [Hướng Dẫn Deploy Production Từng Bước](#5-hướng-dẫn-deploy-production-từng-bước)
   - [Bước 1: MongoDB Atlas (M0 Free Cluster)](#bước-1-mongodb-atlas-m0-free-cluster)
   - [Bước 2: Render.com (Backend Web Service)](#bước-2-rendercom-backend-web-service)
   - [Bước 3: Vercel (Frontend React App)](#bước-3-vercel-frontend-react-app)
   - [Thứ Tự & Bảng Biến Môi Trường Cần Điền](#thứ-tự--bảng-biến-môi-trường-cần-điền)
6. [Quản Lý Tệp Ghi Âm & Thay Thế Audio Thật](#6-quản-lý-tệp-ghi-âm--thay-thế-audio-thật)
7. [Kiểm Thử (Test Suite)](#7-kiểm-thử-test-suite)
8. [Lệnh Đẩy Code Lên GitHub](#8-lệnh-đẩy-code-lên-github)

---

## 1. Công Nghệ & Kiến Trúc Monorepo

```text
vietverse/
├── client/                     # Frontend: React 18 + Vite + TypeScript + TailwindCSS + TanStack Query + Zustand
│   ├── src/
│   │   ├── app/                # router, layouts (PublicLayout, KidsLayout, ParentLayout, AdminLayout)
│   │   ├── features/           # auth, onboarding, quest-map, lesson-player, stories, culture, points, parent, admin
│   │   ├── components/ui/      # Button, Card, Modal, ProgressBar, AudioButton, Mascot, VictoryModal...
│   │   ├── lib/                # api client (Axios), useAudioRecorder (MediaRecorder), utils
│   │   ├── store/              # zustand (authStore, childStore, lessonSessionStore idb-keyval)
│   │   └── locales/vi.ts       # Từ điển giao diện Tiếng Việt có dấu tập trung (không hardcode rải rác)
│   ├── vercel.json             # Cấu hình SPA rewrite + proxy /api/* sang Render
│   └── .env.example
├── server/                     # Backend: Node.js 20 + Express + TypeScript + Mongoose + Zod + JWT + Pino
│   ├── src/
│   │   ├── config/             # Zod validated env, MongoDB connection
│   │   ├── models/             # Mongoose schemas (User, Child, Stage, Lesson, Progress, Recording, PointTransaction...)
│   │   ├── modules/            # auth, children, stages, lessons, recordings, stories, culture, points, parent, admin
│   │   ├── middlewares/        # auth, role guard, rate limit, error handler
│   │   ├── services/           # StorageService abstraction (Cloudinary + Local/DataURI Fallback)
│   │   ├── seeds/              # Seed script (5 Stage, 20 Lesson, 5 Story, 3 Culture, 5 ShopItem, Demo Users)
│   │   └── server.ts / app.ts
│   └── .env.example
├── render.yaml                 # Infrastructure as Code Blueprint cho Render Web Service
├── .github/workflows/ci.yml    # CI: Typecheck + Tests + Build cho cả client và server
└── package.json                # npm workspaces root orchestration
```

---

## 2. Cài Đặt & Chạy Ở Local (3 Bước)

### Yêu cầu hệ thống:
- **Node.js**: phiên bản `>= 20.0.0`
- **MongoDB**: Đã cài đặt dịch vụ MongoDB cục bộ (port 27017) HOẶC chuỗi kết nối MongoDB Atlas.

### Bước 1: Cài đặt dependencies toàn monorepo
Tại thư mục gốc của dự án, chạy:
```bash
npm install
```

### Bước 2: Khởi tạo dữ liệu mẫu (Seed Data)
Đảm bảo file `server/.env` đã có chuỗi `MONGODB_URI` hợp lệ, sau đó chạy:
```bash
npm run seed
```
*Script sẽ nạp 5 chặng, 20 bài học (bài 1–4 đầy đủ hoạt động mẫu), 5 bài đồng dao/truyện cổ tích có lời karaoke, 3 bài văn hóa, 5 vật phẩm đổi quà, cùng tài khoản demo Admin và Phụ huynh.*

### Bước 3: Khởi động cả Frontend & Backend đồng thời
```bash
npm run dev
```
- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 3. Tài Khoản & Dữ Liệu Demo

Hệ thống đã có sẵn 2 tài khoản demo được nạp sẵn từ seed:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Phụ huynh (Demo)** | `phuhuynh@vietverse.edu.vn` | `ParentPass123!` | Đã có sẵn hồ sơ **Bé An** (45 ViVi Points) |
| **Quản trị viên (Admin)** | `admin@vietverse.edu.vn` | `AdminPass123!` | Toàn quyền xem KPI, học viên, duyệt đổi quà |

*Mã giải toán Cổng Phụ Huynh:* Khi click vào "Góc Phụ Huynh", hệ thống sẽ hiển thị một phép tính nhân ngẫu nhiên (ví dụ `7 × 8 = ?`). Bạn chỉ cần nhập kết quả đúng (`56`) để mở khóa phiên làm việc 15 phút.

---

## 4. Quy Tắc Điểm & Nghiệp Vụ Cốt Lõi

Điểm **ViVi Points** được quản lý tập trung và an toàn qua bảng `PointTransaction`:
- **Hoàn thành bài học**: `+10 Points` (chỉ cộng 1 lần duy nhất cho mỗi bài học, chống cộng trùng lặp - idempotent).
- **Đố vui bài viết văn hóa**: `+5 Points` (cộng khi trả lời đúng toàn bộ câu hỏi trắc nghiệm).
- **Hoàn thành toàn bộ một Chặng**: `+20 Points`.
- **Chinh phục Báu vật Nước Nam (Bài 20)**: `+50 Points`.
- **Đổi quà (Shop Redeem)**: Trừ điểm nguyên tử (`atomic update`), không thể đổi nếu số dư nhỏ hơn chi phí quà, chống số dư âm.
- **Đánh giá năng lực Góc Phụ Huynh**: Tính toán phần trăm trải nghiệm 4 nhóm năng lực cốt lõi (*Nghe hiểu*, *Nói & Giao tiếp*, *Nhận diện mặt chữ*, *Tư duy & Văn hóa*) với nhãn trạng thái `"Đã khám phá"`, `"Đang luyện tập"`, `"Chưa bắt đầu"` — **tuyệt đối không chấm điểm 7/10 hay xếp hạng so sánh giữa các bé**.

---

## 5. Hướng Dẫn Deploy Production Từng Bước

### Bước 1: MongoDB Atlas (M0 Free Cluster)
1. Truy cập [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) và tạo tài khoản.
2. Chọn **Create a deployment** -> chọn gói **M0 Free (Shared)** -> chọn khu vực gần Việt Nam (như Singapore `ap-southeast-1`).
3. Tạo **Database User**: ví dụ username `vietverse_user`, password `SecurePassword2026`.
4. Cấu hình **Network Access**: Chọn **Add IP Address** -> Chọn **Allow Access from Anywhere (`0.0.0.0/0`)** để các server Render có thể kết nối được.
5. Lấy chuỗi kết nối: Vào **Database** -> **Connect** -> **Drivers (Node.js)** -> copy chuỗi URI dạng:
   ```text
   mongodb+srv://vietverse_user:SecurePassword2026@cluster0.xxxxx.mongodb.net/vietverse?retryWrites=true&w=majority
   ```

### Bước 2: Render.com (Backend Web Service)
1. Đăng ký tài khoản tại [render.com](https://render.com).
2. Tạo mới: Chọn **New** -> **Web Service** -> liên kết với kho lưu trữ GitHub `vietverse`.
3. Điền các thiết lập:
   - **Root Directory**: `server`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Khai báo các **Environment Variables** trên Render:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: *<Chuỗi URI lấy ở Bước 1>*
   - `JWT_SECRET`: *<Chuỗi ký tự ngẫu nhiên dài trên 32 ký tự>*
   - `JWT_REFRESH_SECRET`: *<Chuỗi ký tự ngẫu nhiên dài trên 32 ký tự>*
   - `CLIENT_ORIGIN`: `https://vietverse.vercel.app` *(hoặc URL domain Vercel của bạn)*
   - `CLOUDINARY_CLOUD_NAME`: *<Tên Cloudinary nếu có>*
   - `CLOUDINARY_API_KEY`: *<Key Cloudinary>*
   - `CLOUDINARY_API_SECRET`: *<Secret Cloudinary>*
5. Bấm **Create Web Service**. Khi deploy xong, copy URL backend: `https://vietverse-api.onrender.com`.

> 💡 **Lưu ý về Cold Start của Render Free Tier:**
> Gói free của Render sẽ ngủ sau 15 phút không có request. Lần gọi đầu tiên có thể mất ~30 giây để thức dậy. Có thể sử dụng các dịch vụ ping định kỳ miễn phí (như UptimeRobot hoặc Cron-job.org) ping vào endpoint `/health` mỗi 10 phút một lần để giữ máy chủ luôn sẵn sàng.

### Bước 3: Vercel (Frontend React App)
1. Đăng ký tài khoản tại [vercel.com](https://vercel.com).
2. Chọn **Add New Project** -> Import repo `vietverse`.
3. Cấu hình Project:
   - **Root Directory**: Chọn `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Thêm biến môi trường:
   - `VITE_API_URL`: `/api/v1` *(Vercel sẽ tự động rewrite proxy sang Render theo cấu hình `vercel.json`)*
5. Trong file `client/vercel.json`, cập nhật URL Render thật của bạn:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://vietverse-api.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
6. Bấm **Deploy**. Sau khi hoàn tất, Vercel sẽ cấp domain chính thức (ví dụ: `https://vietverse.vercel.app`).

### Thứ Tự & Bảng Biến Môi Trường Cần Điền

| Nền tảng | Biến môi trường | Mục đích / Giá trị mẫu |
| :--- | :--- | :--- |
| **MongoDB Atlas** | Database Access | Tạo user & cấp quyền Read/Write Any Database |
| **Render (Server)** | `NODE_ENV` | `production` |
| | `PORT` | `5000` |
| | `MONGODB_URI` | `mongodb+srv://<user>:<pass>@...` |
| | `JWT_SECRET` | Khóa mã hóa Access Token (15 phút) |
| | `JWT_REFRESH_SECRET` | Khóa mã hóa Refresh Token (7 ngày) |
| | `CLIENT_ORIGIN` | URL Vercel của bạn |
| | `CLOUDINARY_*` | API Cloudinary lưu file âm thanh ghi âm bé |
| **Vercel (Client)** | `VITE_API_URL` | `/api/v1` (Proxy qua Render) |

---

## 6. Quản Lý Tệp Ghi Âm & Thay Thế Audio Thật

- **Lưu trữ ghi âm của bé**: Hệ thống cung cấp tầng trừu tượng `StorageService`.
  - Trong môi trường **Production**: Khi cấu hình các khóa `CLOUDINARY_*`, các bản thu âm của bé sẽ tự động được truyền tải và lưu an toàn trên Cloudinary.
  - Trong môi trường **Local/Offline**: Nếu chưa có Cloudinary keys, hệ thống tự động kích hoạt `FallbackDataUriStorageService` (lưu trữ dạng DataURI base64) giúp quy trình thu âm, nghe lại và lưu vào DB hoạt động trơn tru 100% mà không bị gián đoạn.
- **Thay thế file âm thanh & hình ảnh mẫu**:
  - File tĩnh (ảnh minh họa, logo): Đặt trong `client/public/`.
  - Giọng phát âm mẫu: Đã tích hợp bộ phát âm chuẩn tiếng Việt tự động thông qua Web Speech Synthesis API (`AudioButton.tsx`), tự động phát âm chuẩn từng từ tiếng Việt ngay cả khi không có file MP3 đính kèm.

---

## 7. Kiểm Thử (Test Suite)

Dự án bao gồm bộ kiểm thử tự động toàn diện (15 unit & integration tests) sử dụng **Vitest** và in-memory MongoDB:
```bash
# Chạy toàn bộ test suite monorepo
npm run test

# Kiểm tra kiểu dữ liệu TypeScript không lỗi
npm run typecheck

# Build kiểm tra sản phẩm hoàn chỉnh
npm run build
```

Các ca kiểm thử trọng tâm đã được xác minh:
1. `activityRegistry.test.ts`: Đảm bảo 7 hoạt động bài học ánh xạ chính xác.
2. `utils.test.ts`: Định dạng số phân tách hàng nghìn chuẩn Tiếng Việt.
3. `childStore.test.ts`: Đồng bộ điểm ViVi Points tức thì trên giao diện bé.
4. `auth.test.ts`: Đăng ký, đăng nhập JWT, cookie bảo mật httpOnly, chặn email trùng (409).
5. `lessons.test.ts`: Hoàn thành bài học nhận +10 điểm, tính sao chuẩn xác và **tính bất biến (idempotent) không cộng điểm trùng khi học lại**.
6. `points.test.ts`: Đổi quà bảo đảm nguyên tử (`atomic`), chặn đổi khi số dư không đủ (chống điểm âm).
7. `children.test.ts`: Cách ly dữ liệu chặt chẽ — phụ huynh chỉ được truy cập hồ sơ của con mình.
8. `health.test.ts`: Endpoint `/health` hoạt động ổn định cho Render.

---

## 8. Lệnh Đẩy Code Lên GitHub

Kho lưu trữ đã được khởi tạo và commit đầy đủ lịch sử theo chuẩn **Conventional Commits**. Để đẩy code lên tài khoản GitHub của bạn (`tranducthanh04`), hãy chạy lần lượt các lệnh sau:

```bash
git remote add origin https://github.com/tranducthanh04/vietverse.git
git branch -M main
git push -u origin main
```
