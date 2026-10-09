import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { AxiosError, type AxiosRequestConfig } from 'axios';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { ParentGateModal } from '../features/parent/ParentGateModal.js';
import { PointsShopPage } from '../features/points/PointsShopPage.js';
import { StoryDetailPage } from '../features/stories/StoryDetailPage.js';
import { router } from '../app/router.js';
import { ChildSessionGuard } from '../components/ChildSessionGuard.js';
import { KidsLayout } from '../app/layouts/KidsLayout.js';
import { CulturePage } from '../features/culture/CulturePage.js';

const child: ChildProfile = { _id: 'child-a', parentId: 'parent-a', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 100, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 15 };
const originalAdapter = api.defaults.adapter;
let request: (config: AxiosRequestConfig) => unknown | Promise<unknown>;
let queryClient: QueryClient;

function show(element: React.ReactElement, path = '/') {
  const memoryRouter = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] });
  render(<QueryClientProvider client={queryClient}><RouterProvider router={memoryRouter} /></QueryClientProvider>);
  return memoryRouter;
}

function showRoute(path: string) {
  const memoryRouter = createMemoryRouter(router.routes, { initialEntries: [path] });
  render(<QueryClientProvider client={queryClient}><RouterProvider router={memoryRouter} /></QueryClientProvider>);
  return memoryRouter;
}

