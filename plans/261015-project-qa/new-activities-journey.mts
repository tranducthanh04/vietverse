import assert from 'node:assert/strict';
import { join } from 'node:path';
import { VI_LOCALES } from '../../client/src/locales/vi.ts';

export async function runNewActivitiesJourney({ browser, baseURL, screenshotDir, check, fixture }: any) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const origin = new URL(baseURL).origin;
  const observations: string[] = [];
  const screenshots: string[] = [];
  const pageErrors: string[] = [];
  const blockedExternal = new Set<string>();
  await context.route('**/*', (route: any) => {
    const url = new URL(route.request().url());
    if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    blockedExternal.add(url.origin);
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error: Error) => pageErrors.push(error.message));
  const click = (name: string) => page.getByRole('button', { name, exact: true }).click();
  const actionResponse = async (path: string, action: () => Promise<unknown>, method = 'GET') => {
    const response = page.waitForResponse((r: any) => new URL(r.url()).pathname === path && r.request().method() === method)
      .then(async (r: any) => ({ status: r.status(), body: await r.json() }));
    const [result, triggered] = await Promise.allSettled([response, Promise.resolve().then(action)]);
    if (triggered.status === 'rejected') throw triggered.reason;
    if (result.status === 'rejected') throw result.reason;
    return result.value;
  };
  const layout = async (name: string) => {
    await check(`new activities: ${name} fits 390px viewport`, async () => {
      const path = join(screenshotDir, `new-activity-${name}-390.png`);
      await page.screenshot({ path, fullPage: true });
      screenshots.push(path);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scrollWidth <= dimensions.width, JSON.stringify(dimensions));
    });
  };
  const neutral = async (selfReported = false) => {
    await page.getByRole('status').filter({ hasText: selfReported ? 'Đã ghi xác nhận của bé' : 'Đã ghi câu trả lời' }).waitFor();
    assert.equal(await page.getByText(VI_LOCALES.lesson.correctPraise, { exact: true }).count(), 0);
    assert.equal(await page.getByText(VI_LOCALES.lesson.tryAgain, { exact: true }).count(), 0);
  };
  const blocked = (stage: string) => observations.push(`NOT RUN: ${stage}; prerequisite failed.`);
  const results = () => ({ observations, screenshots, pageErrors, blockedExternal: [...blockedExternal] });
  try {
    const entered = await check('new activities: parent login and published four-activity lesson load through real API', async () => {
      await page.goto(`${baseURL}/dang-nhap`);
      await page.locator('#login-email').fill('parent@qa.test');
      await page.locator('#login-password').fill('LocalQaParent2026!');
      const response = await actionResponse('/api/v1/auth/login', () => click(VI_LOCALES.auth.loginBtn), 'POST');
      assert.equal(response.status, 200);
      await page.waitForURL('**/kham-pha');
      const picker = page.getByRole('button', { name: 'Chọn hồ sơ bé', exact: true });
      await picker.waitFor();
      assert.match(await picker.innerText(), /QA Zero Progress/);
      const lessonResponse = await actionResponse(`/api/v1/lessons/${fixture.lessonId}`, () => page.goto(`${baseURL}/hoc/${fixture.lessonId}`));
      assert.equal(lessonResponse.status, 200);
      assert.deepEqual(lessonResponse.body.data.activities.map((a: any) => a.type), ['multi_select', 'group_sort', 'fill_blanks', 'follow_steps']);
      assert.ok(lessonResponse.body.data.contentVersion > 0);
      await page.getByRole('checkbox', { name: 'Chữ M, vị trí 1', exact: true }).waitFor();
    });
    if (!entered) { blocked('all four activities/completion'); return results(); }
    const multiSelected = await check('new activities: multi-select keeps both same-letter choices after reload before submission', async () => {
      await page.getByRole('checkbox', { name: 'Chữ M, vị trí 1', exact: true }).check();
      await page.getByRole('checkbox', { name: 'Chữ M, vị trí 3', exact: true }).check();
      assert.equal(await page.getByRole('checkbox', { name: 'Chữ B, vị trí 2', exact: true }).isChecked(), false);
      await page.reload();
      const first = page.getByRole('checkbox', { name: 'Chữ M, vị trí 1', exact: true });
      await first.waitFor();
      assert.equal(await first.isChecked(), true);
      assert.equal(await page.getByRole('checkbox', { name: 'Chữ M, vị trí 3', exact: true }).isChecked(), true);
      assert.equal(await page.getByRole('button', { name: VI_LOCALES.lesson.continueBtn, exact: true }).isEnabled(), false);
    });
    await layout('multi-select');
    if (!multiSelected) { blocked('multi submission/group/fill/follow/completion'); return results(); }
    const grouped = await check('new activities: neutral multi-select submission and group-sort submission', async () => {
      await click('Gửi câu trả lời');
      await neutral();
      await click(VI_LOCALES.lesson.continueBtn);
      await page.getByRole('combobox', { name: 'Nhóm của mẹ, vị trí 1', exact: true }).selectOption('m');
      await page.getByRole('combobox', { name: 'Nhóm của bà, vị trí 2', exact: true }).selectOption('b');
    });
    await layout('group-sort');
    if (!grouped) { blocked('group submission/fill/follow/completion'); return results(); }
    const filled = await check('new activities: group submission stays neutral and both blank inputs can be filled', async () => {
      await click('Gửi câu trả lời');
      await neutral();
      await click(VI_LOCALES.lesson.continueBtn);
      await page.getByRole('textbox', { name: 'Hành động', exact: true }).fill('đọc');
      await page.getByRole('textbox', { name: 'Đồ vật', exact: true }).fill('sách');
    });
    await layout('fill-blanks');
    if (!filled) { blocked('blank submission/follow/completion'); return results(); }
    const followed = await check('new activities: blank submission stays neutral; follow-steps records explicit self-report', async () => {
      await click('Gửi câu trả lời');
      await neutral();
      await click(VI_LOCALES.lesson.continueBtn);
      await page.getByRole('checkbox', { name: 'Bước 1: Đứng lên', exact: true }).check();
      await click('Gửi xác nhận');
      await neutral(true);
    });
    await layout('follow-steps');
    if (!followed) { blocked('lesson completion'); return results(); }
    await check('new activities: real server grades published answers at 100 percent and awards 14 points', async () => {
      const response = await actionResponse(`/api/v1/lessons/${fixture.lessonId}/complete`, () => click('Hoàn thành bài'), 'POST');
      assert.equal(response.status, 200);
      const result = response.body.data;
      assert.equal(result.passed, true);
      assert.equal(result.scorePercent, 100);
      assert.equal(result.pointsEarned, 14);
      assert.equal(result.totalPoints, 14);
      assert.equal(result.progress.status, 'completed');
      await page.getByRole('dialog').getByText(VI_LOCALES.victory.congrats, { exact: true }).waitFor();
      await page.getByRole('dialog').getByText('+14 ViVi Points', { exact: true }).waitFor();
    });
    await check('new activities: no uncaught application exceptions', async () => assert.deepEqual(pageErrors, []));
    observations.push('Four activities published by real CMS service into isolated test DB; follow-steps is self-report only, not physical action verification.');
    return results();
  } finally {
    await context.close();
  }
}
