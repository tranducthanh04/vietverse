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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-cover-fallback-'));
const cover = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#e4b35a"/><circle cx="200" cy="150" r="70" fill="#2c716c"/></svg>')}`;
const stories = [
  { _id: 'story-legacy', type: 'constructor', title: 'Legacy story' },
  { _id: 'story-known', type: 'dong_dao', title: 'Known story' },
  { _id: 'story-covered', type: 'constructor', title: 'Covered story', coverImage: cover },
].map(item => ({ ...item, description: 'Local cover regression fixture.', author: 'QA', lyrics: [{ timeSec: 0, text: 'A short reading fixture.' }], vocab: [], quiz: [], durationSec: 0 }));
const articles = [
  { _id: 'culture-legacy', category: 'constructor', title: 'Legacy culture' },
  { _id: 'culture-known', category: 'tet', title: 'Known culture' },
  { _id: 'culture-covered', category: 'constructor', title: 'Covered culture', coverImage: cover },
].map(item => ({ ...item, intro: 'Local cover regression fixture.', funFacts: ['A short local fact.'], quiz: [] }));
const domains = [
  { kind: 'story', route: '/kho-truyen', api: '/stories', items: stories, icons: ['book-open', 'music'] },
  { kind: 'culture', route: '/van-hoa', api: '/culture', items: articles, icons: ['compass', 'gift'] },
];
const fixtureId = '/__cover-fallback-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdaptiveContentLayout } from '/src/app/layouts/AdaptiveContentLayout.tsx';
import { StoriesPage } from '/src/features/stories/StoriesPage.tsx';
import { StoryDetailPage } from '/src/features/stories/StoryDetailPage.tsx';
import { CulturePage } from '/src/features/culture/CulturePage.tsx';
import { CultureDetailPage } from '/src/features/culture/CultureDetailPage.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import '/src/index.css';
useAuthStore.setState({ isLoading: false, user: null });
useChildStore.setState({ isLoading: false, activeChild: null, children: [] });
const h = React.createElement;
createRoot(document.getElementById('root')).render(h(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
  h(BrowserRouter, null, h(Routes, null, h(Route, { element: h(AdaptiveContentLayout) },
    h(Route, { path: '/kho-truyen', element: h(StoriesPage) }),
    h(Route, { path: '/kho-truyen/:id', element: h(StoryDetailPage) }),
    h(Route, { path: '/van-hoa', element: h(CulturePage) }),
    h(Route, { path: '/van-hoa/:id', element: h(CultureDetailPage) })
)))));
`;
process.chdir(root);
const server = await createServer({ root, envFile: false,
  server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false, watch: null },
  plugins: [{ name: 'cover-fallback-fixture',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
      if (!/^\/(kho-truyen|van-hoa)(\/|\?|$)/.test(req.url || '')) return next();
      res.setHeader('Content-Type', 'text/html');
      res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
    }); },
  }],
});

async function assertCover(scope, item, icon) {
  if (item.coverImage) {
    const img = scope.locator('img').filter({ visible: true });
    await img.waitFor();
    await img.scrollIntoViewIfNeeded();
    assert.equal(await img.getAttribute('src'), cover);
    assert(await img.evaluate(async el => { await el.decode(); return el.complete && el.naturalWidth === 400; }));
    assert.equal(await scope.locator('[aria-hidden="true"].bg-gradient-to-br > svg').count(), 0);
  } else {
    const fallback = scope.locator(`[aria-hidden="true"].bg-gradient-to-br > svg.lucide-${icon}`);
    assert.equal(await fallback.count(), 1);
    await fallback.scrollIntoViewIfNeeded();
    assert(await fallback.isVisible());
    assert(await fallback.evaluate(el => {
      const r = el.getBoundingClientRect();
      const p = el.parentElement.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.left >= p.left && r.right <= p.right && r.top >= p.top && r.bottom <= p.bottom;
    }));
  }
}
async function assertPage(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No page overflow: ${page.url()}`);
  assert.equal(await page.getByRole('banner').count(), 1);
  assert.equal(await page.getByRole('contentinfo').count(), 1);
}
let browser;
let activations = 0;
try {
  await server.listen();
  const baseUrl = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const language of ['vi', 'en']) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addInitScript(language => localStorage.setItem('vietverse_ui_language', language), language);
    const errors = [], unexpected = [], apiReads = [];
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() !== 'GET') { unexpected.push(`${request.method()} ${url.href}`); return route.abort(); }
      if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      if (url.origin !== baseUrl) { unexpected.push(url.href); return route.abort(); }
      if (!url.pathname.startsWith('/api/')) return route.continue();
      for (const domain of domains) {
        const path = `/api/v1${domain.api}`;
        const data = url.pathname === path ? domain.items : domain.items.find(item => url.pathname === `${path}/${item._id}`);
        if (data) {
          apiReads.push(url.pathname);
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
        }
      }
      unexpected.push(url.href);
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 640, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      for (const domain of domains) {
        for (const [index, item] of domain.items.entries()) {
          for (const method of index === 0 ? ['click', 'keyboard'] : ['click']) {
            await page.goto(`${baseUrl}${domain.route}`);
            const card = page.locator(`main a[href="${domain.route}/${item._id}"]`);
            await card.waitFor();
            assert(await page.evaluate(async () => {
              await document.fonts.ready;
              const fonts = await document.fonts.load('700 16px "Be Vietnam Pro"', 'Vietverse');
              return fonts.length > 0 && fonts.every(font => font.status === 'loaded');
            }));
            await assertCover(card, item, domain.icons[index]);
            await assertPage(page);
            if (index === 0 && method === 'click') await page.screenshot({ path: resolve(shots, `${language}-${width}-${domain.kind}-list.png`) });
            if (method === 'keyboard') {
              await page.locator('main').focus();
              for (let tabs = 0; tabs < 30 && !(await card.evaluate(el => el === document.activeElement)); tabs++) await page.keyboard.press('Tab');
              assert(await card.evaluate(el => el === document.activeElement && el.matches(':focus-visible')));
              await page.keyboard.press('Enter');
            } else await card.click();
            await page.waitForURL(`${baseUrl}${domain.route}/${item._id}`);
            await page.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor();
            await assertCover(page.locator('main'), item, domain.icons[index]);
            await assertPage(page);
            activations++;
            if (index === 0 && method === 'click') {
              await page.screenshot({ path: resolve(shots, `${language}-${width}-${domain.kind}-detail.png`) });
              await page.reload();
              await page.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor();
              await assertCover(page.locator('main'), item, domain.icons[index]);
              await assertPage(page);
            }
            await page.goBack();
            await page.waitForURL(`${baseUrl}${domain.route}`);
            await card.waitFor();
            await assertCover(card, item, domain.icons[index]);
          }
        }
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(unexpected, []);
      console.log(`PASS ${language} ${width}px: story/culture constructor fallbacks, known variants, real covers; click/Tab/Enter/back/reload; public adaptive layout; no overflow/page errors`);
    }
    for (const domain of domains) for (const item of domain.items) assert(apiReads.includes(`/api/v1${domain.api}/${item._id}`));
    await context.close();
  }
  assert.equal(activations, 48);
  console.log(`PASS ${activations} list-to-detail activations; 12 legacy reloads; screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
