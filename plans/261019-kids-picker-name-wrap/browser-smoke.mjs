import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = resolve('client');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const output = await mkdtemp(resolve(tmpdir(), 'vietverse-picker-name-'));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const componentHash = createHash('sha256').update(await readFile(resolve(root, 'src/app/layouts/KidsLayout.tsx'))).digest('hex');
const port = 5198;
const names = {
  unbroken: 'abcdefghij'.repeat(3),
  spaced: 'Nguy\u1ec5n Ho\u00e0ng Thi\u00ean An Minh Anh',
};
Object.values(names).forEach(name => assert.equal(name.length, 30));
const child = { _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 42, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 0 };
const fixtureId = '/__picker-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KidsLayout } from '/src/app/layouts/KidsLayout.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { ChildSessionGuard } from '/src/components/ChildSessionGuard.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
const params = new URLSearchParams(location.search);
useAuthStore.setState({user:{id:'parent',email:'p@example.test',displayName:'Parent',role:'parent'},isLoading:false});
useUiLanguageStore.getState().setLanguage(params.get('lang'));
window.readPickerFixture = () => {
  const state=useChildStore.getState();
  return {active:state.activeChild,children:state.children};
};
const content=React.createElement('section',null,
 React.createElement('h1',null,'Local picker fixture'),
 React.createElement('button',{id:'outside-control',style:{minHeight:44,marginTop:320,padding:'0 16px'}},'Outside control'));
createRoot(document.getElementById('root')).render(React.createElement(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},
 React.createElement(BrowserRouter,null,React.createElement(Routes,null,
  React.createElement(Route,{element:React.createElement(ProtectedRoute,null,React.createElement(ChildSessionGuard,null,React.createElement(KidsLayout)))},
   React.createElement(Route,{path:'/kham-pha',element:content}))))));
