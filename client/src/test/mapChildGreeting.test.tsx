import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChildSessionGuard } from '../components/ChildSessionGuard.js';
import { QuestMapPage } from '../features/quest-map/QuestMapPage.js';
import { en, vi, useUiLanguageStore } from '../i18n/index.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';

const child: ChildProfile = { _id: 'child-a', parentId: 'parent-a', name: 'An', ageGroup: '5-6', companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1, badges: [], screenTimeLimit: 0 };
const parent = { id: 'parent-a', email: 'a@example.test', displayName: 'Parent', role: 'parent' as const };
const originalAdapter = api.defaults.adapter;
const initialAuth = useAuthStore.getState();
const initialChildren = useChildStore.getState();
const initialLanguage = useUiLanguageStore.getState();
let client: QueryClient;
let router: ReturnType<typeof createMemoryRouter>;
let requests: string[];
let profiles: () => Promise<ChildProfile[]>;

beforeEach(() => {
  useAuthStore.setState({ user: parent, isLoading: false });
  useChildStore.setState({ children: [child], activeChild: child, isLoading: false });
  useUiLanguageStore.setState({ manualLanguage: 'en' });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  requests = [];
  profiles = async () => [child];
  api.defaults.adapter = async config => {
    requests.push(config.url!);
    if (config.url !== '/stages' && config.url !== '/children') throw new Error(`Unexpected request: ${config.url}`);
    return { data: { data: config.url === '/children' ? await profiles() : [] }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

afterEach(() => {
  cleanup(); router?.dispose(); client.clear(); api.defaults.adapter = originalAdapter;
  useAuthStore.setState(initialAuth, true);
  useChildStore.setState(initialChildren, true);
  useUiLanguageStore.setState(initialLanguage, true);
});

function show({ guarded = false, url = '/kham-pha' } = {}) {
  router = createMemoryRouter([{ path: '/kham-pha', element: guarded
    ? <ChildSessionGuard screenTime={false}><QuestMapPage /></ChildSessionGuard>
    : <QuestMapPage /> }], { initialEntries: [url] });
  return render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
}

describe.each(['vi', 'en'] as const)('map child greeting (%s)', language => {
  it('uses existing translated copy while retaining the map heading and subtitle', async () => {
    useUiLanguageStore.setState({ manualLanguage: language });
    show();
    expect(screen.getByText(language === 'vi' ? 'Chào mừng bạn nhỏ An!' : 'Welcome, An!')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const copy = language === 'vi' ? vi : en;
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.map.title);
    expect(screen.getByText(copy.map.subtitle)).toBeInTheDocument();
    await waitFor(() => expect(requests).toEqual(['/stages']));
  });
});

it.each(['<img src=x onerror=alert(1)>', 'A'.repeat(120), 'Nguyen '.repeat(20).trim()])('renders the full name as plain text: %s', name => {
  useChildStore.getState().setActiveChild({ ...child, name });
  show();
  const greeting = screen.getByText(`Welcome, ${name}!`);
  expect(greeting.textContent).toBe(`Welcome, ${name}!`);
  expect(greeting.children).toHaveLength(0);
});

it('updates immediately on profile selection, rename and removal', () => {
  show();
  expect(screen.getByText('Welcome, An!')).toBeInTheDocument();
  act(() => useChildStore.getState().setActiveChild({ ...child, _id: 'child-b', name: 'Binh' }));
  expect(screen.queryByText('Welcome, An!')).not.toBeInTheDocument();
  expect(screen.getByText('Welcome, Binh!')).toBeInTheDocument();
  act(() => useChildStore.getState().setActiveChild({ ...child, _id: 'child-b', name: 'Mai' }));
  expect(screen.queryByText('Welcome, Binh!')).not.toBeInTheDocument();
  expect(screen.getByText('Welcome, Mai!')).toBeInTheDocument();
  act(() => useChildStore.getState().setActiveChild(null));
  expect(screen.queryByText(/^Welcome,/)).not.toBeInTheDocument();
});

it('does not render a greeting or fetch stages without an active child', () => {
  useChildStore.getState().setActiveChild(null);
  show();
  expect(screen.queryByText(/^Welcome,/)).not.toBeInTheDocument();
  expect(requests).toEqual([]);
});

it('keeps the URL-child mismatch warning instead of rendering a greeting', () => {
  show({ url: '/kham-pha?stage=s2&childId=child-b' });
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByText(/^Welcome,/)).not.toBeInTheDocument();
  expect(requests).toEqual([]);
});

it('hides stale names during real guard hydration and an account switch', async () => {
  let resolveProfiles!: (value: ChildProfile[]) => void;
  profiles = () => new Promise(resolve => { resolveProfiles = resolve; });
  show({ guarded: true });
  expect(screen.queryByText('Welcome, An!')).not.toBeInTheDocument();
  await waitFor(() => expect(requests).toEqual(['/children']));
  await act(async () => resolveProfiles([child]));
  expect(await screen.findByText('Welcome, An!')).toBeInTheDocument();
  act(() => useAuthStore.setState({ user: { ...parent, id: 'parent-b' } }));
  expect(screen.queryByText('Welcome, An!')).not.toBeInTheDocument();
  expect(useChildStore.getState().activeChild).toBeNull();
  await waitFor(() => expect(requests.filter(url => url === '/children')).toHaveLength(2));
  await act(async () => resolveProfiles([{ ...child, _id: 'child-b', parentId: 'parent-b', name: 'Mai' }]));
  expect(await screen.findByText('Welcome, Mai!')).toBeInTheDocument();
  expect(screen.queryByText('Welcome, An!')).not.toBeInTheDocument();
  act(() => useAuthStore.setState({ user: null }));
  expect(screen.queryByText(/^Welcome,/)).not.toBeInTheDocument();
});
