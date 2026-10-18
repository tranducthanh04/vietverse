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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-settings-save-'));
const child = { _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], screenTimeLimit: 20 };
const fixtureId = '/__settings-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ParentLayout } from '/src/app/layouts/ParentLayout.tsx';
import { ParentSettingsPage } from '/src/features/parent/ParentSettingsPage.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
useAuthStore.setState({ user: {id:'parent', email:'parent@example.test', displayName:'Parent', role:'parent'}, isLoading:false });
useChildStore.setState({activeChild:${JSON.stringify(child)},children:[${JSON.stringify(child)}],isLoading:false});
useUiLanguageStore.getState().setLanguage(new URLSearchParams(location.search).get('lang'));
sessionStorage.setItem('vietverse_parent_gate_token','fixture-only');
sessionStorage.setItem('vietverse_parent_gate_unlocked',String(Date.now()+60000));
createRoot(document.getElementById('root')).render(React.createElement(MemoryRouter,{initialEntries:['/phu-huynh/cai-dat']},
  React.createElement(Routes,null,React.createElement(Route,{element:React.createElement(ParentLayout)},
    React.createElement(Route,{path:'/phu-huynh/cai-dat',element:React.createElement(ParentSettingsPage)})))));
`;
process.chdir(root);
const server = await createServer({ root, envFile: false,
  server: { host: '127.0.0.1', port: 5192, strictPort: true, hmr: false, watch: null },
  plugins: [{ name: 'settings-save-fixture', resolveId(id) { if (id === fixtureId) return id; }, load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/__settings?')) return next();
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
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let fail = true;
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (!['/api/v1/parent/screen-time', '/api/v1/children/a/select'].includes(url.pathname)) return route.abort();
    const status = fail ? 503 : 200;
    if (url.pathname.endsWith('screen-time')) assert.deepEqual(route.request().postDataJSON(), { childId: 'a', limitMinutes: 0 });
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(fail ? { error: { message: 'fixture unavailable' } } : { data: { ...child, screenTimeLimit: 0 } }) });
  });
  for (const width of [390, 1280]) for (const language of ['vi', 'en']) {
    fail = true;
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`http://127.0.0.1:5192/__settings?lang=${language}`);
    const unlimited = page.getByRole('radio', { name: language === 'vi' ? /^Không giới hạn/ : /^Unlimited/ });
    const save = page.getByRole('button', { name: language === 'vi' ? 'Lưu cài đặt' : 'Save settings' });
    await unlimited.click();
    await save.click();
    const error = page.getByRole('alert');
    await error.waitFor();
    assert.equal(await unlimited.getAttribute('aria-checked'), 'true');
    assert.equal(await page.getByRole('status').count(), 0);
    assert(await error.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth && el.scrollWidth <= el.clientWidth;
    }), 'Error message stays inside the viewport');
    await page.screenshot({ path: resolve(shots, `${language}-${width}-error.png`), fullPage: true });
    fail = false;
    await save.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('status').waitFor();
    assert.equal(await error.count(), 0);
    assert.equal(await unlimited.getAttribute('aria-checked'), 'true');
    console.log(`PASS ${language} ${width}px: accessible error, retained zero, keyboard retry, confirmed success`);
  }
  assert.deepEqual(errors, []);
  console.log(`Screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
