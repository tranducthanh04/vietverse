import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { runAdminJourney } from './admin-journey.mts';
import { runLearnerJourney } from './learner-journey.mts';

const root = resolve('.');
const output = resolve('plans/261015-project-qa');
const screenshotDir = join(output, 'screenshots');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const baseURL = 'http://127.0.0.1:5188';
await mkdir(screenshotDir, { recursive: true });
const results: { name: string; status: string; error?: string }[] = [];
const runGroup = process.env.QA_GROUP || 'all';
let mongo: MongoMemoryReplSet | undefined, apiServer: any, vite: any, browser: any;
const check = async (name: string, run: () => Promise<void>) => {
  try { await run(); results.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); return true; }
  catch (error) { const message = String(error); results.push({ name, status: 'FAIL', error: message }); console.log(`FAIL ${name}: ${message}`); return false; }
};
const observations: any = {};
try {
  // dotenv can only see this new empty directory, never the user's real .env.
  process.chdir(await mkdtemp(join(tmpdir(), 'vietverse-qa-env-')));
  mongo = await MongoMemoryReplSet.create({ binary: { systemBinary: process.env.QA_MONGODB_BINARY || join(root, 'node_modules/.cache/mongodb-memory-server/mongod-x64-win32-7.0.24.exe') }, replSet: { count: 1 } });
  Object.assign(process.env, {
    NODE_ENV: 'test', MONGODB_URI: mongo.getUri(), CLIENT_ORIGIN: baseURL, CLIENT_ORIGINS: '',
    JWT_SECRET: 'isolated_qa_access_secret_20261015', JWT_REFRESH_SECRET: 'isolated_qa_refresh_secret_20261015',
    GOOGLE_CLIENT_ID: '', PAYOS_CLIENT_ID: '', PAYOS_API_KEY: '', PAYOS_CHECKSUM_KEY: '',
    CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '',
    CMS_PUBLISH_ENABLED: 'true', SELF_HOSTED: '0', LEGACY_RECORDING_UPLOAD_ENABLED: 'true',
    SEED_ADMIN_EMAIL: 'admin@qa.test', SEED_ADMIN_PASSWORD: 'LocalQaAdmin2026!',
    SEED_PARENT_EMAIL: 'parent@qa.test', SEED_PARENT_PASSWORD: 'LocalQaParent2026!',
  });
  assert(process.env.MONGODB_URI.startsWith('mongodb://127.0.0.1:'));
  await mongoose.connect(process.env.MONGODB_URI);
  const { runSeed } = await import('../../server/src/seeds/seed.js');
  const { app } = await import('../../server/src/app.js');
  const { Lesson, Stage, Child, Story, CultureArticle, LessonProgress, ShopItem, User } = await import('../../server/src/models/index.js');
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  await runSeed({ demoUsers: true });
  const stage = await Stage.findOne({ order: 1 }).orFail();
  const lesson = await Lesson.findOne({ stageId: stage._id, order: 1 }).orFail();
  const story = await Story.findOne().orFail();
  const culture = await CultureArticle.findOne().orFail();
  const child = await Child.findOne().orFail();
  child.name = 'QA Zero Progress'; await child.save();
  await LessonProgress.create({ childId: child._id, lessonId: lesson._id, status: 'in_progress', scorePercent: 0, stars: 0 });
  await ShopItem.create({ name: 'QA avatar', type: 'virtual', category: 'avatar', costPoints: 1, assetUrl: '/vite.svg', active: true });
  const fixture = {
    lessonId: String(lesson._id), passage: lesson.activities[0].targetWord,
    choiceCorrect: lesson.activities.find(a => a.type === 'listen_choose')!.options![0].text,
    choiceWrong: lesson.activities.find(a => a.type === 'listen_choose')!.options![1].text,
    blankCorrect: lesson.activities.find(a => a.type === 'fill_blank')!.blanks![0].missing,
    expectedOrder: lesson.activities.find(a => a.type === 'sort_order')!.orderedItems,
    reviewCorrect: lesson.activities.find(a => a.type === 'review')!.options![0].text, rewardName: 'QA avatar',
    cultureId: String(culture._id), correctCultureOption: culture.quiz[0].options[culture.quiz[0].correctAnswer],
    wrongCultureOption: culture.quiz[0].options[(culture.quiz[0].correctAnswer + 1) % culture.quiz[0].options.length],
  };
  if (runGroup === 'activities') {
    const { ContentService } = await import('../../server/src/modules/admin/content/content.service.js');
    const { publishContent } = await import('../../server/src/modules/admin/content/content.publish.js');
    const admin = await User.findOne({ email: 'admin@qa.test' }).orFail();
    const draft = await ContentService.startDraft('lesson', fixture.lessonId, admin.id);
    const activities = [
      { id: '', type: 'multi_select', prompt: 'Chọn M', options: [{ id: 'm1', text: 'M' }, { id: 'b', text: 'B' }, { id: 'm2', text: 'M' }], correctAnswer: ['m1', 'm2'] },
      { id: '', type: 'group_sort', prompt: 'Phân nhóm', options: [{ id: 'me', text: 'mẹ' }, { id: 'ba', text: 'bà' }], groups: [{ id: 'm', label: 'M' }, { id: 'b', label: 'B' }], correctAnswer: { me: 'm', ba: 'b' } },
      { id: '', type: 'fill_blanks', prompt: 'Điền', template: 'Bé {{verb}} {{object}}.', blankSlots: [{ id: 'verb', label: 'Hành động', acceptedAnswers: ['đọc'] }, { id: 'object', label: 'Đồ vật', acceptedAnswers: ['sách'] }] },
      { id: '', type: 'follow_steps', prompt: 'Thực hiện', steps: [{ id: 'stand', text: 'Đứng lên' }] },
    ];
    const saved = await ContentService.saveDraft('lesson', fixture.lessonId, { ...draft.payload, activities } as any, draft.draftVersion, admin.id);
    await publishContent('lesson', fixture.lessonId, { expectedDraftVersion: saved.draftVersion, baseContentVersion: 0 }, admin.id);
  }
  await new Promise<void>((resolve, reject) => { apiServer = app.listen(5515, '127.0.0.1', resolve); apiServer.once('error', reject); });
  process.chdir(join(root, 'client'));
  vite = await createServer({ root: join(root, 'client'), envFile: false,
    define: { 'import.meta.env.VITE_API_URL': JSON.stringify('/api/v1'), 'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(''), 'import.meta.env.VITE_DIRECT_RECORDING_UPLOAD': JSON.stringify('false') },
    server: { host: '127.0.0.1', port: 5188, strictPort: true, hmr: false, watch: null,
      proxy: { '/api': { target: 'http://127.0.0.1:5515', changeOrigin: true } } },
  });
  await vite.listen();
  browser = await chromium.launch({ headless: true, args: ['--use-fake-device-for-media-stream'], executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  console.log('Isolated frontend/API/replica-set ready; external credentials disabled.');
  if (runGroup === 'all' || runGroup === 'learner') {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  await context.route('**/*', (route: any) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors: string[] = [];
  page.on('pageerror', (err: Error) => errors.push(err.message));
  await check('public: home, pricing, 404 and mobile menu', async () => {
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(baseURL);
      await page.locator('h1').waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (width === 390) {
        await page.getByRole('button', { name: 'Mở menu điều hướng' }).click();
        assert.equal(await page.getByRole('button', { name: 'Đóng menu điều hướng' }).getAttribute('aria-expanded'), 'true');
        await page.screenshot({ path: join(screenshotDir, 'public-mobile-menu.png'), fullPage: true });
      }
      await page.goto(`${baseURL}/gia`);
      await page.getByText('250.000đ', { exact: true }).waitFor();
      await page.getByText('990.000đ', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.goto(`${baseURL}/qa-does-not-exist`);
    await page.getByRole('heading', { name: 'Trang không tìm thấy (404)', exact: true }).waitFor();
  });
  await check('public: stories search, empty result, detail and culture', async () => {
    await page.goto(`${baseURL}/kho-truyen`);
    await page.getByRole('heading', { name: story.title, exact: true }).waitFor();
    const search = page.getByRole('textbox', { name: 'Tìm truyện hoặc đồng dao' });
    await search.fill('qa-no-story-20261015');
    await page.getByText('Chưa có câu chuyện nào phù hợp.', { exact: true }).waitFor();
    await search.fill(story.title);
    await page.getByRole('heading', { name: story.title, exact: true }).click();
    await page.waitForURL(`${baseURL}/kho-truyen/${story._id}`);
    await page.getByRole('heading', { level: 1, name: story.title, exact: true }).waitFor();
    await page.screenshot({ path: join(screenshotDir, 'story-mobile.png'), fullPage: true });
    await page.goto(`${baseURL}/van-hoa/${culture._id}`);
    await page.getByRole('heading', { level: 1, name: culture.title, exact: true }).waitFor();
    await page.getByRole('button', { name: 'Đăng nhập để nhận điểm', exact: true }).waitFor();
  });
  await check('public: unauthenticated protected route redirects to login', async () => {
    await page.goto(`${baseURL}/kham-pha`);
    await page.waitForURL(/\/dang-nhap/);
    await page.locator('#login-email').waitFor();
  });
  await check('public: no uncaught JavaScript errors', async () => assert.deepEqual(errors, []));
  await context.close();
  observations.learner = await runLearnerJourney({ browser, baseURL, screenshotDir, check, fixture });
  }
  if (runGroup === 'all' || runGroup === 'admin') await runAdminJourney({ browser, baseURL, screenshotDir, check });
  if (runGroup === 'activities') {
    const { runNewActivitiesJourney } = await import('./new-activities-journey.mts');
    observations.activities = await runNewActivitiesJourney({ browser, baseURL, screenshotDir, check, fixture });
  }
} finally {
  await browser?.close();
  await vite?.close();
  if (apiServer) await new Promise<void>(resolve => apiServer.close(() => resolve()));
  await mongoose.disconnect();
  await mongo?.stop();
  await writeFile(join(output, `browser-results-${runGroup}.json`), JSON.stringify({ results, observations }, null, 2));
  console.log(`RESULT: ${results.filter(r => r.status === 'PASS').length} passed / ${results.filter(r => r.status === 'FAIL').length} failed; isolated services stopped.`);
}
if (results.some(r => r.status === 'FAIL')) process.exitCode = 1;
