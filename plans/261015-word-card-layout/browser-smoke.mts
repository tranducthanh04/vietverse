import assert from 'node:assert/strict';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = resolve('client');
process.chdir(root);
const shots = process.env.WORD_CARD_SCREENSHOT_DIR || await mkdtemp(resolve(tmpdir(), 'vietverse-word-card-'));
await mkdir(shots, { recursive: true });
const fixtureId = '/__word-card-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { WordCardActivity } from '/src/features/lesson-player/activities/WordCardActivity.tsx';
import '/src/index.css';
const activity = JSON.parse(new URLSearchParams(location.search).get('activity'));
window.completed = 0;
createRoot(document.getElementById('root')).render(React.createElement('div', {className:'min-h-screen bg-cream flex flex-col'},
  React.createElement('header', {className:'p-4 bg-white border-b-2'}, 'Lesson layout fixture'),
  React.createElement('main', {className:'flex-1 flex flex-col justify-center items-center py-6 px-4'},
    React.createElement(WordCardActivity, {activity, onComplete:()=>window.completed++})),
  React.createElement('footer', {className:'p-4 bg-white border-t-2 sticky bottom-0'},
    React.createElement('button', {type:'button'}, 'Next'))));
`;
const server = await createServer({
  root, envFile: false,
  server: { host: '127.0.0.1', port: 5187, strictPort: true, hmr: false, watch: null },
  plugins: [{
    name: 'word-card-layout-fixture',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__word-card?')) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="${fixtureId}"></script></body></html>`));
      });
    },
  }],
});
let browser;
const passage = 'Nh\u00e0 b\u00e9 c\u00f3 \u00f4ng, b\u00e0, b\u1ed1, m\u1eb9 v\u00e0 anh. Ai c\u0169ng th\u01b0\u01a1ng b\u00e9.';
const cases = [
  { name: 'passage', targetWord: passage },
  { name: 'letter', targetWord: 'A', targetPhonetic: 'a' },
  { name: 'word', targetWord: 'm\u1eb9' },
  { name: 'phrase', targetWord: 'b\u00e1nh ch\u01b0ng' },
  { name: 'long', targetWord: Array(8).fill(passage).join('\n') },
  { name: 'unbroken', targetWord: 'A'.repeat(90) },
  { name: 'subprompt', targetWord: 'A', subPrompt: passage, targetPhonetic: 'a' },
];
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const item of cases) {
      const activity = { id: item.name, prompt: 'C\u00f9ng \u0111\u1ecdc v\u00e0 t\u00ecm hi\u1ec3u.', hints: ['Read at your own pace.'], ...item };
      await page.goto(`http://127.0.0.1:5187/__word-card?activity=${encodeURIComponent(JSON.stringify(activity))}`);
      const target = page.getByText(item.targetWord, { exact: true });
      await target.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const bounds = await target.evaluate((el: HTMLElement) => {
        const text = el.getBoundingClientRect();
        const card = el.parentElement!.getBoundingClientRect();
        const prompt = document.querySelector('h2')!.getBoundingClientRect();
        const audio = el.parentElement!.querySelector('button')!.getBoundingClientRect();
        return { inside: text.top >= card.top && text.bottom <= card.bottom && text.left >= card.left && text.right <= card.right,
          afterPrompt: text.top >= prompt.bottom, beforeAudio: text.bottom <= audio.top,
          overflow: document.documentElement.scrollWidth > innerWidth,
          fontSize: parseFloat(getComputedStyle(el).fontSize) };
      });
      if (item.name === 'passage') await page.screenshot({ path: resolve(shots, `passage-${width}.png`), fullPage: true });
      assert(bounds.inside, `${item.name} ${width}px: text escapes card ${JSON.stringify(bounds)}`);
      assert(bounds.afterPrompt && bounds.beforeAudio, `${item.name} ${width}px: text overlaps prompt/audio`);
      assert(!bounds.overflow, `${item.name} ${width}px: horizontal page overflow`);
      if (['letter', 'word'].includes(item.name)) assert(bounds.fontSize >= 48, 'Short words must remain prominent');
      assert.equal(await page.evaluate(() => (window as any).completed), 0);
      console.log(`PASS ${item.name} ${width}px: contained, no overlap/overflow`);
    }
  }
  assert.deepEqual(errors, []);
  console.log(`PASS no browser errors; screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
