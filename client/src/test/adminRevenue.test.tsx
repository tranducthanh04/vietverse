import React from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
function show() {
  router = createMemoryRouter(appRouter.routes, { initialEntries: ['/admin/doanh-thu'] });
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
}
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
it('does not expose cached revenue after the session loses admin access', async () => {
  show();
  await screen.findByRole('table', { name: 'Doanh thu theo tháng' });
  act(() => useAuthStore.setState({ user: { id: 'parent', role: 'parent', email: 'parent@example.test', displayName: 'Parent' } }));
  expect(screen.queryByRole('table', { name: 'Doanh thu theo tháng' })).toBeNull();
});