beforeEach(() => {
  sessionStorage.clear();
  useAuthStore.setState({ user: { id: 'parent-a', email: 'a@example.test', displayName: 'Parent', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: null, children: [], isLoading: false });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  request = () => { throw new Error('Unexpected request'); };
  api.defaults.adapter = async (config) => ({ data: { data: await request(config) }, status: 200, statusText: 'OK', headers: {}, config });
});

afterEach(() => { cleanup(); queryClient.clear(); api.defaults.adapter = originalAdapter; vi.useRealTimers(); });

describe('parent gate recovery', () => {
  it('offers retry and prevents verification until a signed challenge loads', async () => {
    let available = false;
    request = () => { if (!available) throw new Error('offline'); return { num1: 4, num2: 8, challengeToken: 'signed' }; };
    show(<ParentGateModal isOpen onClose={() => {}} onSuccess={() => {}} />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/thử lại/i);
    expect(screen.getByRole('button', { name: /xác nhận/i })).toBeDisabled();
    available = true;
    fireEvent.click(screen.getByRole('button', { name: /thử lại/i }));
    await screen.findByText('4 × 8 = ?');
    expect(screen.getByRole('button', { name: /xác nhận/i })).toBeEnabled();
  });

  it('keeps verification errors visible while a new challenge loads', async () => {
    request = (config) => {
      if (config.method === 'post') throw new AxiosError('wrong', '', undefined, undefined, { data: { error: { message: 'Đáp án chưa đúng' } }, status: 400, statusText: '', headers: {}, config: config as never });
      return { num1: 4, num2: 8, challengeToken: 'signed' };
    };
    show(<ParentGateModal isOpen onClose={() => {}} onSuccess={() => {}} />);
    await screen.findByText('4 × 8 = ?');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Đáp án chưa đúng');
  });
});

describe('child route hydration and session limits', () => {
  it('hydrates a direct parent reload before rendering progress', async () => {
    useAuthStore.setState({ user: null, isLoading: true });
    sessionStorage.setItem('vietverse_parent_gate_token', 'gate');
    sessionStorage.setItem('vietverse_parent_gate_unlocked', String(Date.now() + 60000));
    request = (config) => {
      if (config.url === '/auth/me') return { user: { id: 'parent-a', email: 'a@example.test', displayName: 'Parent', role: 'parent' }, subscription: { plan: 'free', maxChildren: 1 } };
      if (config.url === '/children') return [child];
      if (config.url === '/stages') return [];
      return { overview: { totalLessonsCompleted: 7, totalRecordings: 2, storiesExplored: 3, cultureExplored: 4 }, competencies: [] };
    };
    showRoute('/phu-huynh/tien-do');
    await act(async () => { await useAuthStore.getState().fetchMe(); });
    expect(await screen.findByText('7')).toBeInTheDocument();
    expect(screen.getByText('An')).toBeInTheDocument();
  });

  it('offers onboarding when the parent has no children', async () => {
    sessionStorage.setItem('vietverse_parent_gate_token', 'gate');
    sessionStorage.setItem('vietverse_parent_gate_unlocked', String(Date.now() + 60000));
    request = () => [];
    showRoute('/phu-huynh/tien-do');
    expect(await screen.findByRole('link', { name: /tạo hồ sơ/i })).toHaveAttribute('href', '/bat-dau');
  });

  it('recovers a parent reload after child loading fails', async () => {
    sessionStorage.setItem('vietverse_parent_gate_token', 'gate');
    sessionStorage.setItem('vietverse_parent_gate_unlocked', String(Date.now() + 60000));
    let available = false;
    request = (config) => {
      if (!available) throw new Error('offline');
      return config.url === '/children' ? [child] : { overview: { totalLessonsCompleted: 7, totalRecordings: 2, storiesExplored: 3, cultureExplored: 4 }, competencies: [] };
    };
    showRoute('/phu-huynh/tien-do');
    expect(await screen.findByRole('alert')).toHaveTextContent(/hồ sơ/);
    available = true;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('7')).toBeInTheDocument();
  });

  it('does not restore a previous account from its late child response', async () => {
    let resolveOld!: (value: unknown) => void;
    let started = false;
    request = (config) => {
      if (config.url !== '/children') return [];
      if (!started) { started = true; return new Promise((resolve) => { resolveOld = resolve; }); }
      return [{ ...child, _id: 'child-b', parentId: 'parent-b', name: 'Binh' }];
    };
    show(<ChildSessionGuard><KidsLayout /></ChildSessionGuard>);
    await waitFor(() => expect(started).toBe(true));
    act(() => useAuthStore.setState({ user: { id: 'parent-b', email: 'b@example.test', displayName: 'Parent B', role: 'parent' } }));
    await screen.findByText('Binh');
    await act(async () => resolveOld([child]));
    expect(screen.getByText('Binh')).toBeInTheDocument();
    expect(screen.queryByText('An')).not.toBeInTheDocument();
  });

  it('preserves a newly selected profile across a stale background refresh', async () => {
    const second = { ...child, _id: 'child-b', name: 'Binh', viviPoints: 70 };
    let resolveList!: (value: unknown) => void;
    let refreshing = false;
    request = (config) => {
      if (config.method === 'patch') return { ...second, viviPoints: 80 };
      if (refreshing) return new Promise((resolve) => { resolveList = resolve; });
      return [child, second];
    };
    show(<ChildSessionGuard><KidsLayout /></ChildSessionGuard>);
    await screen.findByText('An');
    refreshing = true;
    let refresh!: Promise<ChildProfile[]>;
    act(() => { refresh = useChildStore.getState().fetchChildren(); });
    await waitFor(() => expect(resolveList).toBeDefined());
    fireEvent.click(screen.getByLabelText('Chọn hồ sơ bé'));
    fireEvent.click(screen.getByRole('button', { name: /Binh 70 pts/ }));
    await screen.findByText('80');
    await act(async () => { resolveList([child, second]); await refresh; });
    expect(screen.getByText('Binh')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('does not discard a newly created profile when an older list finishes', async () => {
    let resolveList!: (value: unknown) => void;
    let refreshing = false;
    request = (config) => {
      if (config.method === 'post') return { ...child, _id: 'new-child', name: 'New child' };
      if (refreshing) return new Promise((resolve) => { resolveList = resolve; });
      return [child];
    };
    show(<ChildSessionGuard><KidsLayout /></ChildSessionGuard>);
    await screen.findByText('An');
    refreshing = true;
    let refresh!: Promise<ChildProfile[]>;
    act(() => { refresh = useChildStore.getState().fetchChildren(); });
    await waitFor(() => expect(resolveList).toBeDefined());
    await act(async () => { await useChildStore.getState().createChild({ name: 'New child', ageGroup: '5-6', companionLanguage: 'en' }); });
    await act(async () => { resolveList([child]); await refresh; });
    expect(screen.getByText('New child')).toBeInTheDocument();
  });

  it('blocks a direct lesson when the shared child session has expired', async () => {
    sessionStorage.setItem(`vietverse_session_start_${child._id}`, String(Date.now() - 16 * 60000));
    request = (config) => config.url === '/children' ? [child] : { _id: 'lesson', activities: [] };
    showRoute('/hoc/lesson');
    expect(await screen.findByText(/Đến giờ cho mắt nghỉ ngơi/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Thoát bài học')).not.toBeInTheDocument();
  });

  it('directs the legacy preview URL to CMS without creating a child or reading the learner API', async () => {
    useAuthStore.setState({ user: { id: 'admin', email: 'admin@example.test', displayName: 'Admin', role: 'admin' } });
    const learnerRequests: string[] = [];
    request = (config) => { if (config.url?.startsWith('/lessons/')) learnerRequests.push(config.url); return []; };
    showRoute('/hoc/lesson?preview=true');
    expect(await screen.findByRole('link', { name: 'Về quản trị bài học' })).toBeInTheDocument();
    expect(learnerRequests).toEqual([]);
    expect(screen.queryByRole('link', { name: /tạo hồ sơ/i })).not.toBeInTheDocument();
  });

  it('does not reopen the break reminder after a successful extension', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    sessionStorage.setItem(`vietverse_session_start_${child._id}`, String(Date.now() - 16 * 60000));
    request = (config) => {
      if (config.url === '/children') return [child];
      if (config.url === '/parent/gate/challenge') return { num1: 4, num2: 8, challengeToken: 'signed' };
      if (config.url === '/parent/gate/verify') return { gateToken: 'gate' };
      return [];
    };
    showRoute('/kham-pha');
    fireEvent.click(await screen.findByRole('button', { name: /Ba mẹ mở thêm giờ/ }));
    await screen.findByText('4 × 8 = ?');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '32' } });
    fireEvent.click(screen.getByRole('button', { name: /xác nhận/i }));
    await waitFor(() => expect(screen.queryByText(/Đến giờ cho mắt nghỉ ngơi/)).not.toBeInTheDocument());
    await act(async () => { vi.advanceTimersByTime(11000); });
    expect(screen.queryByText(/Đến giờ cho mắt nghỉ ngơi/)).not.toBeInTheDocument();
  });
});

describe('honest story audio', () => {
  it('shows read-only mode and disabled playback when no audio is supplied', async () => {
    request = () => ({ _id: 'story', title: 'A story', lyrics: [{ timeSec: 0, text: 'Story text' }], durationSec: 40 });
    const memoryRouter = createMemoryRouter([{ path: '/stories/:id', element: <StoryDetailPage /> }], { initialEntries: ['/stories/story'] });
    render(<QueryClientProvider client={queryClient}><RouterProvider router={memoryRouter} /></QueryClientProvider>);
    expect(await screen.findByText(/chưa có âm thanh/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Bắt đầu nghe')).toBeDisabled();
    expect(screen.getByLabelText('Tua thời gian bài đồng dao')).toBeDisabled();
    expect(screen.queryByText('Audio Studio Vietverse')).not.toBeInTheDocument();
  });

  it('stops offering playback when the supplied audio asset fails', async () => {
    request = () => ({ _id: 'story', title: 'A story', audioUrl: '/broken.mp3', lyrics: [{ timeSec: 0, text: 'Story text' }], durationSec: 40 });
    const memoryRouter = createMemoryRouter([{ path: '/stories/:id', element: <StoryDetailPage /> }], { initialEntries: ['/stories/story'] });
    const { container } = render(<QueryClientProvider client={queryClient}><RouterProvider router={memoryRouter} /></QueryClientProvider>);
    await screen.findByText('Audio Studio Vietverse');
    fireEvent.error(container.querySelector('audio')!);
    expect(screen.getByText(/chưa có âm thanh/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Bắt đầu nghe')).toBeDisabled();
    expect(screen.queryByText('Đang phát lời theo nhạc')).not.toBeInTheDocument();
  });
});

describe('gift redemption', () => {
  it('requires an editable city and trims the shipping fields sent to the server', async () => {
    useChildStore.setState({ activeChild: child, children: [child] });
    let shipment: unknown;
    request = (config) => {
      if (config.url === '/points/shop/items') return [{ _id: 'gift', name: 'Book', type: 'physical', stock: 5, costPoints: 10 }];
      if (config.url === '/points/shop/redeem') { shipment = JSON.parse(config.data).shippingAddress; return { remainingPoints: 90 }; }
      if (config.url === '/children') return [{ ...child, viviPoints: 90 }];
      return { history: [] };
    };
    show(<PointsShopPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Đổi thưởng →' }));
    fireEvent.change(screen.getByPlaceholderText('Tên người nhận (Phụ huynh)'), { target: { value: '  Parent  ' } });
    fireEvent.change(screen.getByPlaceholderText('Số điện thoại nhận hàng'), { target: { value: '  0901234567  ' } });
    fireEvent.change(screen.getByPlaceholderText('Địa chỉ số nhà, tên đường, phường/xã'), { target: { value: '  12 Street  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác Nhận Đổi Quà' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/đầy đủ/i);
    expect(shipment).toBeUndefined();
    fireEvent.change(screen.getByLabelText('Tỉnh / Thành phố'), { target: { value: '  Đà Nẵng  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác Nhận Đổi Quà' }));
    await waitFor(() => expect(shipment).toEqual({ recipientName: 'Parent', phone: '0901234567', street: '12 Street', city: 'Đà Nẵng' }));
  });

  it('refreshes point history and ownership after a virtual redemption', async () => {
    useChildStore.setState({ activeChild: child, children: [child] });
    let redeemed = false;
    request = (config) => {
      if (config.url === '/points/shop/items') return [{ _id: 'gift', name: 'Badge', type: 'virtual', costPoints: 10 }];
      if (config.url === '/points/shop/redeem') { redeemed = true; return { remainingPoints: 90 }; }
      if (config.url === '/children') return [{ ...child, viviPoints: 90, ownedItemIds: ['gift'] }];
      return { history: redeemed ? [{ _id: 'tx', delta: -10, reason: 'redeem', createdAt: '2026-10-08' }] : [] };
    };
    show(<PointsShopPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Đổi thưởng →' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác Nhận Đổi Quà' }));
    expect(await screen.findByText('Đã sở hữu')).toBeInTheDocument();
    expect(await screen.findByText('−10')).toBeInTheDocument();
  });
});

describe('culture category discovery', () => {
  it.each([
    ['Tết', 'tet'],
    ['Phong tục', 'phong_tuc'],
    ['Thiên nhiên Việt Nam', 'thien_nhien'],
    ['Trò chơi dân gian', 'tro_choi_dan_gian'],
  ])('filters %s using the seeded category key', async (label, category) => {
    request = (config) => config.params?.category === category ? [{ _id: 'article', title: `${label} article`, excerpt: 'Culture for children', thumbnailUrl: '' }] : [];
    show(<CulturePage />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}$`) }));
    expect(await screen.findByText(`${label} article`)).toBeInTheDocument();
  });
});
