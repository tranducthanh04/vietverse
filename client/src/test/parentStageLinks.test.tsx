import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '../lib/api.js';
import { ParentJourney } from '../features/parent/ParentJourney.js';
import { QuestMapPage } from '../features/quest-map/QuestMapPage.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { useUiLanguageStore } from '../i18n/index.js';
import type { ParentStageProgress } from '../features/parent/parentProgress.types.js';

const child: ChildProfile = { _id: 'child-a', parentId: 'parent', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], screenTimeLimit: 0 };
const stageRows: ParentStageProgress[] = [
  { id: 's1', order: 1, title: 'Chặng 1: Một', totalLessons: 1, completedCount: 1, percentage: 100, isCompleted: true, isUnlocked: true, requiresSubscription: false, lockReason: null },
  { id: 's2', order: 2, title: 'Chặng 2: Hai', totalLessons: 1, completedCount: 0, percentage: 0, isCompleted: false, isUnlocked: true, requiresSubscription: false, lockReason: null },
  { id: 's3', order: 3, title: 'Chặng 3: Ba', totalLessons: 1, completedCount: 0, percentage: 0, isCompleted: false, isUnlocked: false, requiresSubscription: true, lockReason: 'subscription' },
  { id: 's4', order: 4, title: 'Chặng 4: Bốn', totalLessons: 0, completedCount: 0, percentage: 0, isCompleted: false, isUnlocked: false, requiresSubscription: false, lockReason: 'no_lessons' },
];
function mapStages() {
  return stageRows.map(stage => ({ ...stage, _id: stage.id, goal: `Goal ${stage.order}`, lessons: stage.totalLessons ? [{ _id: `lesson-${stage.id}`, order: 1, title: `Lesson ${stage.id}`, isUnlocked: stage.isUnlocked, status: stage.isCompleted ? 'completed' : 'not_started', stars: 0 }] : [] }));
}
const originalAdapter = api.defaults.adapter;
const initialChildren = useChildStore.getState();
let client: QueryClient;
let router: ReturnType<typeof createMemoryRouter>;
let requestedChildren: string[];
let respond: (childId: string) => unknown | Promise<unknown>;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  requestedChildren = [];
  respond = () => mapStages();
  useChildStore.setState({ children: [child], activeChild: child, isLoading: false });
  api.defaults.adapter = async config => {
    expect(config.url).toBe('/stages');
    requestedChildren.push(config.params.childId);
    return { data: { data: await respond(config.params.childId) }, status: 200, statusText: 'OK', headers: {}, config };
  };
});
afterEach(() => {
  cleanup(); router?.dispose(); client.clear(); api.defaults.adapter = originalAdapter;
  useChildStore.setState(initialChildren, true);
});
function show(url = '/kham-pha') {
  router = createMemoryRouter([
    { path: '/phu-huynh', element: <ParentJourney journey={{ stages: stageRows, currentStageId: 's2', isCompleted: false }} child={{ id: child._id, name: child.name, viviPoints: 0 }} /> },
    { path: '/kham-pha', element: <QuestMapPage /> },
    { path: '/hoc/:id', element: <h1>Lesson destination</h1> },
  ], { initialEntries: [url] });
  return render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
}

describe.each(['vi', 'en'] as const)('parent stage links (%s)', language => {
  it('links each report stage to its own details for the displayed child', async () => {
    useUiLanguageStore.setState({ manualLanguage: language });
    show('/phu-huynh');
    for (const stage of stageRows) {
      const card = screen.getByRole('heading', { name: stage.title }).closest('li')!;
      const label = stage.id === 's2' ? (language === 'vi' ? 'Tiếp tục chặng' : 'Continue stage') : (language === 'vi' ? 'Xem chi tiết' : 'View details');
      const link = within(card).getByRole('link', { name: `${label}: ${stage.title}` });
      expect(link).toHaveAttribute('href', `/kham-pha?stage=${stage.id}&childId=child-a`);
    }
    fireEvent.click(screen.getByRole('link', { name: `${language === 'vi' ? 'Tiếp tục chặng' : 'Continue stage'}: ${stageRows[1].title}` }));
    expect(await screen.findByRole('heading', { level: 2, name: stageRows[1].title })).toBeInTheDocument();
    expect(useChildStore.getState().activeChild?._id).toBe('child-a');
    expect(requestedChildren).toEqual(['child-a']);
  });
});

it('hides stale report links after the active child changes', () => {
  show('/phu-huynh');
  expect(screen.getByRole('link', { name: /Tiếp tục chặng/ })).toBeInTheDocument();
  act(() => useChildStore.setState({ activeChild: { ...child, _id: 'child-b' } }));
  expect(screen.queryByRole('link', { name: /Tiếp tục chặng|Xem chi tiết/ })).not.toBeInTheDocument();
});

