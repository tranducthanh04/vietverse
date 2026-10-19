import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer as createPortProbe } from 'node:net';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const workspace=resolve('.');
assert(workspace.replaceAll('\\','/').endsWith('/resume-parent-gate-403/codeDuAN'));
const git=(...args)=>execFileSync('git',args,{cwd:workspace,encoding:'utf8'}).trim();
const safe=new Set(['PATH','SYSTEMROOT','WINDIR','COMSPEC','PATHEXT','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','PROGRAMFILES','PROGRAMFILES(X86)','PROGRAMDATA','SYSTEMDRIVE','OS','PROCESSOR_ARCHITECTURE','NUMBER_OF_PROCESSORS']);
for(const key of Object.keys(process.env))if(!safe.has(key.toUpperCase()))delete process.env[key];
for(const dir of [workspace,resolve('client'),resolve('server')])assert.deepEqual((await readdir(dir)).filter(n=>/^\.env($|\.)/.test(n)&&!/example|sample|template/.test(n)),[]);
const attempt=process.argv[2]||'browser1';assert(/^browser\d+$/.test(attempt));
const out=resolve('plans/261019-resume-parent-gate-403');
const evidence={head:git('rev-parse','HEAD'),base:'4a6b0a14ed18ff4b9f5be6f33e4889b4c5b3ab66',apiSha256:createHash('sha256').update(await readFile(resolve('client/src/lib/api.ts'))).digest('hex'),startedAt:new Date().toISOString(),matrices:[],blocked:[],cleanedUp:false};
const { chromium } = require('C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = resolve('client');
const html = await readFile(resolve(root, 'index.html'), 'utf8');
const shots = resolve(out, attempt+'-screenshots');await mkdir(shots);
const keys = { token: 'vietverse_parent_gate_token', deadline: 'vietverse_parent_gate_unlocked' };
const oldToken = 'synthetic-old-gate';
const newToken = 'synthetic-new-gate';
const child = { _id: 'child-gate-qa', parentId: 'parent-gate-qa', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 17, level: 1, badges: [], screenTimeLimit: 0 };
const progressPath = `/api/v1/parent/progress/${child._id}`;
const report = { child: { id: child._id, name: child.name, viviPoints: 17 },
  overview: { totalLessonsCompleted: 7, totalRecordings: 2, storiesExplored: 3, cultureExplored: 4 },
  competencies: [], journey: { stages: [], currentStageId: null, isCompleted: false }, recentActivities: [] };
const fixtureId = '/__gate-stale403-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ParentLayout } from '/src/app/layouts/ParentLayout.tsx';
import { ParentDashboardPage } from '/src/features/parent/ParentDashboardPage.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import '/src/index.css';
useAuthStore.setState({ isLoading: false, user: { id: 'parent-gate-qa', email: 'qa@example.test', displayName: 'Synthetic QA', role: 'parent' } });
useChildStore.setState({ children: [${JSON.stringify(child)}], activeChild: ${JSON.stringify(child)}, isLoading: false });
const h = React.createElement;
createRoot(document.getElementById('root')).render(h(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
  h(BrowserRouter, null, h(Routes, null,
    h(Route, { element: h(ProtectedRoute, null, h(ParentLayout)) },
      h(Route, { path: '/phu-huynh/tien-do', element: h(ParentDashboardPage) })),
    h(Route, { path: '/kham-pha', element: h('h1', null, 'Kids destination fixture') })
))));
`;
const port = await new Promise((resolvePort, reject) => {
  const probe = createPortProbe(); probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => {
    const available = probe.address().port;
    probe.close(error => error ? reject(error) : resolvePort(available));
  });
});
process.chdir(root);
const server = await createServer({ root, envFile: false,
  define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api/v1') },
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false, watch: null },
  plugins: [{ name: 'gate-stale403-fixture',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
      if (!['/phu-huynh/tien-do', '/kham-pha'].includes(req.url?.split('?')[0])) return next();
      res.setHeader('Content-Type', 'text/html');
      res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
    }); },
  }],
});
const readPair = page => page.evaluate(keys => ({ token: sessionStorage.getItem(keys.token), deadline: sessionStorage.getItem(keys.deadline) }), keys);
let browser;
let activePage;
let label;
let completed = 0;
try {
  await server.listen();
  const baseUrl = `http://127.0.0.1:${server.httpServer.address().port}`;
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const language of ['vi', 'en']) for (const width of [320, 1366]) {
    label = `${language}-${width}`;
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(({ language, keys, oldToken }) => {
      localStorage.setItem('vietverse_ui_language', language);
      // Seed once only: a later mount must observe the real interceptor's removal.
      if (!sessionStorage.getItem('__gate_fixture_initialized')) {
        sessionStorage.setItem('__gate_fixture_initialized', '1');
        sessionStorage.setItem(keys.token, oldToken);
        sessionStorage.setItem(keys.deadline, String(Date.now() + 600_000));
      }
    }, { language, keys, oldToken });
    const requests = [], pageErrors = [], consoleErrors = [], unexpected = [];
    let phase = 'old-pending';
    let releaseOld;
    const released = new Promise(resolveRelease => { releaseOld = resolveRelease; });
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === 'GET' && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) { evidence.blocked.push(url.hostname);return route.abort(); }
      if (request.method() !== 'GET' || url.origin !== baseUrl) { unexpected.push(`${request.method()} ${url.href}`); return route.abort(); }
      if (!url.pathname.startsWith('/api/')) return route.continue();
      if (url.pathname !== progressPath) { unexpected.push(url.href); return route.abort(); }
      const sent = { phase, gate: request.headers()['x-parent-gate-token'] ?? null };
      requests.push(sent);
      if (phase === 'old-pending') await released;
      const success = sent.phase === 'retry-success';
      return route.fulfill({ status: success ? 200 : 403, contentType: 'application/json', body: JSON.stringify(success
        ? { data: report } : { error: { code: 'PARENT_GATE_EXPIRED', message: 'Synthetic expired gate response' } }) });
    });
    const page = await context.newPage(); activePage = page;
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') consoleErrors.push({ text: message.text(), url: message.location().url }); });
    const observed = page.waitForRequest(request => request.method() === 'GET' && request.url() === `${baseUrl}${progressPath}`);
    await page.goto(`${baseUrl}/phu-huynh/tien-do`);
    assert.equal((await observed).headers()['x-parent-gate-token'], oldToken, 'Held request actually left with old gate');
    assert.equal((await readPair(page)).token, oldToken);
    const renewed = await page.evaluate(({ keys, newToken }) => {
      const deadline = String(Date.now() + 900_000);
      sessionStorage.setItem(keys.token, newToken); sessionStorage.setItem(keys.deadline, deadline);
      return { token: newToken, deadline };
    }, { keys, newToken });
    assert.deepEqual(await readPair(page), renewed);
    releaseOld();
    const alert = page.getByRole('alert'); await alert.waitFor();
    const afterOld = await readPair(page);
    console.log(`STALE ${label}: sent=${requests[0].gate}, installed=${JSON.stringify(renewed)}, after403=${JSON.stringify(afterOld)}, url=${new URL(page.url()).pathname}`);
    await page.screenshot({ path: resolve(shots, `${label}-old403.png`), fullPage: true });
    assert.deepEqual(afterOld, renewed, 'Old request403 must preserve the newer gate token AND deadline');
    assert.equal(new URL(page.url()).pathname, '/phu-huynh/tien-do');
    assert(await alert.isVisible(), 'Rejected old request remains an error, not fake success');
    phase = 'retry-success';
    const retry = page.getByRole('button', { name: language === 'vi' ? 'Th\u1eed l\u1ea1i ngay' : 'Try again now', exact: true });
    await retry.click();
    const stat = page.getByText(language === 'vi' ? 'B\u00e0i h\u1ecdc ho\u00e0n th\u00e0nh' : 'Lessons completed', { exact: true });
    await stat.waitFor();
    assert.equal(requests[1].gate, newToken, 'Actual UI Retry sends the renewed token');
    assert.equal(await stat.evaluate(el => el.nextElementSibling.textContent), '7');
    assert.equal(await page.getByRole('alert').count(), 0);
    assert.deepEqual(await readPair(page), renewed);
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: resolve(shots, `${label}-retry-success.png`), fullPage: true });
    phase = 'current403';
    await page.reload();
    await page.getByRole('alert').waitFor();
    assert.equal(requests[2].gate, newToken, 'Current rejected request actually sends current token');
    assert.deepEqual(await readPair(page), { token: null, deadline: null }, 'Current token403 still clears both keys');
    assert.equal(new URL(page.url()).pathname, '/phu-huynh/tien-do', 'No immediate403 redirect is claimed');
    assert(await page.getByRole('alert').isVisible());
    await page.screenshot({ path: resolve(shots, `${label}-current403.png`), fullPage: true });
    phase = 'fresh-mount';
    await page.reload();
    await page.waitForURL(`${baseUrl}/kham-pha`);
    await page.getByRole('heading', { name: 'Kids destination fixture', exact: true }).waitFor();
    assert.deepEqual(await readPair(page), { token: null, deadline: null });
    assert(requests.slice(3).every(request => request.gate === null));
    assert.deepEqual(pageErrors, []); assert.deepEqual(unexpected, []);
    const expected403Logs = consoleErrors.filter(error => error.url === `${baseUrl}${progressPath}` && /^Failed to load resource: the server responded with a status of 403/.test(error.text));
    const blockedFontLogs=consoleErrors.filter(error=>{try{return ['fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(error.url).hostname);}catch{return false;}});
    assert.deepEqual(consoleErrors.filter(error => !expected403Logs.includes(error)&&!blockedFontLogs.includes(error)), [], 'Only expected fixture403 and blocked-font diagnostics');
    evidence.matrices.push({label,requests,renewed,afterOld,afterCurrent:await readPair(page),pageErrors,consoleErrors,unexpected,status:'PASS'});
    console.log(`PASS ${label}: ${JSON.stringify(requests)}; old403 preserves pair; Retry=7lessons; current403 clears pair; fresh mount redirects; expected403 console diagnostics=${expected403Logs.length}`);
    completed++; await context.close();
  }
  assert.equal(completed, 4);
  console.log(`PASS ${completed} deterministic stale/current gate matrices; screenshots: ${shots}`);
} catch (error) {
  evidence.failure={label,message:String(error),stack:error.stack};
  console.error(`FAIL ${label}; completed=${completed}; screenshots: ${shots}`);
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: resolve(shots, `${label}-failure.png`), fullPage: true });
  throw error;
} finally {
  await browser?.close(); await server.close();
  evidence.cleanedUp=true;evidence.endedAt=new Date().toISOString();
  evidence.headAfter=git('rev-parse','HEAD');
  await writeFile(resolve(out,attempt+'-evidence.json'),JSON.stringify(evidence,null,2),{flag:'wx'});
}
