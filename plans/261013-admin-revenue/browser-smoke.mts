import { createServer } from 'vite';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
process.chdir('D:/ki9/codeDuAN/client');
const server = await createServer({ root: 'D:/ki9/codeDuAN/client', envFile: false, server: { host: '127.0.0.1', port: 5184, strictPort: true, hmr: false, watch: null } });
const report = {
  currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', from: null, to: null,
  totalRevenue: 1240000, paidOrders: 2, currentMonth: '2026-10', currentMonthRevenue: 1240000, undatedOrders: 0,
  byPlan: { monthly: { orders: 1, revenue: 250000 }, yearly: { orders: 1, revenue: 990000 } },
  series: [{ month: '2026-10', orders: 2, revenue: 1240000 }],
};
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    if (url.pathname === '/api/v1/auth/me') return route.fulfill({ json: { data: { user: { id: 'fixture-admin', role: 'admin', email: 'fixture@example.test', displayName: 'QA fixture - not production' }, subscription: { plan: 'free', maxChildren: 1 } } } });
    if (url.pathname === '/api/v1/admin/revenue' && route.request().method() === 'GET') return route.fulfill({ json: { data: { ...report, from: url.searchParams.get('from'), to: url.searchParams.get('to') } } });
    if (url.pathname.startsWith('/api/')) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:5184/admin/doanh-thu', { waitUntil: 'domcontentloaded' });
    await page.getByRole('table', { name: 'Doanh thu theo tháng' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Doanh thu', exact: true }).count(), 1);
    await page.getByLabel('Từ ngày').fill('2026-10-01');
    await page.getByLabel('Đến ngày').fill('2026-10-13');
    await page.getByRole('button', { name: 'Áp dụng', exact: true }).click();
    await page.getByText('Kỳ đang xem: 2026-10-01 → 2026-10-13', { exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `C:/Users/Asus/.codex/visualizations/2026/10/12/01a12ffb-4a1d-7c70-8cbb-0f69226e0302/revenue-${width}.png`, fullPage: true });
    console.log(`PASS revenue route, date filters, no overflow: ${width}px (fixture API only)`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS no pageerror; no production data or requests');
} finally {
  await browser?.close();
  await server.close();
}
