import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../lib/api.js';
import { AdminLearnersPage } from '../features/admin/AdminLearnersPage.js';

const originalAdapter = api.defaults.adapter;
let queryClient: QueryClient;
const child = {
  _id: 'child-1', name: 'An', ageGroup: '5-6', viviPoints: 0,
  screenTimeLimit: 0, createdAt: '2026-10-01T00:00:00Z',
  parentId: { displayName: 'Parent An', email: 'parent@example.test' },
  currentStageId: { title: 'Chặng 1', order: 1 },
};

function detail(overrides: Record<string, unknown> = {}) {
  return {
    child,
    progress: [{
      _id: 'progress-1', lessonId: { title: 'Bài chữ A' },
      status: 'in_progress', stars: 0, scorePercent: 0,
      updatedAt: '2026-10-18T00:00:00Z',
    }],
    recordings: [], transactions: [], redemptions: [],
    ...overrides,
  };
}

function mount(loadDetail: () => unknown = () => detail()) {
  api.defaults.adapter = async (config) => ({
    data: { success: true, data: config.url === '/admin/learners' ? [child] : await loadDetail() },
    status: 200, statusText: 'OK', headers: {}, config,
  });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><AdminLearnersPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openDetail() {
  fireEvent.click(await screen.findByRole('button', { name: 'Xem chi tiết' }));
  return within(screen.getByRole('dialog', { name: 'Hồ Sơ Toàn Diện Của Bé' }));
}

afterEach(() => {
  cleanup();
  queryClient?.clear();
  api.defaults.adapter = originalAdapter;
});

it('preserves a server score of zero rather than displaying a perfect score', async () => {
  mount();
  const dialog = await openDetail();
  expect(await dialog.findByText('0%')).toBeInTheDocument();
  expect(dialog.queryByText('100%')).not.toBeInTheDocument();
});

it('preserves zero stars on an unsuccessful attempt', async () => {
  mount();
  const dialog = await openDetail();
  const star = await dialog.findByRole('img', { name: 'sao' });
  expect(star.parentElement).toHaveTextContent(/^0$/);
});

it.each([
  ['not_started', 'Chưa bắt đầu'],
  ['in_progress', 'Đang học'],
  ['completed', 'Hoàn thành'],
  [undefined, 'Chưa rõ trạng thái'],
])('shows the server progress status %s without inventing completion', async (status, label) => {
  const data = detail();
  mount(() => detail({ progress: [{ ...data.progress[0], status }] }));
  const dialog = await openDetail();
  expect(await dialog.findByText(label, { exact: true })).toBeInTheDocument();
  expect(dialog.getByText(/^Cập nhật:/)).toHaveTextContent('18/10/2026');
  expect(dialog.queryByText(/^Hoàn thành:/)).not.toBeInTheDocument();
});

it.each([
  [0, 'Không giới hạn'],
  [15, '15 phút'],
  [20, '20 phút'],
  [30, '30 phút'],
])('displays the configured screen-time limit %s', async (screenTimeLimit, label) => {
  mount(() => detail({ child: { ...child, screenTimeLimit } }));
  const dialog = await openDetail();
  expect(await dialog.findByText(label, { exact: true })).toBeInTheDocument();
});

it('does not invent scores or a screen-time setting when fields are missing', async () => {
  const data = detail();
  mount(() => detail({
    child: { ...child, screenTimeLimit: undefined },
    progress: [{ ...data.progress[0], stars: undefined, scorePercent: undefined }],
  }));
  const dialog = await openDetail();
  expect(await dialog.findAllByText('Chưa có dữ liệu')).toHaveLength(3);
  expect(dialog.queryByText('100%')).not.toBeInTheDocument();
  expect(dialog.queryByText('20 phút')).not.toBeInTheDocument();
});

it('preserves nonzero server scores and stars', async () => {
  const data = detail();
  mount(() => detail({ progress: [{ ...data.progress[0], status: 'completed', stars: 2, scorePercent: 75 }] }));
  const dialog = await openDetail();
  expect(await dialog.findByText('75%')).toBeInTheDocument();
  expect(dialog.getByRole('img', { name: 'sao' }).parentElement).toHaveTextContent(/^2$/);
});

it('replaces a failed detail load with an error and can retry successfully', async () => {
  let attempts = 0;
  mount(() => {
    if (++attempts === 1) throw new Error('Network unavailable');
    return detail();
  });
  const dialog = await openDetail();
  expect(await dialog.findByRole('alert')).toBeInTheDocument();
  expect(dialog.queryByText('Đang tải hồ sơ bé…')).not.toBeInTheDocument();
  fireEvent.click(dialog.getByRole('button', { name: /Thử lại/ }));
  expect(await dialog.findByText('Bài chữ A')).toBeInTheDocument();
  expect(dialog.queryByRole('alert')).not.toBeInTheDocument();
});

it('shows a missing detail as unavailable instead of loading forever', async () => {
  mount(() => null);
  const dialog = await openDetail();
  expect(await dialog.findByText('Không tìm thấy hồ sơ học viên.')).toBeInTheDocument();
  expect(dialog.queryByText('Đang tải hồ sơ bé…')).not.toBeInTheDocument();
});