it('loads the requested stage directly and uses server lesson eligibility', async () => {
  show('/kham-pha?stage=s2&childId=child-a');
  expect(await screen.findByRole('heading', { level: 2, name: stageRows[1].title })).toBeInTheDocument();
  expect(screen.queryByText('Lesson s1')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Vào học ngay' }));
  expect(await screen.findByRole('heading', { name: 'Lesson destination' })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe('/hoc/lesson-s2');
});

it('keeps completed lessons available only when the server marks them unlocked', async () => {
  show('/kham-pha?stage=s1');
  expect(await screen.findByRole('button', { name: 'Luyện tập lại' })).toBeInTheDocument();
  respond = () => mapStages().map(s => ({ ...s, isUnlocked: false, lessons: s.lessons.map(l => ({ ...l, isUnlocked: false })) }));
  await act(() => client.invalidateQueries({ queryKey: ['stages', child._id] }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Luyện tập lại' })).not.toBeInTheDocument());
  expect(screen.getByText(/Cần gói học còn hiệu lực|Cần hoàn thành chặng trước/)).toBeInTheDocument();
});

it('shows a locked stage without exposing a start action', async () => {
  show('/kham-pha?stage=s3');
  expect(await screen.findByRole('heading', { level: 2, name: stageRows[2].title })).toBeInTheDocument();
  expect(screen.getByText(/Cần gói học còn hiệu lực/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Vào học ngay|Luyện tập lại/ })).not.toBeInTheDocument();
});

it('shows zero lessons honestly and does not call an empty stage completed', async () => {
  show('/kham-pha?stage=s4');
  expect(await screen.findByRole('heading', { level: 2, name: stageRows[3].title })).toBeInTheDocument();
  expect(screen.getByText('0 / 0')).toBeInTheDocument();
  expect(screen.getByText('Chưa có bài học')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Vào học ngay|Luyện tập lại/ })).not.toBeInTheDocument();
});

it.each(['stage=', 'stage=unknown', 'stage=%3Cscript%3E', 'stage=s1&stage=s2'])('rejects invalid selection %s without falling back to stage one', async query => {
  show(`/kham-pha?${query}`);
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy chặng trong liên kết');
  expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Vào học ngay|Luyện tập lại/ })).not.toBeInTheDocument();
});

it('uses the first stage for a bare map and shows an empty catalogue explicitly', async () => {
  respond = () => [];
  show();
  expect(await screen.findByText('Chưa có dữ liệu chặng học.')).toBeInTheDocument();
  respond = () => mapStages();
  await act(() => client.invalidateQueries({ queryKey: ['stages', child._id] }));
  expect(await screen.findByRole('heading', { level: 2, name: stageRows[0].title })).toBeInTheDocument();
});

it('stores stage changes in history and restores them on back and forward', async () => {
  show('/kham-pha?stage=s2&source=parent');
  await screen.findByRole('heading', { level: 2, name: stageRows[1].title });
  fireEvent.click(screen.getByRole('button', { name: 'Chặng 1: Một' }));
  expect(new URLSearchParams(router.state.location.search).get('stage')).toBe('s1');
  expect(new URLSearchParams(router.state.location.search).get('source')).toBe('parent');
  await act(() => router.navigate(-1));
  expect(screen.getByRole('heading', { level: 2, name: stageRows[1].title })).toBeInTheDocument();
  await act(() => router.navigate(1));
  expect(screen.getByRole('heading', { level: 2, name: stageRows[0].title })).toBeInTheDocument();
});

it.each(['childId=someone-else', 'childId=', 'childId=child-a&childId=child-b'])('never selects or fetches a child supplied by the URL: %s', async query => {
  show(`/kham-pha?stage=s2&${query}`);
  expect(await screen.findByRole('alert')).toHaveTextContent('Liên kết không khớp với hồ sơ bé đang chọn');
  expect(requestedChildren).toEqual([]);
  expect(useChildStore.getState().activeChild?._id).toBe('child-a');
  fireEvent.click(screen.getByRole('link', { name: 'Mở bản đồ của bé đang chọn' }));
  expect(await screen.findByRole('heading', { level: 2, name: stageRows[0].title })).toBeInTheDocument();
});

it('does not show late stage data for the child replaced during a request', async () => {
  let resolveOld!: (value: unknown) => void;
  respond = id => id === 'child-a' ? new Promise(resolve => { resolveOld = resolve; }) : mapStages();
  show('/kham-pha?stage=s2&childId=child-a');
  await waitFor(() => expect(requestedChildren).toEqual(['child-a']));
  act(() => useChildStore.setState({ activeChild: { ...child, _id: 'child-b' } }));
  await act(async () => resolveOld(mapStages()));
  expect(screen.getByRole('alert')).toHaveTextContent('Liên kết không khớp');
  expect(screen.queryByText('Lesson s2')).not.toBeInTheDocument();
  expect(requestedChildren).toEqual(['child-a']);
});

it('refreshes permissions for the new child on an unbound stage URL', async () => {
  respond = id => id === 'child-a' ? mapStages() : mapStages().map(s => ({ ...s, isUnlocked: false, lessons: s.lessons.map(l => ({ ...l, isUnlocked: false })) }));
  show('/kham-pha?stage=s2');
  await screen.findByRole('button', { name: 'Vào học ngay' });
  act(() => useChildStore.setState({ activeChild: { ...child, _id: 'child-b' } }));
  expect(screen.queryByRole('button', { name: 'Vào học ngay' })).not.toBeInTheDocument();
  await screen.findByRole('heading', { level: 2, name: stageRows[1].title });
  expect(screen.queryByRole('button', { name: 'Vào học ngay' })).not.toBeInTheDocument();
  expect(requestedChildren).toEqual(['child-a', 'child-b']);
});

it('keeps the requested ID when refreshed catalogue data removes the stage', async () => {
  show('/kham-pha?stage=s2');
  await screen.findByRole('heading', { level: 2, name: stageRows[1].title });
  respond = () => mapStages().filter(s => s.id !== 's2');
  await act(() => client.invalidateQueries({ queryKey: ['stages', child._id] }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy chặng');
  expect(router.state.location.search).toBe('?stage=s2');
  expect(screen.queryByText('Lesson s1')).not.toBeInTheDocument();
});

it('reports load failures with retry instead of presenting a missing stage', async () => {
  respond = () => { throw new Error('offline'); };
  show('/kham-pha?stage=s2');
  expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải bản đồ');
  respond = () => mapStages();
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại ngay' }));
  expect(await screen.findByRole('heading', { level: 2, name: stageRows[1].title })).toBeInTheDocument();
});
