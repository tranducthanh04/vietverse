import { createServer } from 'vite';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
process.chdir('D:/ki9/codeDuAN/client');
const server = await createServer({ root: 'D:/ki9/codeDuAN/client', envFile: false, server: { host: '127.0.0.1', port: 5183, strictPort: true, hmr: false, watch: null } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext();
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1' || url.pathname.startsWith('/api/')) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:5183/', { waitUntil: 'domcontentloaded' });
    await page.getByText('Điều khoản dịch vụ', { exact: true }).waitFor();
    assert.equal(await page.getByText('Chưa khả dụng', { exact: true }).count(), 4);
    assert.equal(await page.getByText('Điều khoản dịch vụ', { exact: true }).evaluate(el => el.closest('li')?.className.includes('cursor-pointer')), false);
    assert.equal(await page.getByText('Bắt đầu khám phá với gói miễn phí', { exact: true }).count(), 1);
    await page.getByText('Điều khoản dịch vụ', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `D:/ki9/codeDuAN/plans/261012-qa-fixes/footer-${width}.png` });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.goto('http://127.0.0.1:5183/gia', { waitUntil: 'domcontentloaded' });
    await page.getByText('Kho truyện đồng dao và cổ tích', { exact: true }).waitFor();
    assert.equal(await page.getByText(/trọn đời|23 bài hát|7 ngày/).count(), 0);
    console.log(`PASS public footer/copy and no horizontal overflow: ${width}px`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS no browser pageerror; all backend/external requests blocked');
} finally {
  await browser?.close();
  await server.close();
}
