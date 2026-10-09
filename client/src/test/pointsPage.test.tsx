import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { AxiosRequestConfig } from 'axios';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { PointsShopPage } from '../features/points/PointsShopPage.js';
import { TreasureRoomPage } from '../features/points/TreasureRoomPage.js';
import { KidsLayout } from '../app/layouts/KidsLayout.js';
import { AdminRedemptionsPage } from '../features/admin/AdminRedemptionsPage.js';
import {
  FALLBACK_POINT_REASON_LABEL,
  formatPointDate,
  formatPointDelta,
  matchesShopFilter,
  pointReasonLabel,
} from '../features/points/pointLabels.js';

const child: ChildProfile = {
  _id: 'child-a', parentId: 'parent-a', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star',
  viviPoints: 100, level: 1, badges: [], ownedItemIds: ['owned-badge'], screenTimeLimit: 0,
};
const originalAdapter = api.defaults.adapter;
let request: (config: AxiosRequestConfig) => unknown | Promise<unknown>;
let calls: AxiosRequestConfig[];
let queryClient: QueryClient;

function show(element: React.ReactElement) {
  const memoryRouter = createMemoryRouter([{ path: '*', element }], { initialEntries: ['/'] });
  render(<QueryClientProvider client={queryClient}><RouterProvider router={memoryRouter} /></QueryClientProvider>);
}

