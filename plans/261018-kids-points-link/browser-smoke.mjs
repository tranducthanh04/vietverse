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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-kids-points-'));
const child = { _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 20 };
const fixtureId = '/__points-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KidsLayout } from '/src/app/layouts/KidsLayout.tsx';
import { PointsShopPage } from '/src/features/points/PointsShopPage.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { ChildSessionGuard } from '/src/components/ChildSessionGuard.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
const params = new URLSearchParams(location.search);
const child = {...${JSON.stringify(child)}, viviPoints:Number(params.get('points'))};
useAuthStore.setState({ user: {id:'parent',email:'p@example.test',displayName:'Parent',role:params.get('role') || 'parent'}, isLoading:false });
useChildStore.setState({activeChild:child,children:[child],isLoading:false});
useUiLanguageStore.getState().setLanguage(params.get('lang'));
createRoot(document.getElementById('root')).render(React.createElement(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},
  React.createElement(BrowserRouter,null,React.createElement(Routes,null,
    React.createElement(Route,{element:React.createElement(ProtectedRoute,null,React.createElement(ChildSessionGuard,null,React.createElement(KidsLayout)))},
      React.createElement(Route,{path:'/kham-pha',element:React.createElement('h1',null,'Local navigation fixture')}),
      React.createElement(Route,{path:'/diem-thuong',element:React.createElement(PointsShopPage)}))))));
`;
process.chdir(root);
const server = await createServer({ root, envFile: false,
  server: { host: '127.0.0.1', port: 5193, strictPort: true, hmr: false, watch: null },
  plugins: [{ name: 'points-navigation-fixture', resolveId(id) { if (id === fixtureId) return id; }, load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
      if (!/^\/(kham-pha|diem-thuong)(\?|$)/.test(req.url || '')) return next();
      res.setHeader('Content-Type', 'text/html');
      res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
    }); },
  }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [], unexpected = [];
  page.on('pageerror', error => errors.push(error.message));
  let points = 0;
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const data = path === '/api/v1/children' ? [{ ...child, viviPoints: points }]
      : path === '/api/v1/points/shop/items' ? []
      : path === '/api/v1/points/children/a' ? { viviPoints: points, totalEarned: points, history: [], nextCursor: null }
      : undefined;
    if (data === undefined || route.request().method() !== 'GET') {
      unexpected.push(`${route.request().method()} ${path}`);
      return route.abort();
    }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data }) });
  });
  for (const width of [320, 390, 640, 1366]) for (const language of ['vi', 'en']) for (const balance of [0, 1234567890]) {
    points = balance;
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:5193/kham-pha?lang=${language}&points=${balance}`);
    const header = page.getByRole('banner');
    const pill = header.getByRole('link', { name: language === 'vi' ? /Điểm thưởng/ : /Rewards/ });
    await pill.waitFor();
    assert(await page.evaluate(async () => {
      await document.fonts.ready;
      const faces = await document.fonts.load('800 16px "Be Vietnam Pro"', 'Điểm thưởng ViVi 1234567890');
      return faces.length > 0 && faces.every(face => face.status === 'loaded');
    }), 'Real application font loaded, not a fallback');
    const geometry = await header.evaluate(el => {
      const controls = [...el.querySelectorAll('a,button')].map(node => ({ text: node.getAttribute('aria-label'), rect: node.getBoundingClientRect() }));
      const invalid = controls.filter(({ rect: r }) => r.width < 44 || r.height < 44 || r.left < 0 || r.right > innerWidth || r.bottom > el.getBoundingClientRect().bottom);
      const overlap = controls.some((a, i) => controls.slice(i + 1).some(b => Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 1 && Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top) > 1));
      return { invalid: invalid.map(c => c.text), overlap, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.deepEqual(geometry, { invalid: [], overlap: false, overflow: false });
    const parent = header.getByRole('button', { name: language === 'vi' ? /Vào Góc Phụ Huynh/ : /Enter the Parent Corner/ });
    assert(await parent.isVisible());
    assert.equal(await header.getByRole('button', { name: /Hiển thị giao diện|Show the interface/ }).count(), 2);
    if (balance === 0) await pill.click();
    else {
      // Reach the real link via Tab, not a synthetic key event on an unfocusable div.
      for (let i = 0; i < 10 && !(await pill.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
      assert(await pill.evaluate(el => el === document.activeElement && el.matches(':focus-visible') && parseFloat(getComputedStyle(el).outlineWidth) >= 2));
      await page.screenshot({ path: resolve(shots, `${language}-${width}-focus.png`), fullPage: true });
      await page.keyboard.press('Enter');
    }
    await page.waitForURL('**/diem-thuong');
    await page.getByTestId('points-balance').waitFor();
    assert.equal(await page.getByRole('dialog').count(), 0);
    assert.equal(await pill.textContent().then(s => s.trim()), balance === 0 ? '0' : language === 'vi' ? '1.234.567.890' : '1,234,567,890');
    console.log(`PASS ${language} ${width}px balance=${balance}: header geometry, touch targets, ${balance ? 'Tab/Enter/focus' : 'click'}, guarded rewards route`);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  console.log(`Screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
