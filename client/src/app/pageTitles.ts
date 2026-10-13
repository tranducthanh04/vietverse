const SITE = 'VIETVERSE';

// Longest matching prefix wins; '/' only matches the home page exactly.
const TITLES: Array<[prefix: string, title: string]> = [
  ['/gia', 'Gói học & Bảng giá'],
  ['/dang-nhap', 'Đăng nhập'],
  ['/dang-ky', 'Đăng ký'],
  ['/kho-truyen', 'Kho truyện đồng dao'],
  ['/van-hoa', 'Khám phá văn hóa'],
  ['/thanh-toan', 'Thanh toán'],
  ['/thanh-toan-thu', 'Thanh toán thử'],
  ['/bat-dau', 'Thiết lập hồ sơ cho bé'],
  ['/hoc/', 'Bài học'],
  ['/kham-pha', 'Bản đồ 5 chặng'],
  ['/diem-thuong', 'Đổi quà'],
  ['/phong-bau-vat', 'Phòng báu vật'],
  ['/phu-huynh/tien-do', 'Tiến độ của bé'],
  ['/phu-huynh/ban-thu-am', 'Bản thu âm'],
  ['/phu-huynh/cai-dat', 'Cài đặt phụ huynh'],
  ['/phu-huynh/thanh-toan-thu', 'Thanh toán thử'],
  ['/admin/doanh-thu', 'Admin · Doanh thu'],
  ['/admin/bai-hoc', 'Admin · Bài học'],
  ['/admin/truyen', 'Admin · Truyện'],
  ['/admin/van-hoa', 'Admin · Văn hóa'],
  ['/admin/hoc-vien', 'Admin · Học viên'],
  ['/admin/doi-qua', 'Admin · Đổi quà'],
  ['/admin/quy-tac-diem', 'Admin · Quy tắc điểm'],
  ['/admin/test-thanh-toan', 'Admin · Test thanh toán'],
  ['/admin', 'Admin · Tổng quan'],
];

/** Tab title per route so screen readers announce page changes in the SPA. */
export function pageTitleFor(pathname: string): string {
  if (pathname === '/') return `${SITE} - Khám phá tiếng Việt diệu kỳ`;
  const match = TITLES
    .filter(([prefix]) => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return match ? `${match[1]} | ${SITE}` : `Không tìm thấy trang | ${SITE}`;
}
