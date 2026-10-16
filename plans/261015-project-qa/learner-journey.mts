import assert from 'node:assert/strict';
import { join } from 'node:path';
import { VI_LOCALES } from '../../client/src/locales/vi.ts';

// These selectors intentionally match the real Vietnamese UI, not a test-only route.
export async function runLearnerJourney({ browser, baseURL, screenshotDir, check, fixture }: any) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const origin = new URL(baseURL).origin;
  const observations: string[] = [];
  const screenshots: string[] = [];
  const pageErrors: string[] = [];
  const blockedExternal = new Set<string>();
  await context.route('**/*', async (route: any) => {
    const url = new URL(route.request().url());
    if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) return route.continue();
    blockedExternal.add(url.origin);
    return route.abort();
  });
  // Chromium rejects every permission not explicitly granted, including microphone.
  await context.grantPermissions([], { origin });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (error: Error) => pageErrors.push(error.message));
  const visible = (text: string) => page.getByText(text, { exact: true }).waitFor({ state: 'visible' });
  const click = (name: string) => page.getByRole('button', { name, exact: true }).click();
  const shot = async (name: string) => {
    const path = join(screenshotDir, `${name}.png`);
    await page.screenshot({ path, fullPage: true });
    screenshots.push(path);
  };
  const skipped = (name: string) => observations.push(`NOT RUN: ${name}; prerequisite failed.`);
  const actionResponse = async (path: string, action: () => Promise<unknown>, method = 'GET') => {
    // Consume body immediately; handle both promises even if the UI action fails.
    const response = page.waitForResponse((r: any) => new URL(r.url()).pathname === path && r.request().method() === method)
      .then(async (r: any) => ({ status: r.status(), body: await r.json() }));
    const [result, triggered] = await Promise.allSettled([response, Promise.resolve().then(action)]);
    if (triggered.status === 'rejected') throw triggered.reason;
    if (result.status === 'rejected') throw result.reason;
    return result.value;
  };
  let childId: string;
  try {
    let registerRequests = 0;
    page.on('request', (request: any) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/auth/register') registerRequests++;
    });
    const registered = await check('learner: password confirmation rejects mismatch, then UI registration succeeds', async () => {
      await page.goto(`${baseURL}/dang-ky`);
      await page.locator('#register-name').fill('Local QA Parent');
      await page.locator('#register-email').fill('learner@qa.test');
      await page.locator('#register-password').fill('LocalQaParent2026!');
      await page.locator('#register-confirm-password').fill('Mismatch2026!');
      await click(VI_LOCALES.auth.registerBtn);
      await page.getByRole('alert').filter({ hasText: 'Mật khẩu xác nhận chưa khớp' }).waitFor();
      assert.equal(registerRequests, 0, 'Mismatch must not reach registration API');
      await page.locator('#register-confirm-password').fill('LocalQaParent2026!');
      const response = await actionResponse('/api/v1/auth/register', () => click(VI_LOCALES.auth.registerBtn), 'POST');
      assert.equal(response.status, 201);
      await page.waitForURL('**/bat-dau');
    });
    if (!registered) {
      skipped('onboarding, lesson, culture, Parent Gate, admin denial');
      return { observations, screenshots, pageErrors, blockedExternal: [...blockedExternal] };
    }
    const onboarded = await check('learner: four-step child onboarding persists a profile and opens map', async () => {
      await page.locator('#child-name-input').fill('QA Learner');
      await click('Tiếp tục cùng Sao Lí Lắc');
      await click('Tiếp tục bước tiếp theo');
      await click('Hoàn tất thiết lập');
      const response = await actionResponse('/api/v1/children', () => click('BẮT ĐẦU CHUYẾN PHIÊU LƯU!'), 'POST');
      assert.equal(response.status, 201);
      const child = response.body.data;
      childId = child._id;
      assert.equal(child.name, 'QA Learner');
      assert.equal(child.viviPoints, 0);
      await page.waitForURL('**/kham-pha');
      await page.getByRole('button', { name: 'Chọn hồ sơ bé' }).waitFor();
    });
    if (!onboarded) {
      skipped('lesson, culture, Parent Gate, admin denial');
      return { observations, screenshots, pageErrors, blockedExternal: [...blockedExternal] };
    }
    const lessonOpened = await check('learner: actual seeded passage fits mobile and desktop lesson route', async () => {
      await page.goto(`${baseURL}/hoc/${fixture.lessonId}`);
      for (const width of [390, 1366]) {
        await page.setViewportSize({ width, height: 900 });
        const passage = page.getByText(fixture.passage, { exact: true });
        await passage.waitFor();
        const geometry = await passage.evaluate((element: HTMLElement) => {
          const text = element.getBoundingClientRect();
          const card = element.parentElement!.getBoundingClientRect();
          const prompt = document.querySelector('main h2')?.getBoundingClientRect();
          return {
            inside: text.left >= card.left && text.right <= card.right && text.top >= card.top && text.bottom <= card.bottom,
            belowPrompt: !prompt || text.top >= prompt.bottom,
            horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        assert.deepEqual(geometry, { inside: true, belowPrompt: true, horizontalOverflow: false });
        await shot(`learner-passage-${width}`);
      }
    });
    let reachedRecording = false;
    if (lessonOpened) {
      reachedRecording = await check('learner: choice correction, fill blank, ordering and reload preserve lesson progress', async () => {
        await click(VI_LOCALES.lesson.continueBtn);
        await click(fixture.choiceWrong);
        await visible(VI_LOCALES.lesson.tryAgain);
        await click(fixture.choiceCorrect);
        await visible(VI_LOCALES.lesson.correctPraise);
        await click(VI_LOCALES.lesson.continueBtn);
        await click(fixture.blankCorrect);
        await visible(VI_LOCALES.lesson.correctPraise);
        await click(VI_LOCALES.lesson.continueBtn);
        for (const item of fixture.expectedOrder) await click(item);
        await visible(VI_LOCALES.lesson.correctPraise);
        await click(VI_LOCALES.lesson.continueBtn);
        await page.getByRole('button', { name: 'Bắt đầu ghi âm', exact: true }).waitFor();
        await page.reload();
        await page.getByRole('button', { name: 'Bắt đầu ghi âm', exact: true }).waitFor();
        assert.equal(new URL(page.url()).pathname, `/hoc/${fixture.lessonId}`);
        assert.equal(await page.getByRole('button', { name: VI_LOCALES.lesson.continueBtn, exact: true }).isEnabled(), false);
      });
    } else skipped('choice/fill/order/reload journey');
    if (reachedRecording) {
      await check('learner: denied microphone shows an error and cannot complete the activity', async () => {
        await click('Bắt đầu ghi âm');
        await page.getByText('Không thể mở micro. Vui lòng cấp quyền micro để tiếp tục!', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: VI_LOCALES.lesson.continueBtn, exact: true }).isEnabled(), false);
        assert.equal(await page.getByRole('button', { name: 'Gửi giọng đọc của bé', exact: true }).count(), 0);
        await shot('learner-microphone-denied');
      });
      const recorded = await check('learner: synthetic browser microphone records and uploads through real local API', async () => {
        await context.grantPermissions(['microphone'], { origin });
        await click('Bắt đầu ghi âm');
        await page.getByText(/Đang lắng nghe bé đọc\.\.\. \([1-9]\d*s\)/).waitFor();
        await click('Dừng ghi âm');
        const response = await actionResponse('/api/v1/recordings', () => click('Gửi giọng đọc của bé'), 'POST');
        assert.equal(response.status, 201);
        const recording = response.body.data;
        assert.match(recording.id ?? recording._id, /^[a-f\d]{24}$/i);
        await visible(VI_LOCALES.lesson.uploadSuccess);
      });
      observations.push('Positive audio capture uses Chromium synthetic media, real MediaRecorder and real local legacy upload/storage; it does not validate a physical microphone or Cloudinary.');
      if (recorded) {
        await check('learner: recording plus review completes lesson and unlocks lesson two after reload', async () => {
          await click(VI_LOCALES.lesson.continueBtn);
          await click(fixture.reviewCorrect);
          const response = await actionResponse(`/api/v1/lessons/${fixture.lessonId}/complete`, () => click('Hoàn thành bài'), 'POST');
          assert.equal(response.status, 200);
          const result = response.body.data;
          assert.equal(result.passed, true);
          assert.equal(result.progress.status, 'completed');
          assert.ok(result.pointsEarned > 0);
          await page.getByRole('dialog').getByText(VI_LOCALES.victory.congrats, { exact: true }).waitFor();
          await actionResponse('/api/v1/stages', () => click(VI_LOCALES.victory.btnBackMap));
          await page.waitForURL('**/kham-pha');
          const stagesResponse = await actionResponse('/api/v1/stages', () => page.reload());
          const stages = stagesResponse.body.data;
          const second = stages.find((s: any) => s.order === 1).lessons.find((lesson: any) => lesson.order === 2);
          assert.equal(second.isUnlocked, true);
          const card = page.getByRole('heading', { name: second.title, exact: true }).locator('../..');
          await card.getByRole('button', { name: VI_LOCALES.map.startLesson, exact: true }).waitFor();
        });
      } else skipped('lesson completion/unlock');
    } else skipped('microphone denial, capture/upload and lesson completion');

    const cultureReady = await check('culture: wrong answer stays retryable and awards no points', async () => {
      await page.goto(`${baseURL}/van-hoa/${fixture.cultureId}`);
      await click(fixture.wrongCultureOption);
      const response = await actionResponse(`/api/v1/culture/${fixture.cultureId}/quiz`, () => click('Gửi đáp án & Nhận điểm'), 'POST');
      assert.equal(response.status, 200);
      const result = response.body.data;
      assert.equal(result.isAllCorrect, false);
      assert.equal(result.pointsAwarded, 0);
      await page.getByRole('status').filter({ hasText: 'Hãy chọn lại đáp án' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Gửi đáp án & Nhận điểm', exact: true }).isEnabled(), true);
    });
    if (cultureReady) {
      await check('culture: correct answer awards once; browser reload and replay award zero', async () => {
        for (const expectedPoints of [5, 0]) {
          if (expectedPoints === 0) await page.reload();
          await click(fixture.correctCultureOption);
          const response = await actionResponse(`/api/v1/culture/${fixture.cultureId}/quiz`, () => click('Gửi đáp án & Nhận điểm'), 'POST');
          assert.equal(response.status, 200);
          const result = response.body.data;
          assert.equal(result.isAllCorrect, true);
          assert.equal(result.pointsAwarded, expectedPoints);
          await visible(expectedPoints ? 'Bé nhận được +5 ViVi Points!' : 'Bé đã trả lời đúng. Lượt này không có điểm thưởng mới.');
        }
      });
    } else skipped('correct culture answer/replay');

    await check('points: ledger balance, virtual redemption and equip preserve the expected balance', async () => {
      const historyPath = `/api/v1/points/children/${childId}`;
      const historyResponse = await actionResponse(historyPath, () => page.goto(`${baseURL}/diem-thuong`));
      const initial = historyResponse.body.data;
      assert.ok(initial.viviPoints >= 1, 'Need earned points before redeeming');
      assert.ok(initial.history.some((tx: any) => tx.reason === 'culture_quiz' && tx.delta === 5));
      await page.getByTestId('points-balance').filter({ hasText: `${initial.viviPoints} ViVi Points` }).waitFor();
      const item = page.getByRole('article').filter({ has: page.getByRole('heading', { name: fixture.rewardName, exact: true }) });
      await item.getByRole('button', { name: 'Đổi thưởng →', exact: true }).click();
      const redeemed = await actionResponse('/api/v1/points/shop/redeem', () => page.getByRole('dialog').getByRole('button', { name: 'Xác Nhận Đổi Quà', exact: true }).click(), 'POST');
      assert.equal(redeemed.status, 200);
      const expectedBalance = initial.viviPoints - 1;
      assert.equal(redeemed.body.data.remainingPoints, expectedBalance);
      await page.getByRole('status').filter({ hasText: VI_LOCALES.shop.redeemSuccess }).waitFor();
      await page.goto(`${baseURL}/phong-bau-vat`);
      const equipped = await actionResponse(`/api/v1/points/children/${childId}/equip`, () => click(`Dùng ${fixture.rewardName}`), 'PATCH');
      assert.equal(equipped.status, 200);
      assert.ok(equipped.body.data.equippedAvatarItemId);
      await visible('Đang dùng');
      const updatedHistoryResponse = await actionResponse(historyPath, () => page.goto(`${baseURL}/diem-thuong`));
      const final = updatedHistoryResponse.body.data;
      assert.equal(final.viviPoints, expectedBalance, 'Equipping must not deduct extra points');
      assert.equal(final.history.filter((tx: any) => tx.delta < 0).length, 1);
      await page.getByTestId('points-balance').filter({ hasText: `${expectedBalance} ViVi Points` }).waitFor();
      await page.getByRole('article').filter({ has: page.getByRole('heading', { name: fixture.rewardName, exact: true }) }).getByText('Đã sở hữu', { exact: true }).waitFor();
    });

    const gateOpened = await check('parent: wrong arithmetic stays locked; correct challenge unlocks portal', async () => {
      await page.goto(`${baseURL}/kham-pha`);
      await click('Vào Góc Phụ Huynh (yêu cầu mở khóa)');
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('spinbutton').fill('0');
      await dialog.getByRole('button', { name: VI_LOCALES.parentGate.btnConfirm, exact: true }).click();
      await dialog.getByRole('alert').waitFor();
      assert.equal(new URL(page.url()).pathname, '/kham-pha');
      await dialog.getByRole('spinbutton').fill('1');
      const question = await dialog.getByText(/^\d+ × \d+ = \?$/).innerText();
      const numbers = question.match(/\d+/g)!.map(Number);
      await dialog.getByRole('spinbutton').fill(String(numbers[0] * numbers[1]));
      await dialog.getByRole('button', { name: VI_LOCALES.parentGate.btnConfirm, exact: true }).click();
      await page.waitForURL('**/phu-huynh/tien-do');
    });
    if (gateOpened) {
      await check('parent: screen-time settings persist after reload without losing Parent Gate', async () => {
        await page.goto(`${baseURL}/phu-huynh/cai-dat`);
        await page.getByRole('button', { name: /^30 phút/ }).click();
        const response = await actionResponse('/api/v1/parent/screen-time', () => click(VI_LOCALES.parentPortal.btnSaveSettings), 'PATCH');
        assert.equal(response.status, 200);
        assert.equal(response.body.data.screenTimeLimit, 30);
        await visible(VI_LOCALES.parentPortal.saveSuccess);
        await page.reload();
        const selected = page.getByRole('button', { name: /^30 phút/ });
        await selected.waitFor();
        assert.match(await selected.getAttribute('class') ?? '', /border-primary/);
        assert.equal(new URL(page.url()).pathname, '/phu-huynh/cai-dat');
        await shot('parent-settings-persisted');
      });
    } else skipped('parent settings persistence');
    await check('parent: direct admin navigation is denied', async () => {
      await page.goto(`${baseURL}/admin`);
      await page.waitForURL('**/kham-pha');
      assert.equal(await page.getByRole('button', { name: 'Đăng xuất khỏi tài khoản quản trị', exact: true }).count(), 0);
    });
    await check('payment test: blank local gateway credentials show a recoverable configuration error', async () => {
      await page.goto(`${baseURL}/thanh-toan-thu`);
      await visible('Đây là thanh toán production bằng tiền thật');
      const response = await actionResponse('/api/v1/payments/test-checkout', () => click('Thanh toán thử 10.000đ'), 'POST');
      assert.equal(response.status, 503);
      await page.getByRole('alert').filter({ hasText: 'Thanh toán PayOS chưa được cấu hình' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Thanh toán thử 10.000đ', exact: true }).isEnabled(), true);
      assert.equal(await page.getByRole('link', { name: 'Mở trang thanh toán PayOS' }).count(), 0);
    });
    await check('learner browser journey: no uncaught application exceptions', async () => {
      assert.deepEqual(pageErrors, []);
    });
    return { observations, screenshots, pageErrors, blockedExternal: [...blockedExternal] };
  } finally {
    await context.close();
  }
}
