import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer as createPortProbe } from 'node:net';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = resolve('client');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-cover-fallback-'));
const child = { _id: 'child-cover-qa', parentId: 'parent-cover-qa', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], screenTimeLimit: 0 };
const tagline = {
  vi: 'C\u00d9NG CON M\u1ede KHO B\u00c1U, TI\u1ebeNG VI\u1ec6T TH\u00caM NHI\u1ec6M M\u00c0U',
  en: 'OPEN THE TREASURE WITH YOUR CHILD, MAKE VIETNAMESE MAGICAL',
};
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
const authenticated = localStorage.getItem('cover_fixture_mode') === 'kids';
useAuthStore.setState({ isLoading: false, user: authenticated ? { id: 'parent-cover-qa', email: 'qa@example.test', displayName: 'QA', role: 'parent' } : null });
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
// Vite treats port0 as its default; give each local runner an explicit free port.
const port = await new Promise((resolvePort, reject) => {
  const probe = createPortProbe();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const available = probe.address().port;
    probe.close(error => error ? reject(error) : resolvePort(available));
  });
});
const server = await createServer({ root, envFile: false,
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api/v1') },
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false, watch: null },
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
async function assertExposed(locator, interactive = false) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
  const geometry = await locator.evaluate((el, interactive) => {
    const r = el.getBoundingClientRect();
    const header = document.querySelector('header').getBoundingClientRect();
    const nav = document.querySelector('nav.fixed')?.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { box: r.toJSON(), headerBottom: header.bottom, navTop: nav?.top ?? innerHeight,
      exposed: r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth + 1 &&
        r.top >= header.bottom - 1 && r.bottom <= (nav?.top ?? innerHeight) + 1 && (!interactive || el.contains(hit)) };
  }, interactive);
  assert(geometry.exposed, `Content clears actual header/bottom nav: ${JSON.stringify(geometry)}`);
}
async function assertPage(page, mode, language) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `No page overflow: ${page.url()}`);
  assert.equal(await page.getByRole('banner').count(), 1);
  assert.equal(await page.getByRole('contentinfo').count(), mode === 'guest' ? 1 : 0);
  const header = page.getByRole('banner');
  const brand = header.getByRole('link', { name: /^VIETVERSE(?:\s|$)/ });
  assert(await brand.isVisible());
  assert.equal(await brand.getAttribute('href'), '/');
  assert((await brand.textContent()).includes('VIETVERSE'));
  const bounds = await header.locator('button:visible, a:visible').evaluateAll(elements => elements.every(el => {
    const r = el.getBoundingClientRect();
    return r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth + 1 && r.top >= 0;
  }));
  assert(bounds, 'Visible header controls retain44px targets and viewport bounds');
  if (mode === 'kids') {
    assert.equal(await brand.getAttribute('aria-label'), 'VIETVERSE');
    const copy = brand.getByText(tagline[language], { exact: true });
    assert(await copy.isVisible());
    assert(await copy.evaluate(el => {
      const r = el.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(el);
      return [...range.getClientRects()].every(line => line.left >= r.left - 1 && line.right <= r.right + 1 && line.top >= r.top - 1 && line.bottom <= r.bottom + 1);
    }), 'Full tagline wraps without clipping');
    const nav = page.locator('nav.fixed');
    assert.deepEqual(await nav.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))),
      ['/kham-pha', '/gia', '/kho-truyen', '/van-hoa', '/diem-thuong', '/phong-bau-vat']);
    assert(await nav.evaluate(el => {
      const boxes = [...el.querySelectorAll('a')].map(link => link.getBoundingClientRect());
      return boxes.every(r => r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight) &&
        !boxes.some((a, i) => boxes.slice(i + 1).some(b => Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)));
    }), 'Six kids nav targets fit without overlap');
  }
}
async function assertFooter(page) {
  const footer = page.getByRole('contentinfo');
  const links = footer.locator('a[href^="/"]');
  assert.deepEqual(await links.evaluateAll(elements => elements.map(el => el.getAttribute('href'))),
    ['/', '/kham-pha', '/#lo-trinh-hoc-tap', '/gia', '/kho-truyen', '/van-hoa']);
  assert(await links.evaluateAll(elements => elements.every(el => {
    const r = el.getBoundingClientRect();
    return r.height >= 44 && r.left >= 0 && r.right <= innerWidth + 1;
  })), 'Six footer navigation targets keep their bounds');
  assert.equal(await footer.locator('a[href^="mailto:"]').getAttribute('href'), 'mailto:vietverseallsatar@gmail.com');
  assert.equal(await footer.locator('a[href^="tel:"]').getAttribute('href'), 'tel:+84868261075');
}
async function assertBottomClearance(page) {
  const finalContent = page.locator('main a:visible, main p:visible, main button:visible').last();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  assert(await finalContent.evaluate(el => el.getBoundingClientRect().bottom <= document.querySelector('nav.fixed').getBoundingClientRect().top + 1));
}
let browser;
let activations = 0;
let reloads = 0;
let activePage;
try {
  await server.listen();
  const baseUrl = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const mode of ['guest', 'kids']) {
  for (const language of ['vi', 'en']) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addInitScript(({ language, mode }) => {
      localStorage.setItem('vietverse_ui_language', language);
      localStorage.setItem('cover_fixture_mode', mode);
    }, { language, mode });
    const errors = [], unexpected = [], apiReads = [], explorations = [];
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === 'GET' && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      if (url.origin !== baseUrl) { unexpected.push(url.href); return route.abort(); }
      if (request.method() !== 'GET') {
        // The real authenticated story effect is acknowledged in-memory, never forwarded.
        if (mode === 'kids' && request.method() === 'POST' && stories.some(item => url.pathname === `/api/v1/stories/${item._id}/explored`) && request.postDataJSON()?.childId === child._id) {
          explorations.push(url.pathname);
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: {} }) });
        }
        unexpected.push(`${request.method()} ${url.href}`); return route.abort();
      }
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (mode === 'kids' && url.pathname === '/api/v1/children') {
        apiReads.push(url.pathname);
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [child] }) });
      }
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
    activePage = page;
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
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
            await assertPage(page, mode, language);
            if (index === 0 && method === 'click') {
              await page.evaluate(() => window.scrollTo(0, 0));
              if (domain.kind === 'story') {
                console.log(`HEADER ${mode} ${language} ${width}px: ${JSON.stringify(await page.getByRole('banner').evaluate(el => ({ height: el.getBoundingClientRect().height, text: el.innerText })))}`);
                await page.getByRole('banner').screenshot({ path: resolve(shots, `${mode}-${language}-${width}-header.png`) });
                if (mode === 'guest') {
                  await assertFooter(page);
                  await page.getByRole('contentinfo').screenshot({ path: resolve(shots, `${mode}-${language}-${width}-footer.png`) });
                }
              }
              if (mode === 'kids') await assertBottomClearance(page);
              await assertExposed(card, true);
              await page.screenshot({ path: resolve(shots, `${mode}-${language}-${width}-${domain.kind}-list.png`) });
            }
            await assertExposed(card, true);
            const exploration = mode === 'kids' && domain.kind === 'story'
              ? page.waitForResponse(response => response.url() === `${baseUrl}/api/v1/stories/${item._id}/explored` && response.request().method() === 'POST') : null;
            if (method === 'keyboard') {
              await page.locator('main').focus();
              for (let tabs = 0; tabs < 30 && !(await card.evaluate(el => el === document.activeElement)); tabs++) await page.keyboard.press('Tab');
              assert(await card.evaluate(el => el === document.activeElement && el.matches(':focus-visible')));
              await page.keyboard.press('Enter');
            } else await card.click();
            await page.waitForURL(`${baseUrl}${domain.route}/${item._id}`);
            if (exploration) await exploration;
            await page.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor();
            await assertCover(page.locator('main'), item, domain.icons[index]);
            await assertPage(page, mode, language);
            await assertExposed(page.locator('main button').first(), true);
            const detailCover = item.coverImage ? page.locator('main img') : page.locator('main [aria-hidden="true"].bg-gradient-to-br');
            await assertExposed(detailCover);
            activations++;
            if (index === 0 && method === 'click') {
              if (mode === 'kids') await assertBottomClearance(page);
              await assertExposed(detailCover);
              await page.screenshot({ path: resolve(shots, `${mode}-${language}-${width}-${domain.kind}-detail.png`) });
              const reloadedExploration = mode === 'kids' && domain.kind === 'story'
                ? page.waitForResponse(response => response.url() === `${baseUrl}/api/v1/stories/${item._id}/explored` && response.request().method() === 'POST') : null;
              await page.reload();
              if (reloadedExploration) await reloadedExploration;
              await page.getByRole('heading', { level: 1, name: item.title, exact: true }).waitFor();
              await assertCover(page.locator('main'), item, domain.icons[index]);
              await assertPage(page, mode, language);
              await assertExposed(detailCover);
              reloads++;
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
      console.log(`PASS ${mode} ${language} ${width}px: story/culture constructor fallbacks, known variants, real covers; click/Tab/Enter/back/reload; actual adaptive layout/header/footer or six-link kids nav; no overflow/console/page errors`);
    }
    for (const domain of domains) for (const item of domain.items) assert(apiReads.includes(`/api/v1${domain.api}/${item._id}`));
    assert.equal(explorations.length, mode === 'kids' ? 15 : 0);
    if (mode === 'kids') assert(apiReads.includes('/api/v1/children'));
    console.log(`NETWORK ${mode} ${language}: ${explorations.length} synthetic explored POSTs fulfilled in-memory, zero forwarded mutations`);
    await context.close();
  }
  }
  assert.equal(activations, 96);
  assert.equal(reloads, 24);
  console.log(`PASS ${activations} list-to-detail activations; ${reloads} legacy reloads; guest+kids; screenshots: ${shots}`);
} catch (error) {
  console.error(`FAILED after ${activations} activations/${reloads} reloads; screenshots: ${shots}`);
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: resolve(shots, 'failure.png'), fullPage: true });
  throw error;
} finally {
  await browser?.close();
  await server.close();
}
