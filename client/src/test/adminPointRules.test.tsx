import React from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { AdminPointRulesPage } from '../features/admin/AdminPointRulesPage.js';

const adapter = api.defaults.adapter;
afterEach(() => {
  cleanup();
  api.defaults.adapter = adapter;
});

const rule = (key: string, amount: number) => ({ key, amount, active: true, defaultAmount: amount, customized: false, updatedAt: null });

it('edits one rule per row and blocks invalid amounts before calling the API', async () => {
  const patches: { url?: string; body: unknown }[] = [];
  api.defaults.adapter = async (config) => {
    if (config.method === 'patch') patches.push({ url: config.url, body: JSON.parse(config.data) });
    const data = config.method === 'get'
      ? [rule('LESSON_COMPLETE', 10), rule('ACTIVITY_COMPLETE', 1), rule('CULTURE_QUIZ', 5), rule('STAGE_COMPLETE', 20), rule('LESSON_20_TREASURE', 50)]
      : rule('ACTIVITY_COMPLETE', 2);
    return { data: { success: true, data }, status: 200, statusText: 'OK', headers: {}, config };
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AdminPointRulesPage />
    </QueryClientProvider>
  );

  const input = await screen.findByLabelText('Hoàn thành hoạt động');
  expect(screen.getByLabelText('Hoàn thành thử thách')).toBeTruthy();
  const saveButtons = screen.getAllByRole('button', { name: 'Lưu' });
  expect(saveButtons).toHaveLength(5);

  fireEvent.change(input, { target: { value: '1001' } });
  fireEvent.click(saveButtons[1]);
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(patches).toEqual([]);

  fireEvent.change(input, { target: { value: '2' } });
  fireEvent.click(screen.getByRole('switch', { name: 'Bật quy tắc Hoàn thành hoạt động' }));
  fireEvent.click(saveButtons[1]);
  await waitFor(() => expect(patches).toEqual([{ url: '/admin/point-rules/ACTIVITY_COMPLETE', body: { amount: 2, active: false } }]));
  queryClient.clear();
});
