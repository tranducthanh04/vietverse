import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { PublicLayout } from '../app/layouts/PublicLayout.js';
import { QuestMapPage } from '../features/quest-map/QuestMapPage.js';
import { StoriesPage } from '../features/stories/StoriesPage.js';

let queries: QueryClient;
const adapter = api.defaults.adapter;
beforeEach(() => {
  queries = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ user: null });
  useChildStore.setState({ activeChild: null, children: [] });
});
afterEach(() => {
  cleanup(); queries.clear(); api.defaults.adapter = adapter; vi.restoreAllMocks();
});
function show(element: React.ReactElement) {
  render(<QueryClientProvider client={queries}><MemoryRouter>{element}</MemoryRouter></QueryClientProvider>);
}
function respond(data: unknown) {
  api.defaults.adapter = async config => ({ data: { data }, status: 200, statusText: 'OK', headers: {}, config });
}

it('marks all unpublished footer documents unavailable instead of presenting dead controls', () => {
  show(<PublicLayout />);
  const footer = within(screen.getByRole('contentinfo'));
  for (const label of ['Điều khoản dịch vụ', 'Chính sách bảo mật dữ liệu', 'Bảo vệ quyền riêng tư trẻ em', 'Cẩm nang dành cho phụ huynh']) {
    const item = footer.getByText(label).closest('li')!;
    expect(within(item).getByText(/chưa khả dụng/i)).toBeInTheDocument();
    expect(item).not.toHaveClass('cursor-pointer');
    expect(within(item).queryByRole('link')).not.toBeInTheDocument();
  }
  expect(footer.getByRole('link', { name: 'Kho truyện dân gian tương tác' })).toHaveAttribute('href', '/kho-truyen');
});

it.each(['Chặng 1: Làm quen tiếng Việt', 'Làm quen tiếng Việt'])(
  'shows exactly one stage prefix for catalog title %s', async title => {
    useChildStore.setState({ activeChild: { _id: 'child', viviPoints: 0 } as ChildProfile });
    respond([{ _id: 'stage', order: 1, title, isUnlocked: true, lessons: [], totalLessons: 4 }]);
    show(<QuestMapPage />);
    expect(await screen.findByRole('button', { name: 'Chặng 1: Làm quen tiếng Việt' })).toBeInTheDocument();
    expect(screen.queryByText(/Chặng 1: Chặng 1:/)).not.toBeInTheDocument();
  },
);

it.each([undefined, '', '   '])('shows reading mode without an audio asset (%s), even with stale duration', async audioUrl => {
  respond([{ _id: 'story', title: 'Truyện QA', type: 'dong_dao', description: '', audioUrl, durationSec: 45 }]);
  show(<StoriesPage />);
  expect(await screen.findByText('Bản đọc')).toBeInTheDocument();
  expect(screen.queryByText(/\d+ giây/)).not.toBeInTheDocument();
});

it.each([undefined, 0, -1])('does not fabricate a duration for an audio asset with unknown length (%s)', async durationSec => {
  respond([{ _id: 'story', title: 'Truyện QA', type: 'dong_dao', description: '', audioUrl: '/audio/story.mp3', durationSec }]);
  show(<StoriesPage />);
  expect(await screen.findByText('Có bản thu')).toBeInTheDocument();
  expect(screen.queryByText(/giây/)).not.toBeInTheDocument();
});

it('keeps the supplied positive duration for a recorded story', async () => {
  respond([{ _id: 'story', title: 'Truyện QA', type: 'dong_dao', description: '', audioUrl: '/audio/story.mp3', durationSec: 45 }]);
  show(<StoriesPage />);
  expect(await screen.findByText('45 giây')).toBeInTheDocument();
});
