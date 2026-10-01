# 04 — Kiến trúc hệ thống

## Monorepo

```text
client/  React 18 + Vite + TypeScript + Tailwind + React Query + Zustand
server/  Node 20 + Express + TypeScript + Mongoose + Zod + JWT + Pino
MongoDB  User, Child, Stage, Lesson, Progress, Recording, Points, Shop, Redemption...
```

## Frontend

- `client/src/app/router.tsx`: route tree và guard.
- Layouts: public, kids, parent, admin.
- Feature folders chứa màn hình theo nghiệp vụ.
- `authStore` giữ access token trong memory; refresh token ở httpOnly cookie.
- `childStore` giữ danh sách và active child.
- `lessonSessionStore` lưu session lesson ở IndexedDB để resume.
- React Query dùng cho dữ liệu server; cần invalidation sau mutation để tránh stale state.

## Backend

- `app.ts` gắn security middleware, CORS, rate limit, route và error handler.
- Module theo domain: auth, children, stages, lessons, recordings, stories, culture, points, parent, admin.
- Controller parse input và gọi service.
- Service thực hiện nghiệp vụ và truy cập model.
- Zod hiện có ở auth, children, lesson complete; các module khác còn payload tự do.
- `PointTransaction` là sổ cái điểm; `Child.viviPoints` là số dư đọc nhanh.

## Auth và authorization

- Access token JWT hết hạn 15 phút.
- Refresh token JWT 7 ngày trong cookie httpOnly.
- API đọc Bearer token hoặc cookie access token nếu có.
- Admin API dùng `authMiddleware` + `requireRole(admin)`.
- Các route parent/child xác định ownership bằng `req.user.id` và `child.parentId`.
- CORS callback hiện cho phép cả origin không nằm trong allowlist; cần siết khi production.

## Storage audio

- Có abstraction `IStorageService`.
- Production có thể dùng Cloudinary.
- Local/dev fallback lưu Data URI trực tiếp trong MongoDB.
- Fallback phù hợp demo nhỏ, không phù hợp lưu trữ production lâu dài vì phình dữ liệu và khó CDN/retention.

## Deploy và môi trường

- Client: Vercel/Vite, proxy `/api`.
- Vercel project dùng `client` làm Root Directory, build bằng `npm run build` và phát hành thư mục `dist`.
- GitHub integration tự động deploy: push vào `main` tạo production deployment; push các branch khác hoặc mở Pull Request tạo preview deployment và bình luận vào PR.
- Server: Render, health `/health`.
- Database: MongoDB local hoặc Atlas.
- Env được validate bằng Zod nhưng có default secret; production phải bắt buộc secret ngoài default.

## Nguyên tắc thay đổi

- Giữ ownership check ở service, không chỉ ở UI.
- Giữ idempotency key và transaction boundary gần nơi ghi sổ cái.
- Không đưa dữ liệu đáp án đúng ra client nếu server cần chấm độc lập cho nội dung có giá trị.
- Mọi thay đổi schema phải có migration/seed compatibility và cập nhật API contract.

