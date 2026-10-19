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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-map-child-greeting-'));
const names = [
  ['short', 'An'],
  ['spaced', 'Nguy\u1ec5n Ho\u00e0ng Minh Anh '.repeat(5).trim()],
  ['unbroken', 'Abcdefghij'.repeat(12)],
  ['markup', '<img src=x onerror="window.__nameExecuted=true"> & <b>QA</b>'],
  ['max-valid', 'abcdefghij'.repeat(3)],
];
const children = names.map(([kind, name], index) => ({
  _id: `child-${kind}`, parentId: 'parent', name, ageGroup: '5-6', companionLanguage: 'en',
  avatarId: 'star', viviPoints: index, level: 1, badges: [], screenTimeLimit: 0,
}));
const stages = [{
  id: 's1', _id: 's1', order: 1, title: 'Ch\u1eb7ng 1: Khu r\u1eebng Ch\u1eef C\u00e1i',
  goal: 'Local synthetic stage fixture.', totalLessons: 1, completedCount: 0, percentage: 0,
  isCompleted: false, isUnlocked: true, requiresSubscription: false, lockReason: null,
  lessons: [{ _id: 'lesson-1', order: 1, title: 'Local lesson', description: 'Local synthetic lesson fixture.',
    isUnlocked: true, status: 'not_started', stars: 0 }],
}];
const fixtureId = '/__map-greeting-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuestMapPage } from '/src/features/quest-map/QuestMapPage.tsx';
import { KidsLayout } from '/src/app/layouts/KidsLayout.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { ChildSessionGuard } from '/src/components/ChildSessionGuard.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import '/src/index.css';
useAuthStore.setState({ isLoading: false, user: { id: 'parent', email: 'qa@example.test', displayName: 'QA', role: 'parent' } });
const h = React.createElement;
createRoot(document.getElementById('root')).render(h(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
  h(BrowserRouter, null, h(Routes, null,
    h(Route, { element: h(ProtectedRoute, null, h(ChildSessionGuard, null, h(KidsLayout))) },
      h(Route, { path: '/kham-pha', element: h(QuestMapPage) }))
))));
`;
process.chdir(root);
// Vite treats port 0 as its default port, so resolve a free port explicitly.
const port = await new Promise((resolvePort, reject) => {
  const probe = createPortProbe();
  probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const available = probe.address().port;
    probe.close(error => error ? reject(error) : resolvePort(available));
  });
});
const server = await createServer({
  root, envFile: false, define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api/v1') },
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false, watch: null },
  plugins: [{
    name: 'map-child-greeting-regression',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/kham-pha') return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
      });
    },
  }],
});
let browser;
const greetingText = (language, name) => language === 'vi' ? `Ch\u00e0o m\u1eebng b\u1ea1n nh\u1ecf ${name}!` : `Welcome, ${name}!`;

async function assertGreeting(page, language, child) {
  const expected = greetingText(language, child.name);
  const greeting = page.locator('main p').filter({ hasText: expected });
  await greeting.waitFor();
  assert.equal(await greeting.count(), 1);
  assert.equal(await greeting.textContent(), expected);
  assert.equal(await greeting.locator('*').count(), 0, 'Names are text, never HTML');
  assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
  assert(await greeting.evaluate(el => el.nextElementSibling?.tagName === 'H1'));
  assert.equal(await page.evaluate(() => window.__nameExecuted), undefined);
  await page.evaluate(() => window.scrollTo(0, 0));
  const geometry = await greeting.evaluate(el => {
    const r = el.getBoundingClientRect();
    const heading = el.nextElementSibling.getBoundingClientRect();
    const header = document.querySelector('header').getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el);
    const lines = [...range.getClientRects()];
    const ancestors = [];
    for (let ancestor = el.parentElement; ancestor && ancestor.tagName !== 'MAIN'; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if ([style.overflowX, style.overflowY].some(value => ['hidden', 'clip'].includes(value))) ancestors.push(ancestor.getBoundingClientRect());
    }
    return {
      bounds: r.left >= 0 && r.right <= innerWidth + 1 && r.top >= header.bottom - 1,
      textFits: lines.every(line => line.left >= r.left - 1 && line.right <= r.right + 1 && line.top >= r.top - 1 && line.bottom <= r.bottom + 1),
      notClipped: ancestors.every(a => lines.every(line => line.left >= a.left - 1 && line.right <= a.right + 1 && line.top >= a.top - 1 && line.bottom <= a.bottom + 1)),
      beforeHeading: r.bottom <= heading.top + 1,
      noOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
    };
  });
  assert.deepEqual(geometry, { bounds: true, textFits: true, notClipped: true, beforeHeading: true, noOverflow: true });
  for (const other of children.filter(item => item._id !== child._id)) {
    assert.equal(await page.locator('main p').filter({ hasText: greetingText(language, other.name) }).count(), 0, 'No stale greeting');
  }
}

async function assertLayout(page) {
  const nav = page.getByRole('navigation');
  assert.deepEqual(await nav.locator('a').evaluateAll(links => links.map(link => link.getAttribute('href'))),
    ['/kham-pha', '/gia', '/kho-truyen', '/van-hoa', '/diem-thuong', '/phong-bau-vat']);
  assert(await nav.evaluate(el => {
    const boxes = [...el.querySelectorAll('a')].map(link => link.getBoundingClientRect());
    return boxes.every(r => r.width >= 44 && r.height >= 44 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight) &&
      !boxes.some((a, i) => boxes.slice(i + 1).some(b => Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)));
  }), 'Six navigation targets fit, are >=44px, and do not overlap');
  const controls = page.locator('main button:visible, main a:visible');
  assert(await controls.count() >= 2);
  for (const control of await controls.all()) {
    await control.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    assert(await control.evaluate(el => {
      const r = el.getBoundingClientRect();
      const header = document.querySelector('header').getBoundingClientRect();
      const nav = document.querySelector('nav').getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth + 1 &&
        r.top >= header.bottom - 1 && r.bottom <= nav.top + 1 && el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
    }), `Map control clears sticky header/fixed nav: ${await control.textContent()}`);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  assert(await controls.last().evaluate(el => el.getBoundingClientRect().bottom <= document.querySelector('nav').getBoundingClientRect().top + 1));
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}

try {
  await server.listen();
  const baseUrl = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const language of ['vi', 'en']) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addInitScript(language => localStorage.setItem('vietverse_ui_language', language), language);
    const errors = [];
    const unexpectedRequests = [];
    const selections = [];
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === 'GET' && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      if (url.origin !== baseUrl) { unexpectedRequests.push(`${request.method()} ${url.href}`); return route.abort(); }
      if (!url.pathname.startsWith('/api/') && request.method() === 'GET') return route.continue();
      let data;
      if (request.method() === 'GET' && url.pathname === '/api/v1/children') data = children;
      else if (request.method() === 'GET' && url.pathname === '/api/v1/stages' && children.some(child => child._id === url.searchParams.get('childId'))) data = stages;
      else if (request.method() === 'PATCH' && children.some(child => url.pathname === `/api/v1/children/${child._id}/select`)) {
        data = children.find(child => url.pathname === `/api/v1/children/${child._id}/select`);
        selections.push(data._id);
      } else { unexpectedRequests.push(`${request.method()} ${url.href}`); return route.abort(); }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const width of [320, 640, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${baseUrl}/kham-pha`);
      await page.getByRole('heading', { level: 2, name: stages[0].title, exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert(await page.evaluate(() => [...document.fonts].some(font => font.status === 'loaded')));
      for (const [index, child] of children.entries()) {
        if (index > 0) {
          await page.getByRole('button', { name: language === 'vi' ? 'Ch\u1ecdn h\u1ed3 s\u01a1 b\u00e9' : 'Choose child profile', exact: true }).click();
          if (index === 1) {
            const picker = await page.locator('#child-picker-menu').evaluate(menu => {
              const label = [...menu.querySelectorAll('button > span:first-child')].find(el => el.textContent === 'abcdefghij'.repeat(3));
              const r = label.getBoundingClientRect();
              const button = label.parentElement.getBoundingClientRect();
              return { textRight: r.right, buttonRight: button.right, viewportWidth: innerWidth,
                textExceedsButton: r.right > button.right + 1, textExceedsViewport: r.right > innerWidth + 1 };
            });
            console.log(`BASELINE_PICKER ${language} ${width}px: ${JSON.stringify(picker)}`);
            if (width === 320) await page.screenshot({ path: resolve(shots, `${language}-${width}-baseline-picker.png`), fullPage: false });
          }
          const choice = page.locator('#child-picker-menu button').filter({ has: page.getByText(child.name, { exact: true }) });
          assert.equal(await choice.count(), 1, 'Exactly one full-name picker target');
          assert.equal(await choice.locator('span').first().textContent(), child.name);
          if (child._id === 'child-max-valid') {
            const ambiguous = page.locator('#child-picker-menu button').filter({ has: page.locator('span').filter({ hasText: child.name }) });
            console.log(`SELECTOR_AUDIT ${language} ${width}px: old substring matches=${await ambiguous.count()}, first=${await ambiguous.first().locator('span').first().textContent()}, exact matches=${await choice.count()}`);
          }
          const response = page.waitForResponse(response => response.url() === `${baseUrl}/api/v1/children/${child._id}/select` && response.request().method() === 'PATCH');
          await choice.click();
          await response;
        }
        await assertGreeting(page, language, child);
        await assertLayout(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: resolve(shots, `${language}-${width}-${names[index][0]}.png`), fullPage: true });
      }
      await page.getByRole('button', { name: language === 'vi' ? 'Ch\u1ecdn h\u1ed3 s\u01a1 b\u00e9' : 'Choose child profile', exact: true }).click();
      const response = page.waitForResponse(response => response.url() === `${baseUrl}/api/v1/children/child-short/select` && response.request().method() === 'PATCH');
      await page.locator('#child-picker-menu button').filter({ has: page.getByText('An', { exact: true }) }).click();
      await response;
      await assertGreeting(page, language, children[0]);
      assert.equal(new URL(page.url()).pathname, '/kham-pha');
      console.log(`PASS ${language} ${width}px: five exact greetings + switch-back; literal markup; wrapped/unclipped text; six nav targets; header/bottom clearance`);
    }
    assert.deepEqual(selections, Array.from({ length: 3 }, () => [...children.slice(1).map(child => child._id), children[0]._id]).flat());
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpectedRequests, []);
    await context.close();
  }
  console.log(`PASS 30 greeting cases + 6 switch-backs, 30 real picker PATCH selections; no console/page errors or unexpected requests; screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
