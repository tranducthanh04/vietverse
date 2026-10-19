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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-footer-'));
const origin = 'http://127.0.0.1:5197';
const fixtureId = '/__footer-fixture.js';
const fixture = `
import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '/src/app/layouts/PublicLayout.tsx';
import { LandingPage } from '/src/features/public/LandingPage.tsx';
import { PricingPage } from '/src/features/public/PricingPage.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
useAuthStore.setState({ user: null, isLoading: false });
useUiLanguageStore.getState().setLanguage(localStorage.getItem('footer-language') || 'vi');
const h = React.createElement;
let router;
if (new URLSearchParams(location.search).has('delayed')) {
  const Delayed = lazy(() => new Promise(resolve => {
    window.releaseLanding = () => resolve({ default: LandingPage });
  }));
  router = createBrowserRouter([{ element: h(PublicLayout), children: [
    { path: '/', element: h(Suspense, { fallback: h('p', null, 'Waiting for Landing') }, h(Delayed)) },
    { path: '/gia', element: h(PricingPage) },
  ] }]);
} else {
  ({ router } = await import('/src/app/router.tsx'));
}
createRoot(document.getElementById('root')).render(h(RouterProvider, { router }));
window.footerRouter = router;
`;
process.chdir(root);
const server = await createServer({
  root, envFile: false,
  server: { host: '127.0.0.1', port: 5197, strictPort: true, hmr: false, watch: null },
  plugins: [{
    name: 'footer-navigation-regression',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!['/', '/gia'].includes(new URL(req.url, origin).pathname)) return next();
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
    if (url.origin !== origin || url.pathname.startsWith('/api/')) {
      unexpectedRequests.push(url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const nav = () => page.locator('footer ul').first().getByRole('link');
  const target = () => page.locator('#lo-trinh-hoc-tap');
  async function ready() {
    await nav().last().waitFor();
    assert(await page.evaluate(async () => {
      const loaded = await document.fonts.load('700 16px "Be Vietnam Pro"', 'Lộ trình học tập Courses');
      await document.fonts.ready;
      return loaded.length > 0 && loaded.every(font => font.status === 'loaded');
    }), 'Real Vietnamese font must load');
  }
  async function checkTarget() {
    try {
      await page.waitForFunction(() => document.activeElement?.id === 'lo-trinh-hoc-tap');
    } catch (error) {
      console.error('Target diagnostic', await page.evaluate(() => ({
        url: location.href, focus: document.activeElement?.outerHTML,
        target: document.getElementById('lo-trinh-hoc-tap')?.outerHTML,
        router: window.footerRouter.state.location,
        navigation: window.footerRouter.state.navigation,
      })));
      await page.screenshot({ path: resolve(shots, 'target-failure.png') });
      throw error;
    }
    const geometry = await target().evaluate(el => ({
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
      headerBottom: document.querySelector('header').getBoundingClientRect().bottom,
      stages: el.closest('section').querySelectorAll('h3').length,
      viewport: innerHeight,
    }));
    assert.equal(geometry.stages, 5);
    assert(geometry.top >= geometry.headerBottom && geometry.bottom <= geometry.viewport, JSON.stringify(geometry));
    assert.equal(new URL(page.url()).hash, '#lo-trinh-hoc-tap');
  }
  async function activate(link, method) {
    if (method === 'click') return link.click();
    for (let tabs = 0; tabs < 50 && !(await link.evaluate(el => el === document.activeElement)); tabs++) {
      await page.keyboard.press('Tab');
    }
    assert(await link.evaluate(el => el === document.activeElement && el.matches(':focus-visible')));
    await page.keyboard.press('Enter');
  }
  for (const language of ['vi', 'en']) {
    await page.goto(origin);
    await page.evaluate(lang => localStorage.setItem('footer-language', lang), language);
    const roadmapName = language === 'vi' ? 'Lộ trình học tập' : 'Learning roadmap';
    const courseName = language === 'vi' ? 'Khóa học' : 'Courses';
    const roadmapLink = () => page.getByRole('contentinfo').getByRole('link', { name: roadmapName, exact: true });
    const courseLink = () => page.getByRole('contentinfo').getByRole('link', { name: courseName, exact: true });
    for (const width of [320, 640, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      await ready();
      assert.deepEqual(await nav().evaluateAll(links => links.map(link => link.getAttribute('href'))), [
        '/', '/kham-pha', '/#lo-trinh-hoc-tap', '/gia', '/kho-truyen', '/van-hoa',
      ]);
      let previousBottom = -Infinity;
      for (const link of await nav().all()) {
        const bounds = await link.boundingBox();
        assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.height >= 44);
        assert(bounds.y >= previousBottom - 1, 'Footer links must not overlap');
        previousBottom = bounds.y + bounds.height;
        assert(await link.evaluate(el => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const box = el.getBoundingClientRect();
          return [...range.getClientRects()].every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1 && rect.bottom <= box.bottom + 1);
        }), 'Full link text stays inside its target');
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await roadmapLink().scrollIntoViewIfNeeded();
      await page.screenshot({ path: resolve(shots, `${language}-${width}-footer.png`) });
      for (const method of ['click', 'keyboard']) {
        for (const source of ['/', '/gia']) {
          await page.goto(origin + source);
          await ready();
          await activate(roadmapLink(), method);
          await checkTarget();
        }
        await page.goto(origin);
        await ready();
        await activate(courseLink(), method);
        await page.waitForURL('**/gia');
        await page.getByText('250.000đ', { exact: true }).waitFor();
      }
      await page.goto(origin + '/#lo-trinh-hoc-tap');
      await ready();
      await checkTarget();
      await page.reload();
      await ready();
      await checkTarget();
      await page.screenshot({ path: resolve(shots, `${language}-${width}-roadmap.png`) });
      await roadmapLink().click();
      await checkTarget();
      await courseLink().click();
      await page.waitForURL('**/gia');
      // History acceptance starts from a rendered page, not only a changed address bar.
      await page.getByText('250.000đ', { exact: true }).waitFor();
      await page.goBack();
      await checkTarget();
      await page.goForward();
      await page.waitForURL('**/gia');
      await page.getByText('250.000đ', { exact: true }).waitFor();
      if (width < 1280) {
        for (const source of ['/', '/#lo-trinh-hoc-tap']) {
          await page.goto(origin + source);
          await ready();
          await roadmapLink().scrollIntoViewIfNeeded();
          const menu = page.getByRole('button', { name: language === 'vi' ? 'Mở menu điều hướng' : 'Open navigation menu' });
          await menu.click();
          await roadmapLink().click();
          await page.waitForFunction(() => document.querySelector('header button[aria-expanded]')?.getAttribute('aria-expanded') === 'false');
          await checkTarget();
        }
      }
      // A cold unknown fragment starts at the top; same-document fragments preserve position.
      await page.goto(origin + '/gia');
      await ready();
      await page.goto(origin + '/#unknown');
      await ready();
      assert(await page.evaluate(() => document.activeElement?.id !== 'lo-trinh-hoc-tap' && scrollY === 0));
      await courseLink().focus();
      const beforeUnknown = await page.evaluate(() => scrollY);
      await page.goto(origin + '/#another-unknown');
      assert(await courseLink().evaluate(el => document.activeElement === el));
      assert.equal(await page.evaluate(() => scrollY), beforeUnknown);
      await page.goto(origin + '/?delayed=1#lo-trinh-hoc-tap');
      await page.getByText('Waiting for Landing', { exact: true }).waitFor();
      assert.equal(await target().count(), 0);
      await ready();
      await page.evaluate(() => window.releaseLanding());
      await checkTarget();
      console.log(`PASS ${language} ${width}px: 6 link geometry, 6 click/Tab+Enter navigations, direct/reload/repeat/history/unknown/delayed, mobile expanded-menu`);
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpectedRequests, []);
  console.log(`PASS 6 locale/viewport combinations; screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
