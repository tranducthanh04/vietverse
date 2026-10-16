import assert from 'node:assert/strict';
import { join } from 'node:path';

// Real frontend/API journey. The caller owns an isolated, disposable seeded DB.
export async function runAdminJourney({ browser, baseURL, screenshotDir, check }: {
  browser: any;
  baseURL: string;
  screenshotDir: string;
  check: (name: string, run: () => Promise<void>) => Promise<unknown>;
}) {
  assert(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(baseURL).hostname), 'Local QA server required');
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
  await context.route('**/*', async (route: any) => {
    const url = new URL(route.request().url());
    if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || ['data:', 'blob:'].includes(url.protocol)) await route.continue();
    else await route.abort('blockedbyclient');
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const pageErrors: string[] = [];
  page.on('pageerror', (error: Error) => pageErrors.push(error.message));
  page.on('response', (response: any) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith('/api/') && response.status() >= 400) {
      console.log(`ADMIN_API_ERROR ${response.status()} ${path}`);
    }
  });
  const visible = async (locator: any) => locator.waitFor({ state: 'visible' });
  const capture = async (filename: string) => {
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().filter(animation => {
        const end = animation.effect?.getComputedTiming().endTime;
        return typeof end === 'number' && Number.isFinite(end);
      }).map(animation => animation.finished.catch(() => undefined)));
    });
    await page.screenshot({ path: join(screenshotDir, filename), fullPage: true });
  };
  const navigate = async (path: string) => {
    await page.goto(`${baseURL}${path}`);
    await visible(page.locator('main h1').first());
  };
  const noOverflow = async () => {
    const widths = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert(widths.document <= widths.viewport + 1, `Horizontal page overflow: ${JSON.stringify(widths)}`);
  };

  try {
    await check('admin: UI login redirects to populated KPI dashboard', async () => {
      await page.goto(`${baseURL}/dang-nhap`);
      await page.locator('#login-email').fill('admin@qa.test');
      await page.locator('#login-password').fill('LocalQaAdmin2026!');
      const result = page.waitForResponse((response: any) => response.url().includes('/auth/login') && response.request().method() === 'POST');
      await page.locator('form button[type="submit"]').click();
      assert.equal((await result).status(), 200);
      await page.waitForURL(`${baseURL}/admin`);
      await visible(page.getByRole('heading', { level: 1, name: 'Trang Qu\u1ea3n Tr\u1ecb H\u1ec7 Th\u1ed1ng' }));
      await visible(page.getByText('T\u1ed5ng b\u00e0i h\u1ecdc n\u1ec1n t\u1ea3ng', { exact: true }));
      assert.match(await page.locator('main').innerText(), /20/);
      await noOverflow();
      await capture('admin-dashboard-desktop.png');
    });

    await check('admin: revenue loads actual report and rejects inverted date range', async () => {
      const response = page.waitForResponse((r: any) => r.url().includes('/admin/revenue') && r.request().method() === 'GET');
      await navigate('/admin/doanh-thu');
      const res = await response;
      assert.equal(res.status(), 200);
      const report = (await res.json()).data;
      assert.equal(typeof report.totalRevenue, 'number');
      assert.equal(report.totalRevenue, report.series.reduce((sum: number, row: any) => sum + row.revenue, 0));
      await visible(page.getByRole('table', { name: 'Doanh thu theo th\u00e1ng' }));
      await page.getByLabel('T\u1eeb ng\u00e0y', { exact: true }).fill('2026-10-20');
      await page.getByLabel('\u0110\u1ebfn ng\u00e0y', { exact: true }).fill('2026-10-01');
      await page.getByRole('button', { name: '\u00c1p d\u1ee5ng', exact: true }).click();
      await visible(page.getByRole('alert').filter({ hasText: 'Ng\u00e0y b\u1eaft \u0111\u1ea7u ph\u1ea3i tr\u01b0\u1edbc' }));
      await page.getByRole('button', { name: 'To\u00e0n th\u1eddi gian', exact: true }).click();
      await page.getByRole('alert').waitFor({ state: 'hidden' });
    });

    for (const [path, heading, endpoint] of [
      ['/admin/bai-hoc', 'B\u00e0i h\u1ecdc', '/admin/content/lessons'],
      ['/admin/truyen', 'Truy\u1ec7n / \u0111\u1ed3ng dao', '/admin/content/stories'],
      ['/admin/van-hoa', 'V\u0103n h\u00f3a', '/admin/content/culture'],
    ]) {
      await check(`admin: populated CMS catalog ${path} and empty search recovery`, async () => {
        const response = page.waitForResponse((r: any) => r.url().includes(endpoint + '?') && r.request().method() === 'GET');
        await navigate(path);
        const res = await response;
        assert.equal(res.status(), 200);
        const data = (await res.json()).data;
        assert(data.total > 0, `${path} seeded catalog missing`);
        await visible(page.getByRole('heading', { level: 1, name: heading, exact: true }));
        await visible(page.locator('main tbody tr').first());
        assert.equal(await page.locator('main tbody tr').count(), data.items.length);
        const search = page.getByLabel('T\u00ecm n\u1ed9i dung', { exact: true });
        await search.fill('qa-no-such-catalog-item-20261015');
        await visible(page.getByText('Ch\u01b0a c\u00f3 n\u1ed9i dung ph\u00f9 h\u1ee3p.', { exact: true }));
        await search.fill('');
        await visible(page.locator('main tbody tr').first());
      });
    }

    await check('admin: learners filter, detail dialog, and close', async () => {
      await navigate('/admin/hoc-vien');
      await visible(page.locator('main tbody tr').first());
      const search = page.getByLabel('T\u00ecm t\u00ean b\u00e9 ho\u1eb7c ph\u1ee5 huynh', { exact: true });
      await search.fill('qa-no-such-learner-20261015');
      await visible(page.getByText('Kh\u00f4ng t\u00ecm th\u1ea5y h\u1ecdc vi\u00ean n\u00e0o ph\u00f9 h\u1ee3p.', { exact: true }));
      await search.fill('');
      await page.getByRole('button', { name: 'Xem chi ti\u1ebft', exact: true }).first().click();
      const dialog = page.getByRole('dialog');
      await visible(dialog.getByText('S\u1ed1 d\u01b0 \u0111i\u1ec3m', { exact: true }));
      await visible(dialog.getByText(/^B\u00e0i h\u1ecdc \u0111\u00e3 h\u1ecdc/));
      await page.getByRole('button', { name: '\u0110\u00f3ng h\u1ed3 s\u01a1', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
    });

    await check('admin: learner dialog keyboard focus stays inside and Escape restores trigger focus', async () => {
      await navigate('/admin/hoc-vien');
      const trigger = page.getByRole('button', { name: 'Xem chi ti\u1ebft', exact: true }).first();
      await trigger.click();
      const dialog = page.getByRole('dialog');
      try {
        await visible(dialog.getByText('S\u1ed1 d\u01b0 \u0111i\u1ec3m', { exact: true }));
        const focusInsideAtOpen = await dialog.evaluate((element: HTMLElement) => element.contains(document.activeElement));
        const tabFocus: boolean[] = [];
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Tab');
          tabFocus.push(await dialog.evaluate((element: HTMLElement) => element.contains(document.activeElement)));
        }
        await page.keyboard.press('Escape');
        const escapeClosed = !(await dialog.isVisible());
        const focusRestored = await trigger.evaluate((element: HTMLElement) => element === document.activeElement);
        assert.deepEqual({ focusInsideAtOpen, tabFocus, escapeClosed, focusRestored }, {
          focusInsideAtOpen: true, tabFocus: [true, true, true], escapeClosed: true, focusRestored: true,
        }, 'Learner modal keyboard contract');
      } finally {
        if (await dialog.isVisible()) await page.getByRole('button', { name: '\u0110\u00f3ng h\u1ed3 s\u01a1', exact: true }).click();
      }
    });

    await check('admin: zero-score in-progress learner is not presented as 100 percent and three stars', async () => {
      await navigate('/admin/hoc-vien');
      await page.getByLabel('T\u00ecm t\u00ean b\u00e9 ho\u1eb7c ph\u1ee5 huynh', { exact: true }).fill('QA Zero Progress');
      const detailResponse = page.waitForResponse((r: any) => /\/admin\/learners\/[a-f0-9]{24}$/.test(r.url()) && r.request().method() === 'GET');
      await page.getByRole('button', { name: 'Xem chi ti\u1ebft', exact: true }).click();
      const dialog = page.getByRole('dialog');
      try {
        const response = await detailResponse;
        assert.equal(response.status(), 200);
        const { progress } = (await response.json()).data;
        assert.equal(progress.length, 1, 'Zero-score learner fixture must contain one progress entry');
        assert.equal(progress[0].scorePercent, 0);
        assert.equal(progress[0].stars, 0);
        assert.equal(progress[0].status, 'in_progress');
        await visible(dialog.getByText('S\u1ed1 d\u01b0 \u0111i\u1ec3m', { exact: true }));
        await capture('admin-zero-score.png');
        const score = dialog.locator('span').filter({ hasText: /^\d+%$/ });
        assert.equal(await score.innerText(), '0%', 'API fixture scorePercent=0 must not render as perfect score');
        const stars = dialog.locator('span').filter({ has: page.locator('svg[aria-label="sao"]') });
        assert.equal((await stars.innerText()).trim(), '0', 'API fixture stars=0 must remain zero');
      } finally {
        await page.getByRole('button', { name: '\u0110\u00f3ng h\u1ed3 s\u01a1', exact: true }).click();
      }
    });

    await check('admin: redemption search and populated inventory', async () => {
      await navigate('/admin/doi-qua');
      await page.getByLabel('T\u00ecm t\u00ean b\u00e9, qu\u00e0 ho\u1eb7c s\u1ed1 \u0111i\u1ec7n tho\u1ea1i').fill('qa-no-such-redemption-20261015');
      await visible(page.getByText('Kh\u00f4ng t\u00ecm th\u1ea5y \u0111\u01a1n \u0111\u1ed5i qu\u00e0 n\u00e0o ph\u00f9 h\u1ee3p.', { exact: true }));
      await page.getByRole('button', { name: /^Kho v\u1eadt ph\u1ea9m/ }).click();
      await visible(page.getByRole('columnheader', { name: 'T\u00ean v\u1eadt ph\u1ea9m', exact: true }));
      await visible(page.locator('main tbody tr').first());
      assert((await page.locator('main tbody tr').count()) >= 1);
    });

    await check('admin: point-rule invalid amount is rejected without API mutation', async () => {
      await navigate('/admin/quy-tac-diem');
      const input = page.getByLabel('Ho\u00e0n th\u00e0nh b\u00e0i h\u1ecdc', { exact: true });
      await visible(input);
      assert.equal(await page.getByRole('spinbutton').count(), 5);
      const original = await input.inputValue();
      const mutations: string[] = [];
      const listener = (req: any) => { if (req.method() === 'PATCH' && req.url().includes('/point-rules/')) mutations.push(req.url()); };
      page.on('request', listener);
      try {
        await input.fill('-1');
        const row = page.locator('tr').filter({ has: input });
        await row.getByRole('button', { name: 'L\u01b0u', exact: true }).click();
        await visible(row.getByRole('alert'));
        assert.equal(await input.getAttribute('aria-invalid'), 'true');
        assert.equal(mutations.length, 0);
        await input.fill(original);
      } finally { page.off('request', listener); }
    });

    await check('admin: create, save, reload, and preview unpublished story draft', async () => {
      await navigate('/admin/truyen/moi');
      const title = 'QA isolated story 20261015';
      const description = 'Local browser QA draft. Not published.';
      const lyric = 'A complete draft line saved through the real CMS API.';
      await page.getByLabel('Ti\u00eau \u0111\u1ec1 m\u1edbi', { exact: true }).fill(title);
      await page.getByRole('button', { name: 'T\u1ea1o b\u1ea3n nh\u00e1p', exact: true }).click();
      await page.waitForURL(/\/admin\/truyen\/[a-f0-9]{24}$/);
      const editorURL = page.url();
      console.log('ADMIN_DRAFT_STAGE created');
      await visible(page.getByLabel('Ti\u00eau \u0111\u1ec1', { exact: true }));
      await page.getByLabel('M\u00f4 t\u1ea3 truy\u1ec7n', { exact: true }).fill(description);
      await page.getByRole('button', { name: 'Th\u00eam d\u00f2ng l\u1eddi', exact: true }).click();
      await page.getByLabel('D\u00f2ng l\u1eddi 1', { exact: true }).fill(lyric);
      await page.getByRole('button', { name: 'L\u01b0u nh\u00e1p', exact: true }).click();
      await visible(page.getByRole('status').filter({ hasText: '\u0110\u00e3 l\u01b0u nh\u00e1p. Ch\u01b0a xu\u1ea5t b\u1ea3n.' }));
      console.log('ADMIN_DRAFT_STAGE saved');
      await page.reload();
      try {
        await visible(page.getByRole('textbox', { name: 'M\u00f4 t\u1ea3 truy\u1ec7n', exact: true }));
      } catch (error) {
        await capture('admin-draft-reload-failure.png');
        console.log(`ADMIN_DRAFT_RELOAD_STATE ${new URL(page.url()).pathname} ${await page.locator('h1').allTextContents()}`);
        console.log('ADMIN_DRAFT_LABELS', await page.locator('textarea[name="description"]').evaluateAll((elements: HTMLTextAreaElement[]) => elements.map(element => ({
          id: element.id, name: element.name, textContent: element.textContent,
          labels: Array.from(element.labels ?? []).map(label => ({ htmlFor: label.htmlFor, textContent: label.textContent, innerText: label.innerText })),
        }))));
        console.log('ADMIN_DRAFT_ACCESSIBLE_DESCRIPTION', await page.getByRole('textbox', { name: 'M\u00f4 t\u1ea3 truy\u1ec7n', exact: true }).count());
        throw error;
      }
      console.log('ADMIN_DRAFT_STAGE restored-after-reload');
      assert.equal(await page.getByRole('textbox', { name: 'M\u00f4 t\u1ea3 truy\u1ec7n', exact: true }).inputValue(), description);
      assert.equal(await page.getByLabel('D\u00f2ng l\u1eddi 1', { exact: true }).inputValue(), lyric);
      const detail = page.waitForResponse((r: any) => r.url().includes('/preview?draftVersion=') && r.request().method() === 'GET');
      await page.getByRole('button', { name: 'Xem tr\u01b0\u1edbc', exact: true }).click();
      const preview = await detail;
      assert.equal(preview.status(), 200);
      console.log('ADMIN_DRAFT_STAGE preview-loaded');
      const data = (await preview.json()).data;
      assert.equal(data.payload.title, title);
      assert.equal(data.baseContentVersion, null);
      await visible(page.locator('article').getByRole('heading', { name: title, exact: true }));
      await visible(page.getByTestId('lyrics').getByText(lyric, { exact: true }));
      await capture('admin-story-draft-preview.png');
      await page.getByRole('link', { name: 'V\u1ec1 bi\u00ean t\u1eadp', exact: true }).click();
      await page.waitForURL(editorURL);
      await visible(page.getByText(/Live: ch\u01b0a c\u00f3/));
    });

    await check('admin: mobile dashboard fits 390px and navigation is usable', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await navigate('/admin');
      await visible(page.getByText('T\u1ed5ng b\u00e0i h\u1ecdc n\u1ec1n t\u1ea3ng', { exact: true }));
      const nav = page.getByRole('navigation', { name: '\u0110i\u1ec1u h\u01b0\u1edbng qu\u1ea3n tr\u1ecb tr\u00ean thi\u1ebft b\u1ecb di \u0111\u1ed9ng' });
      await visible(nav);
      await noOverflow();
      await nav.getByRole('link', { name: 'Doanh thu', exact: true }).click();
      await visible(page.getByRole('table', { name: 'Doanh thu theo th\u00e1ng' }));
      await noOverflow();
    });

    await check('admin: no uncaught browser runtime errors', async () => { assert.deepEqual(pageErrors, []); });
  } finally {
    await context.close();
  }
}
