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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-public-header-'));
const fixtureId = '/__public-header-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicLayout } from '/src/app/layouts/PublicLayout.tsx';
import { LoginPage } from '/src/features/auth/LoginPage.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
const params = new URLSearchParams(location.search);
useUiLanguageStore.getState().setLanguage('en');
useAuthStore.setState({ user: params.get('signedIn') === 'true'
  ? { id: 'local-parent', email: 'parent@example.test', displayName: 'Parent', role: 'parent' } : null, isLoading: false });
createRoot(document.getElementById('root')).render(
  React.createElement(QueryClientProvider, { client: new QueryClient() },
    React.createElement(MemoryRouter, { initialEntries: ['/dang-nhap'] },
      React.createElement(Routes, null,
        React.createElement(Route, { element: React.createElement(PublicLayout) },
          React.createElement(Route, { path: '*', element: React.createElement(LoginPage) }))))));
`;
process.chdir(root);
const server = await createServer({
  root, envFile: false,
  server: { host: '127.0.0.1', port: 5191, strictPort: true, hmr: false, watch: null },
  plugins: [{
    name: 'public-header-regression',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__public-header?')) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
      });
    },
  }],
});
let browser;
const failures = [];
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('**/api/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { enabled: false } }) }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const signedIn of [false, true]) {
    for (const width of [1536, 1920, 1600, 1535, 1280, 1366, 1279, 1024, 1023, 768, 767, 640, 639, 390, 360, 359, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`http://127.0.0.1:5191/__public-header?signedIn=${signedIn}`);
      const header = page.getByRole('banner');
      await header.getByRole('button', { name: 'Show the interface in Vietnamese' }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => [...document.fonts].some(font => font.family.includes('Be Vietnam Pro') && font.status === 'loaded')
        && document.fonts.check('700 14px "Be Vietnam Pro"')), 'Production font must load');
      for (const language of ['en', 'vi']) {
        if (language === 'vi') await header.getByRole('button', { name: 'Show the interface in Vietnamese' }).click();
        const label = `${signedIn ? 'parent' : 'guest'} ${language} ${width}px`;
        const measure = await header.evaluate(el => {
          const row = el.firstElementChild;
          const rect = row.getBoundingClientRect();
          const controls = [...el.querySelectorAll('a,button')].filter(node => node.getClientRects().length);
          const out = controls.filter(node => {
            const r = node.getBoundingClientRect();
            return r.left < -1 || r.right > document.documentElement.clientWidth + 1;
          }).map(node => node.textContent.trim());
          const overlap = controls.some((a, i) => controls.slice(i + 1).some(b => {
            const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
            return Math.min(ar.right, br.right) - Math.max(ar.left, br.left) > 1 && Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top) > 1;
          }));
          return { out, overlap, rowOverflow: row.scrollWidth > row.clientWidth + 1, pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
            rowWidth: rect.width, scrollWidth: row.scrollWidth };
        });
        if (width === 1536 || width === 320) await page.screenshot({ path: resolve(shots, `${signedIn ? 'parent' : 'guest'}-${language}-${width}.png`) });
        if (measure.out.length || measure.overlap || measure.rowOverflow || measure.pageOverflow) {
          failures.push(`${label}: ${JSON.stringify(measure)}`);
          console.log(`FAIL ${failures.at(-1)}`);
        }
        else console.log(`PASS ${label}: controls fit without overlap`);
        const menu = header.getByRole('button', { name: language === 'vi' ? 'Mở menu điều hướng' : 'Open navigation menu', exact: true });
        if (await menu.isVisible()) {
          await menu.click();
          assert.equal(await header.locator('nav:visible a').count(), 5, `${label}: five navigation links`);
          const action = header.getByRole('button', { name: signedIn
            ? (language === 'vi' ? 'Vào học ngay' : 'Start learning')
            : (language === 'vi' ? 'Đăng ký' : 'Sign up'), exact: true }).last();
          assert(await action.isVisible(), `${label}: account action remains reachable in menu`);
          await header.locator('nav:visible a').nth(language === 'en' ? 0 : 1).click();
          assert.equal(await menu.getAttribute('aria-expanded'), 'false', `${label}: navigation closes menu`);
        } else assert.equal(await header.locator('nav:visible a').count(), 5, `${label}: five desktop navigation links`);
        for (const short of ['VI', 'EN']) {
          const box = await header.getByRole('button').filter({ hasText: new RegExp(`^${short}$`) }).boundingBox();
          assert(box && box.width >= 44 && box.height >= 44, `${label}: ${short} touch target`);
        }
        if (language === 'vi') {
          await header.getByRole('button', { name: 'Hiển thị giao diện bằng tiếng Anh' }).focus();
          await page.keyboard.press('Enter');
          assert.equal(await page.evaluate(() => localStorage.getItem('vietverse_ui_language')), 'en', `${label}: keyboard language choice persists`);
        }
      }
    }
  }
  console.log(`Screenshots: ${shots}`);
  assert.deepEqual(errors, [], 'No browser runtime errors');
  assert.deepEqual(failures, [], 'Header must contain all controls in both languages');
} finally {
  await browser?.close();
  await server.close();
}
