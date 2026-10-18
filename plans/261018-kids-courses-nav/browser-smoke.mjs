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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-kids-courses-'));
const child = { _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 2500, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 20 };
const paths = ['/kham-pha', '/kho-truyen', '/van-hoa', '/diem-thuong', '/phong-bau-vat'];
const fixtureId = '/__courses-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KidsLayout } from '/src/app/layouts/KidsLayout.tsx';
import { PublicLayout } from '/src/app/layouts/PublicLayout.tsx';
import { PricingPage } from '/src/features/public/PricingPage.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { ChildSessionGuard } from '/src/components/ChildSessionGuard.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
useAuthStore.setState({ user: {id:'parent',email:'p@example.test',displayName:'Parent',role:'parent'}, isLoading:false });
useChildStore.setState({activeChild:${JSON.stringify(child)},children:[${JSON.stringify(child)}],isLoading:false});
useUiLanguageStore.getState().setLanguage(new URLSearchParams(location.search).get('lang'));
const content = React.createElement('div',{style:{minHeight:1200,display:'flex',flexDirection:'column',justifyContent:'space-between'}},
  React.createElement('h1',null,'Local navigation fixture'),React.createElement('button',{id:'last-content'},'Last content control'));
createRoot(document.getElementById('root')).render(React.createElement(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},
  React.createElement(BrowserRouter,null,React.createElement(Routes,null,
    React.createElement(Route,{element:React.createElement(ProtectedRoute,null,React.createElement(ChildSessionGuard,null,React.createElement(KidsLayout)))},
      ...${JSON.stringify(paths)}.map(path=>React.createElement(Route,{key:path,path,element:content}))),
    React.createElement(Route,{element:React.createElement(PublicLayout)},React.createElement(Route,{path:'/gia',element:React.createElement(PricingPage)})),
    React.createElement(Route,{path:'/phu-huynh/tien-do',element:React.createElement('h1',null,'Parent destination')})))));
`;
process.chdir(root);
const server = await createServer({ root, envFile: false,
  server: { host: '127.0.0.1', port: 5194, strictPort: true, hmr: false, watch: null },
  plugins: [{ name: 'courses-navigation-fixture', resolveId(id) { if (id === fixtureId) return id; }, load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
      if (!/^\/(kham-pha|kho-truyen|van-hoa|diem-thuong|phong-bau-vat|gia|phu-huynh\/tien-do)(\?|$)/.test(req.url || '')) return next();
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
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const method = route.request().method();
    let data;
    if (method === 'GET' && path === '/api/v1/children') data = [child];
    if (method === 'GET' && path === '/api/v1/parent/gate/challenge') data = {num1:7,num2:8,challengeToken:'local-challenge'};
    if (method === 'POST' && path === '/api/v1/parent/gate/verify') {
      assert.deepEqual(route.request().postDataJSON(), {challengeToken:'local-challenge',answer:56});
      data = {gateToken:'local-gate'};
    }
    if (data === undefined) { unexpected.push(method + ' ' + path); return route.abort(); }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data }) });
  });
  for (const width of [320, 390, 399, 400, 640, 1366]) for (const language of ['vi', 'en']) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:5194/kham-pha?lang=${language}`);
    await page.getByRole('navigation').waitFor();
    assert(await page.evaluate(async () => {
      await document.fonts.ready;
      const faces = await document.fonts.load('800 11px "Be Vietnam Pro"', 'Khóa học Kho truyện Courses Rewards');
      return faces.length > 0 && faces.every(face => face.status === 'loaded');
    }), 'Real application font loaded');
    const nav = page.getByRole('navigation');
    for (const path of paths) {
      await nav.locator(`a[href="${path}"]`).click();
      await page.waitForURL('**' + path);
      // URL commits before the route's passive focus effect, which can scroll main into view.
      if (path !== '/kham-pha') await page.waitForFunction(() => document.activeElement?.id === 'main-content');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const geometry = await nav.evaluate(el => {
        const links = [...el.querySelectorAll('a')];
        const boxes = links.map(link => link.getBoundingClientRect());
        const invalid = links.filter((link, i) => {
          const r = boxes[i];
          const label = link.querySelector('span');
          const text = document.createRange(); text.selectNodeContents(label);
          const t = text.getBoundingClientRect();
          return r.width < 44 || r.height < 48 || r.left < 5 || r.right > innerWidth - 5 || r.bottom > innerHeight - 5 ||
            t.left < r.left || t.right > r.right || t.bottom > r.bottom || link.scrollWidth > link.clientWidth;
        }).map(link => link.textContent);
        const overlap = boxes.some((a, i) => boxes.slice(i + 1).some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1));
        return { count: links.length, invalid, overlap, overflow: document.documentElement.scrollWidth > innerWidth,
          contentCovered: document.getElementById('last-content').getBoundingClientRect().bottom > el.getBoundingClientRect().top };
      });
      if (geometry.contentCovered) console.log('SCROLL DIAGNOSTIC', await page.evaluate(() => ({
        scrollY, height:document.documentElement.scrollHeight, viewport:innerHeight,
        active:document.activeElement?.id, padding:getComputedStyle(document.querySelector('main').parentElement).paddingBottom,
        lastBottom:document.getElementById('last-content').getBoundingClientRect().bottom,
        navTop:document.querySelector('nav').getBoundingClientRect().top,
      })));
      assert.deepEqual(geometry, { count:6, invalid:[], overlap:false, overflow:false, contentCovered:false }, `${language} ${width} ${path}`);
      assert.equal(await nav.locator('a[aria-current="page"]').getAttribute('href'), path);
    }
    await page.screenshot({ path: resolve(shots, `${language}-${width}-nav.png`), fullPage: true });
    const course = nav.getByRole('link', { name: language === 'vi' ? 'Khóa học' : 'Courses', exact:true });
    await course.click();
    await page.waitForURL('**/gia');
    await page.getByText('250.000đ', {exact:true}).waitFor();
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.goBack();
    await nav.waitFor();
    await page.locator('#last-content').focus();
    for (let i = 0; i < 8 && !(await course.evaluate(el => el === document.activeElement)); i++) await page.keyboard.press('Tab');
    assert(await course.evaluate(el => el === document.activeElement && el.matches(':focus-visible') && parseFloat(getComputedStyle(el).outlineWidth) >= 2));
    await page.screenshot({ path: resolve(shots, `${language}-${width}-focus.png`), fullPage:true });
    await page.keyboard.press('Enter');
    await page.waitForURL('**/gia');
    await page.getByText('990.000đ', {exact:true}).waitFor();
    await page.goBack();
    const header = page.getByRole('banner');
    await header.getByRole('link', { name: /Điểm thưởng|Rewards/ }).click();
    await page.waitForURL('**/diem-thuong');
    await page.evaluate(() => {sessionStorage.removeItem('vietverse_parent_gate_token');sessionStorage.removeItem('vietverse_parent_gate_unlocked');});
    await header.getByRole('button', {name:/Vào Góc Phụ Huynh|Enter the Parent Corner/}).click();
    const answer = page.getByRole('spinbutton');
    await answer.fill('56');
    await answer.press('Enter');
    await page.waitForURL('**/phu-huynh/tien-do');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('vietverse_parent_gate_token')), 'local-gate');
    console.log(`PASS ${language} ${width}px: five active states, six targets/labels, last content, click + Tab/Enter to pricing, points + Parent Gate`);
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  console.log(`Screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
