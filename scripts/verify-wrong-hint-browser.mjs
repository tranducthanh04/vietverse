import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createServer as probe } from 'node:net';

const root = resolve('.');
const mode = process.argv[2];
const selectedIds = process.argv.slice(3);
assert(['red', 'green'].includes(mode), 'Use red or green; each run has a fresh immutable output directory');
const basePin = '9b809bd3b27ea69cad2da2413825ffb8912d3f98';
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
git('merge-base', '--is-ancestor', basePin, 'HEAD');
const head = git('rev-parse', 'HEAD');
const output = await mkdtemp(join(tmpdir(), `vietverse-hint-${mode}-`));
const safe = new Set(['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'TEMP', 'TMP', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMDATA', 'SYSTEMDRIVE', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS']);
for (const key of Object.keys(process.env)) if (!safe.has(key.toUpperCase())) delete process.env[key];
for (const directory of [root, join(root, 'client'), join(root, 'server')]) {
  assert.deepEqual((await readdir(directory)).filter(name => /^\.env($|\.)/.test(name) && !/example|sample|template/.test(name)), []);
}
const sourcePaths = [
  'client/src/features/lesson-player/activities/WrongAnswerFeedback.tsx',
  'client/src/features/lesson-player/activities/ReviewActivity.tsx',
  'client/src/features/lesson-player/activities/FillBlankActivity.tsx',
  'client/src/features/lesson-player/activities/SortOrderActivity.tsx',
  'client/src/features/lesson-player/LessonPlayerPage.tsx',
  'client/src/components/ui/SupportTranslation.tsx',
  'client/src/hooks/useNarration.ts', 'client/src/store/lessonSessionStore.ts',
  'client/src/store/authStore.ts', 'client/src/store/childStore.ts', 'client/src/lib/api.ts',
  'client/src/index.css', 'client/index.html', 'client/vite.config.ts', 'client/tailwind.config.js', 'package-lock.json',
];
const hashes = {};
for (const path of sourcePaths) hashes[path] = createHash('sha256').update(await readFile(join(root, path))).digest('hex');
await writeFile(join(output, 'harness.mjs'), await readFile(new URL(import.meta.url)));
await writeFile(join(output, 'product.diff'), git('diff', basePin, '--', ...sourcePaths));
const receipt = { mode, selectedIds, basePin, head, startedAt: new Date().toISOString(), sourceHashes: hashes, results: [], forbidden: [], pageErrors: [], consoleErrors: [], requests: [], cleanedUp: false };
const save = () => writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
const child = { _id: 'child', parentId: 'parent', name: 'QA', ageGroup: '5-6', companionLanguages: ['other', 'ja', 'en'], companionLanguage: 'other', avatarId: 'star', viviPoints: 0, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 0 };
const vi = 'G\u1ee3i \u00fd QA: h\u00e3y ch\u1ecdn t\u1eeb ph\u00f9 h\u1ee3p.';
const variants = {
  short: { source: vi, translation: 'Synthetic English hint.' },
  original216: { source: vi + ' ' + 'G\u1ee3i \u00fd d\u00e0i QA. '.repeat(15), translation: 'SYNTHETIC_UNBROKEN_'.repeat(12).slice(0, 216) },
  originalRaw228: { source: vi + ' ' + 'G\u1ee3i \u00fd d\u00e0i QA. '.repeat(15), translation: 'SYNTHETIC_UNBROKEN_'.repeat(12) },
  boundaryUnbroken: { source: '\u1ebf'.repeat(5000), translation: 'W'.repeat(5000) },
  boundarySpaced: { source: 'QA g\u1ee3i \u00fd '.repeat(500).padEnd(5000, 'x').slice(0, 5000), translation: 'QA word '.repeat(625) },
};
assert.equal(variants.original216.translation.length, 216);
for (const name of ['boundaryUnbroken', 'boundarySpaced']) {
  assert.equal(variants[name].source.length, 5000); assert.equal(variants[name].translation.length, 5000);
}
function lesson(type, variant) {
  const hint = variants[variant];
  const activity = { id: type, type, prompt: 'QA text question', wrongHint: hint.source, wrongHintTranslations: { ja: { wrongHint: '   ' }, en: { wrongHint: hint.translation }, fr: { wrongHint: 'Unused synthetic French' } } };
  if (type === 'sort_order') Object.assign(activity, { orderedItems: ['A', 'B', 'C'], correctAnswer: ['A', 'B', 'C'] });
  else Object.assign(activity, { options: [{ id: 'yes', text: 'YES' }, { id: 'no', text: 'NO' }], correctAnswer: 'yes', ...(type === 'fill_blank' ? { blanks: [{ sentence: 'QA __.', missing: 'YES' }] } : {}) });
  return { _id: 'fixture', title: 'Synthetic hint QA', contentVersion: 1, totalActivities: 2, activities: [activity, { id: 'next', type: 'review', prompt: 'QA next question', options: [{ id: 'yes', text: 'YES' }, { id: 'no', text: 'NO' }], correctAnswer: 'yes' }] };
}
const fixtureId = '/__hint-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonPlayerPage } from '/src/features/lesson-player/LessonPlayerPage.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { ChildSessionGuard } from '/src/components/ChildSessionGuard.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useUiLanguageStore } from '/src/i18n/uiLanguageStore.ts';
import '/src/index.css';
const lang = new URLSearchParams(location.search).get('lang');
useAuthStore.setState({user:{id:'parent',email:'qa@example.test',displayName:'QA',role:'parent'},isLoading:false});
useUiLanguageStore.getState().setLanguage(lang); document.documentElement.lang=lang;
createRoot(document.getElementById('root')).render(React.createElement(QueryClientProvider,{client:new QueryClient({defaultOptions:{queries:{retry:false}}})},
  React.createElement(BrowserRouter,null,React.createElement(Routes,null,
    React.createElement(Route,{path:'/hoc/:lessonId',element:React.createElement(ProtectedRoute,null,React.createElement(ChildSessionGuard,null,React.createElement(LessonPlayerPage)))})))));
`;
const { chromium } = createRequire(import.meta.url)('C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { createServer } = await import('vite');
const html = await readFile(join(root, 'client/index.html'), 'utf8');
const port = await new Promise((done, fail) => { const s = probe(); s.on('error', fail); s.listen(0, '127.0.0.1', () => { const value = s.address().port; s.close(() => done(value)); }); });
const origin = `http://127.0.0.1:${port}`;
let server, browser;
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
    await new Promise(done => requestAnimationFrame(done));
  });
}
async function keyboardActivate(page, target) {
  for (let i = 0; i < 24; i++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate(e => e === document.activeElement)) { await page.keyboard.press('Enter'); return; }
  }
  assert.fail('Target not reachable by actual Tab order');
}
async function targetGeometry(target) {
  await target.scrollIntoViewIfNeeded();
  const read = () => target.evaluate(e => {
    const r = e.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, hit: !!hit && e.contains(hit), viewport: innerWidth, scrollY };
  });
  const initial = await read();
  if (initial.hit) return initial;
  // Nearest scrolling can leave a visible target behind the player's sticky footer.
  await target.evaluate(async e => {
    e.scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise(done => requestAnimationFrame(done));
  });
  return { ...await read(), initial };
}
async function measure(page) {
  return page.locator('main [role="status"]').evaluate(card => {
    const rect = e => { const r = e.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const violations = [];
    const c = rect(card), main = card.closest('main'), m = rect(main);
    if (c.left < m.left - 1 || c.right > m.right + 1 || c.right > innerWidth + 1 || c.left < -1) violations.push('card-outside-main');
    if (main.scrollWidth > main.clientWidth + 1) violations.push('main-horizontal-overflow');
    const texts = [card.querySelector('p > span'), card.querySelector('[lang]')].filter(Boolean).map(e => {
      const range = document.createRange(); range.selectNodeContents(e);
      const bounds = [...range.getClientRects()].filter(r => r.width && r.height);
      const er = rect(e), style = getComputedStyle(e);
      for (const r of bounds) {
        if (r.left < c.left + 1 || r.right > c.right - 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1) violations.push('text-outside-card');
        for (let ancestor = e; ancestor; ancestor = ancestor.parentElement) {
          const cs = getComputedStyle(ancestor), ar = rect(ancestor);
          if (/(hidden|clip)/.test(cs.overflowX) && (r.left < ar.left - 1 || r.right > ar.right + 1)) violations.push('clipped-x');
          if (/(hidden|clip)/.test(cs.overflowY) && (r.top < ar.top - 1 || r.bottom > ar.bottom + 1)) violations.push('clipped-y');
        }
      }
      return { text: e.textContent, lang: e.getAttribute('lang'), rect: er, lines: bounds.length, fontSize: style.fontSize, overflowWrap: style.overflowWrap, wordBreak: style.wordBreak };
    });
    return { viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, main: m, card: c, texts, violations: [...new Set(violations)], footer: rect(document.querySelector('footer')), footerButton: rect(document.querySelector('footer button')), fontLoaded: [...document.fonts].some(f => f.family.includes('Be Vietnam Pro') && f.status === 'loaded') };
  });
}
async function textEndGeometry(target) {
  return target.evaluate(async e => {
    const text = [...e.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
    const range = document.createRange();
    range.setStart(text, text.length - 1); range.setEnd(text, text.length);
    const before = range.getBoundingClientRect();
    const footerTop = document.querySelector('footer').getBoundingClientRect().top;
    window.scrollBy({ top: before.top - footerTop / 2, behavior: 'instant' });
    await new Promise(done => requestAnimationFrame(done));
    const r = range.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return { top: r.top, bottom: r.bottom, footerTop: document.querySelector('footer').getBoundingClientRect().top, scrollY, hit: !!hit && e.contains(hit) };
  });
}
try {
  process.chdir(join(root, 'client'));
  process.env.VITE_API_URL = '/api/v1';
  server = await createServer({ root: join(root, 'client'), envFile: false,
    cacheDir: join(root, 'client/node_modules/.vite-hint-qa'),
    server: { host: '127.0.0.1', port, strictPort: true, hmr: false, watch: null, proxy: {} },
    plugins: [{ name: 'hint-qa', resolveId(id) { if (id === fixtureId) return id; }, load(id) { if (id === fixtureId) return fixture; },
      configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/hoc/')) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
      }); },
    }],
  });
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const cases = [];
  for (const lang of ['vi', 'en']) for (const width of [320, 390, 640, 1366]) for (const type of ['review', 'fill_blank', 'sort_order']) {
    for (const variant of mode === 'green' ? Object.keys(variants).filter(v => v !== 'originalRaw228') : ['short']) cases.push({ lang, width, type, variant });
  }
  if (mode === 'red') for (const [lang, width] of [['vi', 320], ['en', 1366]]) cases.push({ lang, width, type: 'review', variant: 'original216' });
  for (const [lang, width] of [['vi', 320], ['en', 1366]]) cases.push({ lang, width, type: 'review', variant: 'originalRaw228' });
  const caseId = item => `${item.lang}-${item.width}-${item.type}-${item.variant}`;
  for (const id of selectedIds) assert(cases.some(item => caseId(item) === id), `Unknown case: ${id}`);
  for (const item of cases) {
    const { lang, width, type, variant } = item, id = `${lang}-${width}-${type}-${variant}`;
    if (selectedIds.length && !selectedIds.includes(id)) continue;
    const record = { id, ...item };
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    let page;
    try {
      await context.addInitScript(() => {
        window.__forbiddenAudio = [];
        const deny = name => function () { window.__forbiddenAudio.push(name); throw new Error('Audio out of scope: ' + name); };
        HTMLMediaElement.prototype.play = deny('play');
        if (window.speechSynthesis) window.speechSynthesis.speak = deny('speak');
        if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = deny('getUserMedia');
        window.MediaRecorder = deny('MediaRecorder');
      });
      const dto = lesson(type, variant);
      await context.route('**/*', async route => {
        const req = route.request(), u = new URL(req.url());
        if (req.method() === 'GET' && u.protocol === 'https:' && ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) return route.continue();
        if (u.origin !== origin || req.resourceType() === 'media') { receipt.forbidden.push({ id, url: req.url(), method: req.method() }); return route.abort(); }
        if (u.pathname.startsWith('/api/')) {
          receipt.requests.push({ id, path: u.pathname, method: req.method() });
          if (req.method() === 'GET' && ['/api/v1/children', '/api/v1/lessons/fixture'].includes(u.pathname)) return route.fulfill({ json: { success: true, data: u.pathname.endsWith('/children') ? [child] : dto } });
          receipt.forbidden.push({ id, path: u.pathname, method: req.method() }); return route.abort();
        }
        if (req.method() !== 'GET') { receipt.forbidden.push({ id, path: u.pathname, method: req.method() }); return route.abort(); }
        return route.continue();
      });
      page = await context.newPage(); page.setDefaultTimeout(12000);
      page.on('pageerror', e => receipt.pageErrors.push({ id, message: e.message }));
      page.on('console', msg => { if (msg.type() === 'error') receipt.consoleErrors.push({ id, message: msg.text() }); });
      await page.goto(`${origin}/hoc/fixture?lang=${lang}`);
      await page.getByRole('heading', { name: 'QA text question', exact: true }).waitFor();
      assert.equal(await page.locator('main [role="status"]').count(), 0);
      const button = text => page.getByRole('button', { name: text, exact: true });
      if (type === 'sort_order') {
        await keyboardActivate(page, button('C'));
        await keyboardActivate(page, button(lang === 'vi' ? 'X\u1ebfp l\u1ea1i' : 'Reorder'));
        assert.equal(await button('C').count(), 1);
        for (const value of ['C', 'B', 'A']) await keyboardActivate(page, button(value));
        record.fullSortResetVisible = await button(lang === 'vi' ? 'X\u1ebfp l\u1ea1i' : 'Reorder').count() > 0;
      } else await keyboardActivate(page, button('NO'));
      await page.locator('main [role="status"]').waitFor(); await settle(page);
      record.geometry = await measure(page);
      const status = page.locator('main [role="status"]');
      assert.equal(await status.getAttribute('aria-live'), 'polite');
      assert.equal(record.geometry.texts[0].text, variants[variant].source);
      assert.equal(record.geometry.texts[1].text, variants[variant].translation.trim());
      assert.equal(record.geometry.texts[1].lang, 'en');
      assert.equal(await page.locator('audio,video').count(), 0);
      record.audioCalls = await page.evaluate(() => window.__forbiddenAudio);
      assert.deepEqual(record.audioCalls, []);
      if (width === 320 || width === 1366) await page.screenshot({ path: join(output, id + '.png'), fullPage: variant !== 'boundaryUnbroken' });
      if (selectedIds.length && variant.startsWith('boundary')) {
        record.textEnds = [];
        for (const selector of ['p > span', '[lang]']) {
          const end = await textEndGeometry(status.locator(selector));
          record.textEnds.push(end);
          assert(end.hit && end.top >= 0 && end.bottom < end.footerTop, 'Last text character must be scroll-reachable above footer');
        }
        await page.screenshot({ path: join(output, id + '-text-end.png') });
      }
      // Record footer baseline separately; do not relax feedback/main geometry for it.
      record.footerBaselineOverflow = record.geometry.footerButton.right > width + 1;
      if (type !== 'sort_order') {
        record.answerTarget = await targetGeometry(button('YES'));
        assert(record.answerTarget.width >= 44 && record.answerTarget.height >= 44 && record.answerTarget.hit, 'Answer target must remain reachable');
        if (selectedIds.length) await page.screenshot({ path: join(output, id + '-answer-reachable.png') });
        await keyboardActivate(page, button('YES'));
        await status.waitFor({ state: 'hidden' });
      }
      const next = page.locator('footer button');
      record.continueTarget = await targetGeometry(next);
      record.continueContained = record.continueTarget.right <= width + 1;
      assert(record.continueTarget.height >= 44 && record.continueTarget.hit, 'Continue target must remain reachable');
      await keyboardActivate(page, next);
      await page.getByRole('heading', { name: 'QA next question', exact: true }).waitFor();
      assert.equal(await page.locator('main [role="status"]').count(), 0);
      record.session = await page.evaluate(async () => (await import('/src/store/lessonSessionStore.ts')).useLessonSessionStore.getState().currentSession);
      assert.equal(record.session.currentStepIndex, 1); assert.equal(record.session.hearts, 2);
      assert.equal(record.session.answers[0].isCorrect, type !== 'sort_order');
      record.navigationClears = true;
      assert.deepEqual(record.geometry.violations, [], 'Feedback must stay inside the actual player');
      record.status = 'PASS';
    } catch (error) {
      record.status = 'FAIL'; record.error = String(error); record.stack = error.stack;
      if (page) await page.screenshot({ path: join(output, id + '-failure.png') }).catch(() => {});
    } finally { await context.close(); }
    receipt.results.push(record); await save(); console.log(record.status, id, record.error ?? '');
  }
} catch (error) { receipt.fatal = String(error); process.exitCode = 1; }
finally {
  if (browser) await browser.close();
  if (server) await server.close();
  receipt.headAfter = git('rev-parse', 'HEAD'); receipt.endedAt = new Date().toISOString(); receipt.cleanedUp = true;
  await save();
  if (receipt.fatal || receipt.results.some(r => r.status === 'FAIL') || receipt.forbidden.length || receipt.pageErrors.length || receipt.consoleErrors.length) process.exitCode = 1;
  console.log(JSON.stringify({ output, passed: receipt.results.filter(r => r.status === 'PASS').length, failed: receipt.results.filter(r => r.status === 'FAIL').length, fatal: receipt.fatal, forbidden: receipt.forbidden.length, pageErrors: receipt.pageErrors.length, consoleErrors: receipt.consoleErrors.length }));
}
