import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { ParentDashboardPage } from '../features/parent/ParentDashboardPage.js';

const child: ChildProfile = { _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 15 };
const originalAdapter = api.defaults.adapter;
let client: QueryClient;
let respond: (url: string) => unknown | Promise<unknown>;
const fixture = () => ({
  child: { id: 'a', name: 'An', ageGroup: '5-6', avatarId: 'star', viviPoints: 35, screenTimeLimit: 15 },
  overview: { totalLessonsCompleted: 4, totalRecordings: 2, storiesExplored: 1, cultureExplored: 0 },
  competencies: [{ key: 'reading', name: 'Nhận diện mặt chữ', percentage: 50, statusLabel: 'Đang luyện tập', description: 'Làm quen chữ' }],
  journey: {
    currentStageId: 's2', isCompleted: false,
    stages: Array.from({ length: 5 }, (_, i) => ({ id: `s${i + 1}`, order: i + 1, title: `Chặng ${i + 1}: Chủ đề ${i + 1}`, totalLessons: 4, completedCount: i === 0 ? 4 : 0, percentage: i === 0 ? 100 : 0, isCompleted: i === 0, isUnlocked: i === 0, requiresSubscription: i > 0, lockReason: i > 0 ? 'subscription' : null })),
  },
  recentActivities: [
    { id: 'lesson:1', kind: 'lesson', title: 'Bài học đầu tiên', occurredAt: '2026-01-03T00:00:00Z', lessonStatus: 'completed' },
    { id: 'story:1', kind: 'story', title: 'Truyện mẫu', occurredAt: '2026-01-02T00:00:00Z' },
    { id: 'recording:1', kind: 'recording', title: 'Bản đọc của An', occurredAt: '2026-01-01T00:00:00Z' },
  ],
});

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useChildStore.setState({ children: [child], activeChild: child, isLoading: false });
  respond = () => fixture();
  api.defaults.adapter = async config => ({ data: { data: await respond(config.url!) }, status: 200, statusText: 'OK', headers: {}, config });
});
afterEach(() => { cleanup(); client.clear(); api.defaults.adapter = originalAdapter; });
const show = () => render(<QueryClientProvider client={client}><MemoryRouter><ParentDashboardPage /></MemoryRouter></QueryClientProvider>);

describe('parent progress dashboard', () => {
  it('shows the current locked stage, all stage counts, real balance and distinct activity labels', async () => {
    show();
    const journey = await screen.findByRole('region', { name: 'Hành trình học tập' });
    expect(within(journey).getByText(/Chặng hiện tại/)).toHaveTextContent('Chặng 2: Chủ đề 2');
    expect(within(journey).getAllByRole('progressbar')).toHaveLength(5);
    expect(within(journey).getAllByRole('progressbar')[0]).toHaveAttribute('aria-valuenow', '100');
    expect(within(journey).getByText('4/4 bài hoàn thành')).toBeInTheDocument();
    expect(within(journey).getAllByText(/Cần gói học còn hiệu lực/).length).toBeGreaterThan(0);
    expect(screen.getByText('35 ViVi')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem điểm và lịch sử/ })).toHaveAttribute('href', '/diem-thuong');
    const activity = screen.getByRole('region', { name: 'Hoạt động gần đây' });
    expect(within(activity).getByText('Hoàn thành bài học')).toBeInTheDocument();
    expect(within(activity).getByText('Khám phá truyện')).toBeInTheDocument();
    expect(within(activity).getByText('Thu âm')).toBeInTheDocument();
    expect(screen.getByText(/không phải đánh giá chuyên môn/i)).toBeInTheDocument();
  });

  it('distinguishes no activity and an empty catalog from loading', async () => {
    respond = () => ({ ...fixture(), journey: { stages: [], currentStageId: null, isCompleted: false }, recentActivities: [] });
    show();
    expect(await screen.findByText(/Chưa có dữ liệu chặng học/)).toBeInTheDocument();
    expect(screen.getByText(/Chưa có hoạt động được ghi nhận/)).toBeInTheDocument();
    expect(screen.queryByText(/Đang tổng hợp/)).not.toBeInTheDocument();
  });

  it('shows completion without inventing a next stage', async () => {
    const data = fixture();
    respond = () => ({ ...data, journey: { ...data.journey, currentStageId: null, isCompleted: true, stages: data.journey.stages.map(s => ({ ...s, completedCount: 4, percentage: 100, isCompleted: true })) } });
    show();
    expect(await screen.findByText(/Đã hoàn thành tất cả chặng học/)).toBeInTheDocument();
    expect(screen.queryByText(/Chặng hiện tại/)).not.toBeInTheDocument();
  });

  it('offers retry for a failed report instead of an empty success', async () => {
    let online = false;
    respond = () => { if (!online) throw new Error('offline'); return fixture(); };
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Không thể tải báo cáo/);
    expect(screen.queryByText(/Chưa có hoạt động/)).not.toBeInTheDocument();
    online = true;
    fireEvent.click(screen.getByRole('button', { name: /Thử lại/ }));
    expect(await screen.findByText('35 ViVi')).toBeInTheDocument();
  });

  it('never renders the former child report after switching while its request is in flight', async () => {
    let resolveOld!: (data: unknown) => void;
    respond = url => url.endsWith('/a') ? new Promise(resolve => { resolveOld = resolve; })
      : { ...fixture(), child: { ...fixture().child, id: 'b', name: 'Binh', viviPoints: 88 }, recentActivities: [] };
    show();
    expect(screen.getByText(/Đang tổng hợp/)).toBeInTheDocument();
    act(() => useChildStore.setState({ activeChild: { ...child, _id: 'b', name: 'Binh' } }));
    expect(await screen.findByText('88 ViVi')).toBeInTheDocument();
    await act(async () => resolveOld(fixture()));
    expect(screen.queryByText('35 ViVi')).not.toBeInTheDocument();
    expect(screen.queryByText('Bản đọc của An')).not.toBeInTheDocument();
  });
});