`;
process.chdir(root);
const server = await createServer({ root, envFile: false,
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false, watch: null },
  plugins: [{ name: 'picker-name-fixture', resolveId(id) { if (id === fixtureId) return id; }, load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
      if (!/^\/kham-pha(?:\?|$)/.test(req.url || '')) return next();
      res.setHeader('Content-Type', 'text/html');
      res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
    }); },
  }],
});

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(resolve));
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
    await new Promise(resolve => requestAnimationFrame(resolve));
  });
}

async function tabEnter(page, target) {
  // Traverse the actual tab order instead of programmatically focusing controls.
  for (let count = 0; count < 40; count++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate(el => el === document.activeElement)) {
      await settle(page);
      assert(await target.evaluate(el => el.matches(':focus-visible')), 'Keyboard focus must be visible');
      await page.keyboard.press('Enter');
      return;
    }
  }
  assert.fail('Control unreachable by Tab');
}

async function geometry(page, name) {
  return page.locator('#child-picker-menu').evaluate((menu, name) => {
    const box = element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
    const intersects = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
    const textRects = element => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height }));
    };
    const button = [...menu.querySelectorAll('button')].find(button => button.querySelector('span')?.textContent === name);
    const nameElement = button.querySelector('span');
    const pointsElement = button.querySelectorAll('span')[1];
    const nameBox = box(nameElement), pointsBox = box(pointsElement), buttonBox = box(button), menuBox = box(menu);
    const nameRects = textRects(nameElement), pointsRects = textRects(pointsElement);
    const style = getComputedStyle(nameElement);
    const viewport = { left: 0, right: innerWidth, top: 0, bottom: innerHeight };
    return {
      name, nameBox, pointsBox, buttonBox, menuBox, nameRects, pointsRects,
      nameOutside: nameRects.some(rect => !inside(rect, nameBox) || !inside(rect, buttonBox)),
      pointsOutside: pointsRects.some(rect => !inside(rect, pointsBox) || !inside(rect, buttonBox)),
      overlap: nameRects.some(rect => intersects(rect, pointsBox)) || intersects(nameBox, pointsBox),
      clipped: ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY) || style.textOverflow === 'ellipsis' || Number.parseInt(style.webkitLineClamp) > 0,
      hidden: style.display === 'none' || style.visibility !== 'visible' || Number(style.opacity) === 0,
      smallTargets: [...menu.querySelectorAll('button')].some(button => { const rect = box(button); return rect.width < 44 || rect.height < 44; }),
      menuOutside: !inside(menuBox, viewport),
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
    };
  }, name);
}

let browser;
const records = [];
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [], unexpected = [], selections = [];
  let profiles;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname, method = route.request().method();
    let data;
    if (method === 'GET' && path === '/api/v1/children') data = profiles;
    if (method === 'PATCH' && /^\/api\/v1\/children\/[ab]\/select$/.test(path)) {
      const id = path.split('/')[4];
      selections.push(id);
      data = profiles.find(profile => profile._id === id);
    }
    if (data === undefined) { unexpected.push(method + ' ' + path); return route.abort(); }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ data }) });
  });
  for (const width of [320, 390, 640, 1366]) for (const language of ['vi', 'en']) for (const balance of [0, 1234567890]) for (const [kind, name] of Object.entries(names)) {
    const label = `${language}-${width}-${balance}-${kind}`;
    profiles = [{ ...child }, { ...child, _id: 'b', name, viviPoints: balance }];
    const selectionStart = selections.length;
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${port}/kham-pha?lang=${language}`, { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('header button[aria-haspopup]');
    await trigger.waitFor();
    assert(await page.evaluate(async () => {
      await document.fonts.ready;
      const faces = await document.fonts.load('700 14px "Be Vietnam Pro"', 'Nguy\u1ec5n abcdefghij');
      return faces.length > 0 && faces.every(face => face.status === 'loaded');
    }), 'Real application font must load');
    const initial = await page.evaluate(() => window.readPickerFixture());
    const pointsLink = page.locator('header a[href="/diem-thuong"]');
    const initialPoints = await pointsLink.textContent();
    await trigger.click();
    await page.locator('#child-picker-menu').waitFor();
    await settle(page);
    const bounds = await geometry(page, name);
    const screenshot = resolve(output, label + '.png');
    await page.screenshot({ path: screenshot });
    records.push({ label, head, componentHash, screenshot, bounds });
    await writeFile(resolve(output, 'geometry.json'), JSON.stringify(records, null, 2));
    const violations = ['nameOutside', 'pointsOutside', 'overlap', 'clipped', 'hidden', 'smallTargets', 'menuOutside', 'pageOverflow'].filter(key => bounds[key]);
    assert.deepEqual(violations, [], `${label}: ${JSON.stringify(bounds)}; screenshot=${screenshot}`);
    assert.deepEqual(await page.evaluate(() => window.readPickerFixture()), initial, 'Opening picker preserves store');
    await page.keyboard.press('Escape');
    await page.locator('#child-picker-menu').waitFor({ state: 'detached' });
    assert(await trigger.evaluate(el => el === document.activeElement), 'Escape restores trigger focus');
    assert.deepEqual(await page.evaluate(() => window.readPickerFixture()), initial);
    assert.equal(await pointsLink.textContent(), initialPoints);
    await trigger.click();
    await page.locator('#child-picker-menu').waitFor();
    const outside = page.locator('#outside-control');
    await outside.click();
    await page.locator('#child-picker-menu').waitFor({ state: 'detached' });
    assert(await outside.evaluate(el => el === document.activeElement), 'Outside click retains clicked focus');
    assert.deepEqual(await page.evaluate(() => window.readPickerFixture()), initial);
    assert.equal(await pointsLink.textContent(), initialPoints);
    assert.equal(selections.length, selectionStart, 'Open/Escape/outside must not select');
    for (const keyboard of [false, true]) {
      await trigger.click();
      const target = page.locator('#child-picker-menu').getByRole('button').filter({ has: page.getByText(name, { exact: true }) });
      if (keyboard) await tabEnter(page, target); else await target.click();
      await page.waitForFunction(() => window.readPickerFixture().active?._id === 'b');
      assert.deepEqual((await page.evaluate(() => window.readPickerFixture())).active, profiles[1]);
      assert.equal((await pointsLink.textContent()).trim(), new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(balance));
      const triggerName = trigger.locator('span').filter({ hasText: name });
      assert.deepEqual(await triggerName.evaluate(el => {
        const style = getComputedStyle(el);
        return { text: el.textContent, overflow: style.overflowX, ellipsis: style.textOverflow, whiteSpace: style.whiteSpace, constrained: el.scrollWidth > el.clientWidth };
      }), { text: name, overflow: 'hidden', ellipsis: 'ellipsis', whiteSpace: 'nowrap', constrained: true }, 'Existing trigger truncation is preserved');
      await trigger.click();
      const original = page.locator('#child-picker-menu').getByRole('button').filter({ has: page.getByText('An', { exact: true }) });
      if (keyboard) await tabEnter(page, original); else await original.click();
      await page.waitForFunction(() => window.readPickerFixture().active?._id === 'a');
      assert.deepEqual(await page.evaluate(() => window.readPickerFixture()), initial);
    }
    assert.deepEqual(selections.slice(selectionStart), ['b', 'a', 'b', 'a']);
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    console.log('PASS ' + label);
  }
  assert.equal(records.length, 32);
  console.log(`PASS 32 geometry/interaction cases; head=${head}; artifacts=${output}`);
} finally {
  console.log(`Evidence: ${output}`);
  await browser?.close();
  await server.close();
}
