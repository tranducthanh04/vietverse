import React from 'react';
import { afterEach, expect, it } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { AdminRedemptionsPage } from '../features/admin/AdminRedemptionsPage.js';

const adapter = api.defaults.adapter;
afterEach(() => {
  cleanup();
  api.defaults.adapter = adapter;
});

it('sends a relative stock adjustment instead of overwriting a stale displayed count', async () => {
  const updates: unknown[] = [];
  api.defaults.adapter = async (config) => {
    if (config.method === 'patch') updates.push(JSON.parse(config.data));
    const data =
      config.url === '/admin/inventory'
        ? [
            {
              _id: 'item-1',
              name: 'Sticker',
              type: 'physical',
              costPoints: 50,
              stock: 10,
              active: true,
              assetUrl: '/sticker.png',
            },
          ]
        : [];
    return {
      data: { success: true, data },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AdminRedemptionsPage />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /Kho vật phẩm/ }));
  fireEvent.click(await screen.findByRole('button', { name: '+1' }));
  await waitFor(() => expect(updates).toEqual([{ stockDelta: 1 }]));
  queryClient.clear();
});

it('allows notes but does not offer reopening a cancelled order', async () => {
  api.defaults.adapter = async (config) => ({
    data: {
      success: true,
      data: [
        {
          _id: 'order-1',
          status: 'cancelled',
          pointsSpent: 50,
          childId: { name: 'Bé An' },
          itemId: { name: 'Sticker', type: 'physical' },
          createdAt: '2026-10-08T00:00:00Z',
        },
      ],
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AdminRedemptionsPage />
    </QueryClientProvider>
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Xử lý đơn' }));
  expect(screen.getByRole('combobox')).toBeDisabled();
  expect(screen.getByRole('textbox', { name: /Ghi chú/ })).toBeEnabled();
  queryClient.clear();
});
