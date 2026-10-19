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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-story-labels-'));
const fixtureId = '/__story-label-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StoriesPage } from '/src/features/stories/StoriesPage.tsx';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
useUiLanguageStore.getState().setLanguage(new URLSearchParams(location.search).get('language'));
createRoot(document.getElementById('root')).render(
  React.createElement(QueryClientProvider, { client: new QueryClient() },
    React.createElement(MemoryRouter, null, React.createElement(StoriesPage))));
`;
process.chdir(root);
const server = await createServer({
  root, envFile: false,
  server: { host: '127.0.0.1', port: 5194, strictPort: true, hmr: false, watch: null },
  plugins: [{
    name: 'story-label-regression',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__story-labels?')) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
      });
    },
  }],
});
const stories = ['dong_dao', 'co_tich', 'tho', 'ngu_ngon', 'legacy'].map((type, index) => ({
  _id: `story-${index}`, type, title: `QA Story ${index + 1}`, description: 'Local fixture - not published content',
  author: '', coverImage: '', audioUrl: '', durationSec: 0, lyrics: [], vocab: [], quiz: [], ageGroups: ['5-6'], contentVersion: 1,
}));
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('**/api/**', route => {
    assert.equal(route.request().method(), 'GET');
    assert.equal(new URL(route.request().url()).pathname, '/api/v1/stories');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: stories }) });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const language of ['vi', 'en']) {
    const labels = language === 'vi'
      ? ['Đồng dao', 'Cổ tích', 'Thơ ca', 'Truyện ngụ ngôn']
      : ['Rhyme', 'Fairy tale', 'Poem', 'Fables'];
    for (const width of [320, 639, 640, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`http://127.0.0.1:5194/__story-labels?language=${language}`);
      await page.getByRole('heading', { name: 'QA Story 5', exact: true }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      for (const [index, label] of labels.entries()) {
        const card = page.locator(`a[href="/kho-truyen/story-${index}"]`);
        const badges = card.getByText(label, { exact: true });
        assert.equal(await badges.count(), 2);
        assert.equal(await badges.nth(0).isVisible(), width >= 640);
        assert.equal(await badges.nth(1).isVisible(), width < 640);
        const badge = badges.nth(width >= 640 ? 0 : 1);
        assert(await badge.evaluate(el => el.scrollWidth <= el.clientWidth + 1 || getComputedStyle(el).display === 'inline'));
      }
      const legacy = page.locator('a[href="/kho-truyen/story-4"]');
      for (const label of labels) assert.equal(await legacy.getByText(label, { exact: true }).count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
      if (width === 320 || width === 1280) await page.screenshot({ path: resolve(shots, `${language}-${width}.png`), fullPage: true });
      console.log(`PASS ${language} ${width}px: four correct visible badges; unknown omitted; no page overflow`);
    }
  }
  assert.deepEqual(errors, []);
  console.log(`Screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
