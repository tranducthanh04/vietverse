import React from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router as appRouter } from '../app/router.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

const adapter = api.defaults.adapter;
let client: QueryClient;
let router: ReturnType<typeof createMemoryRouter>;
const report = {
  currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', from: null, to: null,
  totalRevenue: 1240000, paidOrders: 2, currentMonth: '2026-10', currentMonthRevenue: 250000, undatedOrders: 0,
  byPlan: { monthly: { orders: 1, revenue: 250000 }, yearly: { orders: 1, revenue: 990000 } },
  series: [{ month: '2026-10', orders: 2, revenue: 1240000 }],
};
beforeEach(() => {
  useAuthStore.setState({ user: { id: 'admin', role: 'admin', email: 'admin@example.test', displayName: 'Admin' }, isLoading: false });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api.defaults.adapter = async config => ({ data: { success: true, data: report }, status: 200, statusText: 'OK', headers: {}, config });
});
afterEach(() => { cleanup(); router?.dispose(); client.clear(); api.defaults.adapter = adapter; useAuthStore.setState({ user: null }); });
function show(entry = '/admin/doanh-thu') {
  router = createMemoryRouter(appRouter.routes, { initialEntries: [entry] });
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
}
const multiMonth = {
  ...report,
  series: [
    { month: '2026-08', orders: 5, revenue: 500000 },
    { month: '2026-09', orders: 2, revenue: 900000 },
    { month: '2026-10', orders: 9, revenue: 100000 },
  ],
};
const monthsOf = (table: HTMLElement) => within(table).getAllByRole('rowheader').map(cell => cell.textContent);
it('makes revenue reachable in admin and displays actual amounts by month and plan', async () => {
  show();
  expect(await screen.findByRole('heading', { name: 'Doanh thu' })).toBeTruthy();
  expect(screen.getAllByRole('link', { name: 'Doanh thu' }).some(link => link.getAttribute('href') === '/admin/doanh-thu')).toBe(true);
  const table = await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  expect(within(table).getByText(/1\.240\.000/)).toBeTruthy();
  expect(screen.getByText(/990\.000/)).toBeTruthy();
});
it('applies the chosen range to the report and resets back to all time', async () => {
  api.defaults.adapter = async config => ({ data: { data: config.params?.from === '2026-09-01'
    ? { ...report, totalRevenue: 149000, paidOrders: 1, series: [{ month: '2026-09', orders: 1, revenue: 149000 }], from: '2026-09-01', to: '2026-09-30' }
    : report }, status: 200, statusText: 'OK', headers: {}, config });
  show();
  await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-09-30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
  expect(await screen.findByText('2026-09')).toBeTruthy();
  expect(within(screen.getByRole('table', { name: 'Doanh thu theo tháng' })).getByText(/149\.000/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Toàn thời gian' }));
  expect(await screen.findByText('2026-10')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-11-01' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-10-01' } });
  fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Ngày bắt đầu');
});
it('distinguishes errors from zero revenue and retries without creating a payment', async () => {
  api.defaults.adapter = async () => { throw new Error('offline'); };
  show();
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải doanh thu');
  expect(screen.queryByRole('table')).toBeNull();
  api.defaults.adapter = async config => {
    if (config.method !== 'get' || config.url !== '/admin/revenue') throw new Error('Unexpected mutation');
    return { data: { data: { ...report, totalRevenue: 0, paidOrders: 0, currentMonthRevenue: 0, series: [], byPlan: { monthly: { orders: 0, revenue: 0 }, yearly: { orders: 0, revenue: 0 } } } }, status: 200, statusText: 'OK', headers: {}, config };
  };
  fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));
  expect(await screen.findByText(/Chưa có đơn đã thanh toán/)).toBeTruthy();
});
it('sorts the monthly table by column header with aria-sort and an SVG direction icon', async () => {
  api.defaults.adapter = async config => ({ data: { data: multiMonth }, status: 200, statusText: 'OK', headers: {}, config });
  show();
  const table = await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  // Mặc định: theo tháng tăng dần.
  expect(monthsOf(table)).toEqual(['2026-08', '2026-09', '2026-10']);
  expect(within(table).getByRole('columnheader', { name: /Tháng/ }).getAttribute('aria-sort')).toBe('ascending');
  // Sắp xếp theo doanh thu tăng dần: 100000, 500000, 900000.
  fireEvent.click(within(table).getByRole('button', { name: /Sắp xếp theo Doanh thu/ }));
  expect(monthsOf(table)).toEqual(['2026-10', '2026-08', '2026-09']);
  const revenueHeader = within(table).getByRole('columnheader', { name: /Doanh thu/ });
  expect(revenueHeader.getAttribute('aria-sort')).toBe('ascending');
  expect(within(table).getByRole('columnheader', { name: /Tháng/ }).getAttribute('aria-sort')).toBe('none');
  // Chỉ báo chiều bằng icon SVG có sẵn, không dùng ký tự ▲▼.
  expect(revenueHeader.querySelector('svg')).toBeTruthy();
  expect(revenueHeader.textContent ?? '').not.toMatch(/[▲▼]/);
  // Bấm lần nữa đảo sang giảm dần.
  fireEvent.click(within(table).getByRole('button', { name: /Sắp xếp theo Doanh thu/ }));
  expect(monthsOf(table)).toEqual(['2026-09', '2026-08', '2026-10']);
  expect(within(table).getByRole('columnheader', { name: /Doanh thu/ }).getAttribute('aria-sort')).toBe('descending');
});
it('reads the sort column and direction from the URL on load', async () => {
  api.defaults.adapter = async config => ({ data: { data: multiMonth }, status: 200, statusText: 'OK', headers: {}, config });
  show('/admin/doanh-thu?sort=revenue&dir=desc');
  const table = await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  expect(monthsOf(table)).toEqual(['2026-09', '2026-08', '2026-10']);
  expect(within(table).getByRole('columnheader', { name: /Doanh thu/ }).getAttribute('aria-sort')).toBe('descending');
});
it('keeps the date range and sort on the URL for reload and sharing', async () => {
  api.defaults.adapter = async config => ({ data: { data: config.params?.from === '2026-09-01'
    ? { ...report, from: '2026-09-01', to: '2026-09-30', series: [{ month: '2026-09', orders: 1, revenue: 149000 }] }
    : multiMonth }, status: 200, statusText: 'OK', headers: {}, config });
  show();
  await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2026-09-01' } });
  fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2026-09-30' } });
  fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));
  await screen.findByText('2026-09');
  await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('from')).toBe('2026-09-01'));
  expect(new URLSearchParams(router.state.location.search).get('to')).toBe('2026-09-30');
  fireEvent.click(within(screen.getByRole('table', { name: 'Doanh thu theo tháng' })).getByRole('button', { name: /Sắp xếp theo Đơn đã thanh toán/ }));
  await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('sort')).toBe('orders'));
  const params = new URLSearchParams(router.state.location.search);
  expect(params.get('dir')).toBe('asc');
  expect(params.get('from')).toBe('2026-09-01');
});
it('ignores malformed URL values and falls back to defaults without filtering', async () => {
  const seenFrom: (string | undefined)[] = [];
  api.defaults.adapter = async config => { seenFrom.push(config.params?.from as string | undefined);
    return { data: { data: multiMonth }, status: 200, statusText: 'OK', headers: {}, config }; };
  show('/admin/doanh-thu?from=2026-13-40&to=nope&sort=bogus&dir=sideways');
  const table = await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  expect(seenFrom.every(value => value === undefined)).toBe(true);
  expect(screen.getByLabelText('Từ ngày')).toHaveValue('');
  expect(monthsOf(table)).toEqual(['2026-08', '2026-09', '2026-10']);
  expect(within(table).getByRole('columnheader', { name: /Tháng/ }).getAttribute('aria-sort')).toBe('ascending');
});
it('replaces history instead of pushing when filtering or sorting', async () => {
  api.defaults.adapter = async config => ({ data: { data: multiMonth }, status: 200, statusText: 'OK', headers: {}, config });
  show();
  const table = await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  expect(router.state.historyAction).toBe('POP');
  fireEvent.click(within(table).getByRole('button', { name: /Sắp xếp theo Doanh thu/ }));
  await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('sort')).toBe('revenue'));
  expect(router.state.historyAction).toBe('REPLACE');
  // Đổi cột nhiều lần vẫn là REPLACE nên không chồng thêm mục lịch sử (Back vẫn rời được trang).
  fireEvent.click(within(screen.getByRole('table', { name: 'Doanh thu theo tháng' })).getByRole('button', { name: /Sắp xếp theo Đơn đã thanh toán/ }));
  await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('sort')).toBe('orders'));
  expect(router.state.historyAction).toBe('REPLACE');
});
it('drops malformed URL params when writing a new sort to the URL', async () => {
  api.defaults.adapter = async config => ({ data: { data: multiMonth }, status: 200, statusText: 'OK', headers: {}, config });
  show('/admin/doanh-thu?from=2026-13-40&to=nope&sort=bogus&dir=sideways');
  const table = await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  fireEvent.click(within(table).getByRole('button', { name: /Sắp xếp theo Doanh thu/ }));
  await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('sort')).toBe('revenue'));
  const params = new URLSearchParams(router.state.location.search);
  expect(params.get('from')).toBeNull();
  expect(params.get('to')).toBeNull();
  expect(params.get('dir')).toBe('asc');
});
it('does not expose cached revenue after the session loses admin access', async () => {
  show();
  await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  act(() => useAuthStore.setState({ user: { id: 'parent', role: 'parent', email: 'parent@example.test', displayName: 'Parent' } }));
  expect(screen.queryByRole('table', { name: 'Doanh thu theo tháng' })).toBeNull();
});
