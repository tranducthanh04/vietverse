import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = resolve('client');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-landing-cta-'));
const fixtureId = '/__landing-cta-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { LandingPage } from '/src/features/public/LandingPage.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
const params = new URLSearchParams(location.search);
useUiLanguageStore.getState().setLanguage(params.get('language'));
useAuthStore.setState({ isLoading: false, user: params.get('session') === 'parent'
  ? { id: 'cta-parent', email: 'cta@example.test', displayName: 'QA Parent', role: 'parent' } : null });
const h = React.createElement;
function Destination() { return h('h1', null, useLocation().pathname); }
createRoot(document.getElementById('root')).render(h(MemoryRouter, null, h(Routes, null,
  h(Route, { path: '/', element: h(LandingPage) }),
  ...['/dang-ky', '/dang-nhap'].map(path => h(Route, { key: path, path, element: h(Destination) })),
  ...['/bat-dau', '/kham-pha'].map(path => h(Route, { key: path, path,
    element: h(ProtectedRoute, null, h(Destination)) }))
)));
`;
process.chdir(root);
const server = await createServer({
  root, envFile: false,
  server: { host: '127.0.0.1', port: 5195, strictPort: true, hmr: false, watch: null },
  plugins: [{
    name: 'landing-cta-regression',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__landing-cta?')) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
      });
    },
  }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const unexpectedRequests = [];
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
    if (url.origin !== 'http://127.0.0.1:5195' || url.pathname.startsWith('/api/')) {
      unexpectedRequests.push(url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const language of ['vi', 'en']) {
    const labels = language === 'vi'
      ? ['BẮT ĐẦU KHÁM PHÁ', 'KHÁM PHÁ BÁU VẬT NƯỚC NAM', 'BẮT ĐẦU KHÁM PHÁ NGAY']
      : ['START EXPLORING', 'EXPLORE THE TREASURE OF VIETNAM', 'START EXPLORING NOW'];
    for (const width of [320, 640, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      for (const session of ['guest', 'parent']) {
        for (const [index, label] of labels.entries()) {
          for (const method of ['click', 'keyboard']) {
            await page.goto(`http://127.0.0.1:5195/__landing-cta?language=${language}&session=${session}`);
            const cta = page.getByRole('button', { name: label, exact: true });
            await cta.waitFor();
            await page.evaluate(() => document.fonts.ready);
            assert(await page.evaluate(() => [...document.fonts].some(font => font.status === 'loaded')));
            await cta.scrollIntoViewIfNeeded();
            const box = await cta.boundingBox();
            assert(box && box.x >= 0 && box.x + box.width <= width + 1 && box.height >= 44);
            assert(await cta.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
            if (method === 'keyboard') {
              for (let tabs = 0; tabs < 12 && !(await cta.evaluate(el => el === document.activeElement)); tabs++) {
                await page.keyboard.press('Tab');
              }
              assert(await cta.evaluate(el => el === document.activeElement && el.matches(':focus-visible')));
              if (session === 'guest' && index === 2 && width !== 640) {
                await page.screenshot({ path: resolve(shots, `${language}-${width}-final.png`) });
              }
              await page.keyboard.press('Enter');
            } else {
              await cta.click();
            }
            const destination = session === 'guest' ? '/dang-ky' : index === 1 ? '/kham-pha' : '/bat-dau';
            await page.getByRole('heading', { name: destination, exact: true }).waitFor();
          }
        }
        console.log(`PASS ${language} ${width}px ${session}: 3 CTAs, click + Tab/Enter, bounds and destinations`);
      }
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpectedRequests, []);
  console.log(`PASS 72 navigations; screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
