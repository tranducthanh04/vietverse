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
const shots = await mkdtemp(resolve(tmpdir(), 'vietverse-parent-stage-links-'));
const child = { _id: 'child-a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], screenTimeLimit: 0 };
const stages = ['Chặng 1: Khu rừng Chữ Cái', 'Chặng 2: Dòng sông Ghép Vần', 'Chặng 3: Cánh đồng Từ Ngữ', 'Chặng 4: Ngôi làng Câu Chuyện'].map((title, index) => ({
  id: `s${index + 1}`, _id: `s${index + 1}`, order: index + 1, title, goal: 'Khám phá tiếng Việt qua những hoạt động phù hợp.',
  totalLessons: index === 3 ? 0 : 1, completedCount: index === 0 ? 1 : 0, percentage: index === 0 ? 100 : 0,
  isCompleted: index === 0, isUnlocked: index < 2, requiresSubscription: index === 2,
  lockReason: index === 2 ? 'subscription' : index === 3 ? 'no_lessons' : null,
  lessons: index === 3 ? [] : [{ _id: `lesson-${index + 1}`, order: 1, title: `Bài học ${index + 1}`, description: 'Nội dung thử nghiệm cục bộ.', isUnlocked: index < 2, status: index === 0 ? 'completed' : 'not_started', stars: 0 }],
}));
const report = { child: { id: child._id, name: child.name, viviPoints: 0 }, overview: { totalLessonsCompleted: 1, totalRecordings: 0, storiesExplored: 0, cultureExplored: 0 }, competencies: [], journey: { stages, currentStageId: 's2', isCompleted: false }, recentActivities: [] };
const fixtureId = '/__parent-stage-fixture.js';
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ParentDashboardPage } from '/src/features/parent/ParentDashboardPage.tsx';
import { QuestMapPage } from '/src/features/quest-map/QuestMapPage.tsx';
import { ProtectedRoute } from '/src/components/ui/ProtectedRoute.tsx';
import { ChildSessionGuard } from '/src/components/ChildSessionGuard.tsx';
import { useAuthStore } from '/src/store/authStore.ts';
import { useChildStore } from '/src/store/childStore.ts';
import '/src/index.css';
useAuthStore.setState({ isLoading: false, user: { id: 'parent', email: 'qa@example.test', displayName: 'QA', role: 'parent' } });
useChildStore.setState({ children: [${JSON.stringify(child)}], activeChild: ${JSON.stringify(child)}, isLoading: false });
const h = React.createElement;
createRoot(document.getElementById('root')).render(h(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
  h(BrowserRouter, null, h(Routes, null,
    h(Route, { path: '/phu-huynh/tien-do', element: h('main', { className: 'max-w-6xl mx-auto p-4' }, h(ParentDashboardPage)) }),
    h(Route, { path: '/kham-pha', element: h(ProtectedRoute, null, h(ChildSessionGuard, null, h(QuestMapPage))) }),
    h(Route, { path: '/hoc/:id', element: h('h1', null, 'Lesson destination') })
))));
`;
process.chdir(root);
const server = await createServer({
  root, envFile: false,
  server: { host: '127.0.0.1', port: 5197, strictPort: true, hmr: false, watch: null },
  plugins: [{
    name: 'parent-stage-regression',
    resolveId(id) { if (id === fixtureId) return id; },
    load(id) { if (id === fixtureId) return fixture; },
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0];
        if (!['/phu-huynh/tien-do', '/kham-pha'].includes(path) && !path?.startsWith('/hoc/')) return next();
        res.setHeader('Content-Type', 'text/html');
        res.end(await vite.transformIndexHtml(req.url, html.replace('/src/main.tsx', fixtureId)));
      });
    },
  }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  for (const language of ['vi', 'en']) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addInitScript(language => localStorage.setItem('vietverse_ui_language', language), language);
    const errors = [];
    const unexpectedRequests = [];
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue();
      if (url.origin !== 'http://127.0.0.1:5197') { unexpectedRequests.push(url.href); return route.abort(); }
      if (!url.pathname.startsWith('/api/')) return route.continue();
      assert.equal(route.request().method(), 'GET');
      let data;
      if (url.pathname === '/api/v1/parent/progress/child-a') data = report;
      else if (url.pathname === '/api/v1/children') data = [child];
      else if (url.pathname === '/api/v1/stages' && url.searchParams.get('childId') === 'child-a') data = stages;
      else { unexpectedRequests.push(url.href); return route.abort(); }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data }) });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [320, 640, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [index, stage] of stages.entries()) {
        for (const method of ['click', 'keyboard']) {
          await page.goto('http://127.0.0.1:5197/phu-huynh/tien-do');
          const label = index === 1 ? (language === 'vi' ? 'Tiếp tục chặng' : 'Continue stage') : (language === 'vi' ? 'Xem chi tiết' : 'View details');
          const link = page.getByRole('link', { name: `${label}: ${stage.title}`, exact: true });
          await link.waitFor();
          await page.evaluate(() => document.fonts.ready);
          assert(await page.evaluate(() => [...document.fonts].some(font => font.status === 'loaded')));
          await link.scrollIntoViewIfNeeded();
          const box = await link.boundingBox();
          assert(box && box.x >= 0 && box.x + box.width <= width + 1 && box.height >= 44);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          if (method === 'keyboard') {
            for (let tabs = 0; tabs < 12 && !(await link.evaluate(el => el === document.activeElement)); tabs++) await page.keyboard.press('Tab');
            assert(await link.evaluate(el => el === document.activeElement && el.matches(':focus-visible')));
            if (index === 1 && width !== 640) await page.screenshot({ path: resolve(shots, `${language}-${width}-parent.png`), fullPage: true });
            await page.keyboard.press('Enter');
          } else await link.click();
          await page.getByRole('heading', { level: 2, name: stage.title, exact: true }).waitFor();
          assert.equal(new URL(page.url()).search, `?stage=${stage.id}&childId=child-a`);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
          const action = page.getByRole('button', { name: /^(Vào học ngay|Luyện tập lại|Start now|Practice again)$/ });
          assert.equal(await action.count(), index < 2 ? 1 : 0);
          if (index === 3) await page.getByText('0 / 0', { exact: true }).waitFor();
          if (index === 2 && method === 'keyboard' && width === 320) await page.screenshot({ path: resolve(shots, `${language}-${width}-locked.png`), fullPage: true });
        }
      }
      // Real URL/history, not just a memory router fixture.
      await page.goto('http://127.0.0.1:5197/kham-pha?stage=s2&childId=child-a');
      await page.getByRole('heading', { level: 2, name: stages[1].title, exact: true }).waitFor();
      await page.reload();
      await page.getByRole('heading', { level: 2, name: stages[1].title, exact: true }).waitFor();
      await page.getByRole('button', { name: `${language === 'vi' ? 'Chặng' : 'Stage'} 3: Cánh đồng Từ Ngữ`, exact: true }).click();
      await page.getByRole('heading', { level: 2, name: stages[2].title, exact: true }).waitFor();
      await page.goBack();
      await page.getByRole('heading', { level: 2, name: stages[1].title, exact: true }).waitFor();
      await page.goForward();
      await page.getByRole('heading', { level: 2, name: stages[2].title, exact: true }).waitFor();
      await page.goto('http://127.0.0.1:5197/kham-pha?stage=unknown');
      await page.getByRole('alert').waitFor();
      assert.equal(await page.getByRole('heading', { level: 2 }).count(), 0);
      await page.goto('http://127.0.0.1:5197/kham-pha?stage=s2&childId=unknown');
      await page.getByRole('alert').waitFor();
      assert.equal(await page.getByRole('heading', { level: 2 }).count(), 0);
      console.log(`PASS ${language} ${width}px: 8 parent links; locked/empty; direct/reload/history/invalid/child mismatch; no overflow`);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpectedRequests, []);
    await context.close();
  }
  console.log(`PASS 48 parent-link activations plus 6 URL/history matrices; screenshots: ${shots}`);
} finally {
  await browser?.close();
  await server.close();
}
