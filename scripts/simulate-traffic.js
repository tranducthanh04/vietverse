/**
 * Script giả lập traffic Google Analytics 4 (GA4) cho Vietverse
 * Tự động tạo 12 người dùng/ngày (hoặc số lượng tùy chọn) với:
 * - Client ID riêng biệt (tính là từng Unique User riêng)
 * - Thiết bị & Trình duyệt đa dạng (Windows Chrome, iPhone Safari, Android Chrome...)
 * - Lướt nhiều trang thực tế (Trang chủ, Kho truyện, Văn hóa, Bảng giá...)
 * - Thời lượng tương tác tự nhiên (1 - 3 phút/phiên)
 *
 * Chạy thử ngay: node scripts/simulate-traffic.js
 * Hoặc truyền số user: node scripts/simulate-traffic.js --users 12
 */

const GA_MEASUREMENT_ID = 'G-7L6JG4EL65';
const DOMAIN = 'https://vietverse.io.vn';

const USER_AGENTS = [
  // Chrome on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  // Safari on iPhone
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  // Chrome on Android
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  // Chrome on macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  // Edge on Windows
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
];

const PAGES = [
  { path: '/', title: 'VIETVERSE - Khám phá tiếng Việt diệu kỳ' },
  { path: '/kho-truyen', title: 'Kho truyện & Đồng dao - Vietverse' },
  { path: '/van-hoa', title: 'Khám phá Văn hóa Việt - Vietverse' },
  { path: '/gia', title: 'Gói thành viên & Học phí - Vietverse' },
  { path: '/dang-ky', title: 'Đăng ký tài khoản - Vietverse' },
  { path: '/dang-nhap', title: 'Đăng nhập - Vietverse' },
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Tạo Client ID giả lập (dạng Google Analytics chuẩn: xxxxxxxxxx.yyyyyyyyyy)
function generateClientId() {
  const randNum = Math.floor(Math.random() * 9000000000) + 1000000000;
  const timestamp = Math.floor(Date.now() / 1000) - randomBetween(3600, 86400 * 7);
  return `${randNum}.${timestamp}`;
}

async function sendHit(params, userAgent) {
  const searchParams = new URLSearchParams({
    v: '2',
    tid: GA_MEASUREMENT_ID,
    ul: 'vi-vn',
    sr: randomChoice(['1920x1080', '1536x864', '390x844', '412x915', '1440x900']),
    ...params,
  });

  const url = `https://www.google-analytics.com/g/collect?${searchParams.toString()}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    return res.status === 204;
  } catch (err) {
    return false;
  }
}

async function simulateSingleUser(index, total) {
  const cid = generateClientId();
  const sessionId = Math.floor(Date.now() / 1000);
  const userAgent = randomChoice(USER_AGENTS);

  // Mỗi user xem từ 2 đến 4 trang ngẫu nhiên
  const numPages = randomBetween(2, 4);
  const visited = [PAGES[0]]; // Luôn bắt đầu từ trang chủ
  for (let i = 1; i < numPages; i++) {
    const next = randomChoice(PAGES.slice(1));
    if (!visited.includes(next)) visited.push(next);
  }

  console.log(`[User ${index}/${total}] Bắt đầu phiên (CID: ...${cid.slice(-10)} | Thiết bị: ${userAgent.split(' ')[1] || 'Web'})`);

  for (let p = 0; p < visited.length; p++) {
    const page = visited[p];
    const isFirstPage = p === 0;
    const engagementMs = randomBetween(25000, 75000); // 25s - 75s mỗi trang

    // 1. Gửi page_view
    await sendHit(
      {
        cid,
        sid: sessionId,
        sct: '1',
        seg: '1',
        en: 'page_view',
        dl: `${DOMAIN}${page.path}`,
        dt: page.title,
        ...(isFirstPage ? { _ss: '1', _fv: '1' } : {}), // session_start & first_visit
      },
      userAgent
    );

    // 2. Gửi thời lượng tương tác user_engagement
    await sendHit(
      {
        cid,
        sid: sessionId,
        sct: '1',
        seg: '1',
        en: 'user_engagement',
        _et: engagementMs.toString(),
        dl: `${DOMAIN}${page.path}`,
        dt: page.title,
      },
      userAgent
    );

    // 3. Thi thoảng gửi thêm sự kiện click tương tác
    if (Math.random() > 0.4) {
      await sendHit(
        {
          cid,
          sid: sessionId,
          sct: '1',
          seg: '1',
          en: 'click',
          dl: `${DOMAIN}${page.path}`,
          dt: page.title,
        },
        userAgent
      );
    }

    console.log(`  -> Đã xem: ${page.path} (~${Math.round(engagementMs / 1000)}s tương tác)`);
    await sleep(randomBetween(500, 1500));
  }

  console.log(`[User ${index}/${total}] Hoàn thành phiên!`);
}

async function main() {
  const args = process.argv.slice(2);
  let userCount = 12; // Mặc định 12 user/ngày theo yêu cầu nhóm

  const userArgIndex = args.indexOf('--users');
  if (userArgIndex !== -1 && args[userArgIndex + 1]) {
    userCount = parseInt(args[userArgIndex + 1], 10) || 12;
  }

  console.log(`=======================================================`);
  console.log(`🚀 Bắt đầu giả lập ${userCount} người dùng cho Vietverse`);
  console.log(`🎯 Measurement ID: ${GA_MEASUREMENT_ID}`);
  console.log(`🌐 Domain: ${DOMAIN}`);
  console.log(`=======================================================\n`);

  for (let i = 1; i <= userCount; i++) {
    await simulateSingleUser(i, userCount);
    if (i < userCount) {
      const delay = randomBetween(1000, 3000);
      await sleep(delay);
    }
  }

  console.log(`\n🎉 Đã hoàn tất giả lập ${userCount} users!`);
  console.log(`👉 Bạn có thể kiểm tra tab Thời gian thực trên Google Analytics ngay.`);
}

main().catch(console.error);