beforeEach(() => {
  calls = [];
  useAuthStore.setState({ user: { id: 'parent-a', email: 'a@example.test', displayName: 'Parent', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: child, children: [child], isLoading: false });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  request = () => { throw new Error('Unexpected request'); };
  api.defaults.adapter = async (config) => {
    calls.push(config);
    return { data: { data: await request(config) }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

afterEach(() => { cleanup(); queryClient.clear(); api.defaults.adapter = originalAdapter; });

describe('point labels and dates', () => {
  it('maps every known reason and falls back for configured rewards', () => {
    expect(pointReasonLabel('lesson')).toBe('Hoàn thành bài học');
    expect(pointReasonLabel('activity')).toBe('Hoàn thành hoạt động');
    expect(pointReasonLabel('culture_quiz')).toBe('Hoàn thành thử thách');
    expect(pointReasonLabel('stage_complete')).toBe('Hoàn thành chặng');
    expect(pointReasonLabel('treasure')).toBe('Báu vật Nước Nam');
    expect(pointReasonLabel('redeem')).toBe('Đổi vật phẩm');
    expect(pointReasonLabel('use_reward')).toBe('Sử dụng phần thưởng');
    expect(pointReasonLabel('refund')).toBe('Hoàn điểm đổi quà');
    expect(pointReasonLabel('weekend_bonus')).toBe(FALLBACK_POINT_REASON_LABEL);
    expect(pointReasonLabel('toString')).toBe(FALLBACK_POINT_REASON_LABEL);
    expect(pointReasonLabel(undefined)).toBe(FALLBACK_POINT_REASON_LABEL);
  });

  it('formats today, yesterday and older dates in local time', () => {
    const now = new Date(2026, 9, 9, 0, 30); // 00:30 local, 9 Oct 2026
    expect(formatPointDate(new Date(2026, 9, 9, 0, 0), now)).toBe('Hôm nay');
    expect(formatPointDate(new Date(2026, 9, 8, 23, 59), now)).toBe('Hôm qua');
    expect(formatPointDate(new Date(2026, 9, 8, 0, 0), now)).toBe('Hôm qua');
    expect(formatPointDate(new Date(2026, 9, 7, 23, 59), now)).toBe('07/10/2026');
    expect(formatPointDate(new Date(2026, 0, 1, 12), new Date(2026, 0, 2, 8))).toBe('Hôm qua');
    expect(formatPointDate(new Date(2025, 11, 31, 12), new Date(2026, 0, 2, 8))).toBe('31/12/2025');
    expect(formatPointDate('not a date', now)).toBe('');
  });

  it('signs deltas with a real minus sign', () => {
    expect(formatPointDelta(10)).toBe('+10');
    expect(formatPointDelta(-30)).toBe('−30');
  });

  it('groups physical gifts separately and treats legacy virtual items as collectibles', () => {
    expect(matchesShopFilter({ type: 'physical' }, 'physical')).toBe(true);
    expect(matchesShopFilter({ type: 'virtual' }, 'collectible')).toBe(true);
    expect(matchesShopFilter({ type: 'virtual', category: 'avatar' }, 'badge')).toBe(false);
    expect(matchesShopFilter({ type: 'physical' }, 'all')).toBe(true);
  });
});

const shopItems = [
  { _id: 'owned-badge', name: 'Huy hiệu Sao', type: 'virtual', category: 'badge', costPoints: 20, assetUrl: '/badge.svg' },
  { _id: 'cat-avatar', name: 'Avatar Mèo', type: 'virtual', category: 'avatar', costPoints: 30, assetUrl: '/cat.svg', description: 'Mèo tam thể' },
  { _id: 'frame', name: 'Khung Hoa Sen', type: 'virtual', category: 'profile_decoration', costPoints: 45, assetUrl: '/sen.svg' },
  { _id: 'book', name: 'Truyện tranh', type: 'physical', costPoints: 150, stock: 0, assetUrl: '/book.svg' },
];

describe('points page', () => {
  it('shows server balance, real totals, labelled history and loads more with the cursor', async () => {
    const today = new Date();
    request = (config) => {
      if (config.url === '/points/shop/items') return shopItems;
      if (config.url === '/points/children/child-a' && !config.params?.before) {
        return {
          viviPoints: 75,
          totalEarned: 130,
          nextCursor: '2026-01-01T00:00:00.000Z',
          history: [
            { _id: 't1', delta: 10, reason: 'lesson', createdAt: today.toISOString() },
            { _id: 't2', delta: 20, reason: 'refund', description: 'Hoàn 20 điểm', createdAt: '2026-01-02T05:00:00.000Z' },
          ],
        };
      }
      if (config.url === '/points/children/child-a') {
        return {
          viviPoints: 75, totalEarned: 130, nextCursor: null,
          history: [{ _id: 't3', delta: -30, reason: 'redeem', createdAt: '2025-12-30T05:00:00.000Z' }],
        };
      }
      throw new Error(`Unexpected ${config.url}`);
    };
    show(<PointsShopPage />);

    expect(await screen.findByText('75 ViVi Points')).toBeInTheDocument();
    expect(screen.getByText(/ViVi Points của bé/)).toBeInTheDocument();
    expect(screen.getByText('Đây là số ViVi Points hiện có và được cập nhật sau mỗi hoạt động.')).toBeInTheDocument();
    expect(screen.getByTestId('points-total-earned')).toHaveTextContent('130 ViVi Points');
    // 4 items: 1 owned, 1 out of stock → 2 really available.
    await waitFor(() => expect(screen.getByTestId('points-available-items')).toHaveTextContent('Có sẵn 2 món'));
    expect(screen.queryByText(/Hạng học tập/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Có sẵn 5 món/)).not.toBeInTheDocument();
    expect(document.querySelector('img[src*="googleusercontent"]')).toBeNull();

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: 'Thời gian' })).toBeInTheDocument();
    expect(within(table).getByText('Hôm nay')).toBeInTheDocument();
    expect(within(table).getByText('Hoàn điểm đổi quà')).toBeInTheDocument();
    expect(within(table).getByText('Hoàn 20 điểm')).toBeInTheDocument();
    expect(within(table).getByText('+10')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm' }));
    expect(await within(table).findByText('−30')).toBeInTheDocument();
    expect(within(table).getByText('Đổi vật phẩm')).toBeInTheDocument();
    const paged = calls.find((c) => c.params?.before);
    expect(paged?.params).toEqual({ limit: 20, before: '2026-01-01T00:00:00.000Z' });
    expect(screen.queryByRole('button', { name: 'Xem thêm' })).not.toBeInTheDocument();
  });

  it('lists reward items under the customer heading with category tabs and lazy images', async () => {
    request = (config) => {
      if (config.url === '/points/shop/items') return shopItems;
      return { viviPoints: 100, totalEarned: 100, history: [], nextCursor: null };
    };
    show(<PointsShopPage />);
    expect(await screen.findByRole('heading', { name: 'VẬT PHẨM ĐỔI THƯỞNG' })).toBeInTheDocument();
    expect(await screen.findByText('Avatar Mèo')).toBeInTheDocument();
    expect(screen.getByText('✨ 30 ViVi Points')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Avatar Mèo' })).toHaveAttribute('loading', 'lazy');

    fireEvent.click(screen.getByRole('button', { name: 'Avatar' }));
    expect(screen.getByText('Avatar Mèo')).toBeInTheDocument();
    expect(screen.queryByText('Khung Hoa Sen')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Quà gửi tận nhà' }));
    expect(screen.getByText('Truyện tranh')).toBeInTheDocument();
    expect(screen.queryByText('Avatar Mèo')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hết hàng' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Sưu tầm' }));
    expect(screen.getByText('Chưa có vật phẩm trong mục này.')).toBeInTheDocument();
  });
});

describe('equipping avatar and profile decoration', () => {
  const collection = (avatarId: string | null) => ({
    ownedItems: [
      { _id: 'cat-avatar', name: 'Avatar Mèo', type: 'virtual', category: 'avatar', costPoints: 30, assetUrl: '/cat.svg' },
      { _id: 'frame', name: 'Khung Hoa Sen', type: 'virtual', category: 'profile_decoration', costPoints: 45, assetUrl: '/sen.svg' },
      { _id: 'owned-badge', name: 'Huy hiệu Sao', type: 'virtual', category: 'badge', costPoints: 20, assetUrl: '/badge.svg' },
    ],
    equippedAvatarItemId: avatarId,
    profileDecorationId: null,
  });

  it('lets the child use an owned avatar from the treasure room', async () => {
    let equipBody: unknown;
    request = (config) => {
      if (config.method === 'patch') { equipBody = JSON.parse(config.data); return collection('cat-avatar'); }
      if (config.url === '/points/children/child-a/collection') return collection(null);
      throw new Error(`Unexpected ${config.url}`);
    };
    show(<TreasureRoomPage />);
    expect(await screen.findByText('Huy hiệu Sao')).toBeInTheDocument();
    // Badges/collectibles are shown but cannot be "used".
    expect(screen.queryByRole('button', { name: 'Dùng Huy hiệu Sao' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dùng Avatar Mèo' }));
    await waitFor(() => expect(equipBody).toEqual({ slot: 'avatar', itemId: 'cat-avatar' }));
    expect(await screen.findByText('Đang dùng')).toBeInTheDocument();
    expect(useChildStore.getState().activeChild?.equippedAvatarItemId).toBe('cat-avatar');
  });

  it('shows the server error when equipping fails', async () => {
    request = (config) => {
      if (config.method === 'patch') {
        const error = Object.assign(new Error('forbidden'), {
          response: { status: 403, data: { error: { message: 'Bé chưa sở hữu vật phẩm này.' } } },
        });
        throw error;
      }
      return collection(null);
    };
    show(<TreasureRoomPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Dùng Avatar Mèo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Bé chưa sở hữu vật phẩm này.');
  });

  it('renders the equipped avatar in the kids header', async () => {
    const equipped = { ...child, equippedAvatarItemId: 'cat-avatar' };
    useChildStore.setState({ activeChild: equipped, children: [equipped] });
    request = (config) => {
      if (config.url === '/points/children/child-a/collection') return collection('cat-avatar');
      return [];
    };
    show(<KidsLayout />);
    expect(await screen.findByRole('img', { name: 'Avatar Avatar Mèo' })).toHaveAttribute('src', '/cat.svg');
  });

  it('does not request the collection when nothing is equipped', async () => {
    request = () => [];
    show(<KidsLayout />);
    expect(screen.getByText('An')).toBeInTheDocument();
    expect(calls.some((c) => String(c.url).includes('/collection'))).toBe(false);
  });
});

describe('admin inventory categories', () => {
  it('creates a categorised item and edits the category of an existing one', async () => {
    const posts: unknown[] = [];
    const patches: unknown[] = [];
    request = (config) => {
      if (config.method === 'post') { posts.push(JSON.parse(config.data)); return { _id: 'new' }; }
      if (config.method === 'patch') { patches.push(JSON.parse(config.data)); return {}; }
      if (config.url === '/admin/inventory') {
        return [{ _id: 'legacy', name: 'Nón lá', type: 'virtual', costPoints: 35, active: true, assetUrl: '/non.svg' }];
      }
      return [];
    };
    render(<QueryClientProvider client={queryClient}><AdminRedemptionsPage /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: /Kho vật phẩm/ }));

    const categorySelect = await screen.findByRole('combobox', { name: 'Loại của Nón lá' });
    fireEvent.change(categorySelect, { target: { value: 'collectible' } });
    await waitFor(() => expect(patches).toEqual([{ category: 'collectible' }]));

    fireEvent.click(screen.getByRole('button', { name: '+ Tạo vật phẩm' }));
    const form = screen.getByRole('form', { name: 'Tạo vật phẩm mới' });
    fireEvent.change(within(form).getByLabelText('Tên vật phẩm'), { target: { value: ' Avatar Trâu ' } });
    fireEvent.change(within(form).getByLabelText('Loại vật phẩm'), { target: { value: 'avatar' } });
    fireEvent.change(within(form).getByLabelText('Giá điểm (ViVi Points)'), { target: { value: '40' } });
    fireEvent.change(within(form).getByLabelText('Ảnh (HTTPS hoặc đường dẫn nội bộ)'), { target: { value: '/assets/trau.png' } });
    fireEvent.click(within(form).getByRole('button', { name: 'Tạo vật phẩm' }));
    await waitFor(() =>
      expect(posts).toEqual([
        { name: 'Avatar Trâu', type: 'virtual', category: 'avatar', costPoints: 40, assetUrl: '/assets/trau.png', active: true },
      ])
    );
  });
});
