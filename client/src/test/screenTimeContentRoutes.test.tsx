import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import type { AxiosRequestConfig } from 'axios';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { router } from '../app/router.js';

// The real Parent Gate loads a signed math challenge over the network; swap it for an inert stub so
// mounting the lock screens here never fires a request.
vi.mock('../features/parent/ParentGateModal.js', () => ({
  ParentGateModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>stub-parent-gate</div> : null),
}));

const child: ChildProfile = {
  _id: 'child-a',
  parentId: 'parent-a',
  name: 'An',
  ageGroup: '5-6',
  companionLanguage: 'en',
  avatarId: 'star',
  viviPoints: 100,
  level: 1,
  badges: [],
  ownedItemIds: [],
  screenTimeLimit: 15,
};

// Visible headings that only render when the real page content mounts (default UI language is vi).
const STORIES_HEADING = 'Kho Đồng Dao & Truyện Tích';
const CULTURE_HEADING = 'Góc Văn Hóa Việt Nam';
const EXCEEDED_TITLE = 'Đến giờ cho mắt nghỉ ngơi!';
const REST_TITLE = 'Nghỉ mắt một chút nhé!';

const SESSION_KEY = `vietverse_session_start_${child._id}`;
const REST_KEY = `vietverse_rest_until_${child._id}`;

const originalAdapter = api.defaults.adapter;
let request: (config: AxiosRequestConfig) => unknown | Promise<unknown>;
let queryClient: QueryClient;

function signIn() {
  useAuthStore.setState({
    user: { id: 'parent-a', email: 'a@example.test', displayName: 'Parent', role: 'parent' },
    isLoading: false,
  });
}

function showRoute(path: string) {
  const memoryRouter = createMemoryRouter(router.routes as RouteObject[], { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={memoryRouter} />
    </QueryClientProvider>,
  );
  return memoryRouter;
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  useAuthStore.setState({ user: null, isLoading: false });
  useChildStore.setState({ activeChild: null, children: [], isLoading: false });
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  request = () => [];
  api.defaults.adapter = async (config) => ({ data: { data: await request(config) }, status: 200, statusText: 'OK', headers: {}, config });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  api.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
  vi.useRealTimers();
  useAuthStore.setState({ user: null, isLoading: false });
  useChildStore.setState({ activeChild: null, children: [], isLoading: false });
  localStorage.clear();
  sessionStorage.clear();
});

describe('screen-time lock covers the content routes for signed-in children', () => {
  it('shows the time-up screen instead of Kho truyện when the child is over the limit', async () => {
    signIn();
    sessionStorage.setItem(SESSION_KEY, String(Date.now() - 16 * 60000));
    request = (config) => (config.url === '/children' ? [child] : []);

    showRoute('/kho-truyen');

    expect(await screen.findByText(EXCEEDED_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(STORIES_HEADING)).not.toBeInTheDocument();
  });

  it('shows the time-up screen instead of Văn hoá when the child is over the limit', async () => {
    signIn();
    sessionStorage.setItem(SESSION_KEY, String(Date.now() - 16 * 60000));
    request = (config) => (config.url === '/children' ? [child] : []);

    showRoute('/van-hoa');

    expect(await screen.findByText(EXCEEDED_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(CULTURE_HEADING)).not.toBeInTheDocument();
  });

  it('shows the rest countdown instead of Kho truyện while the child is on a break', async () => {
    signIn();
    localStorage.setItem(REST_KEY, String(Date.now() + 5 * 60000));
    request = (config) => (config.url === '/children' ? [child] : []);

    showRoute('/kho-truyen');

    expect(await screen.findByText(REST_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(STORIES_HEADING)).not.toBeInTheDocument();
  });

  it('shows the rest countdown instead of Văn hoá while the child is on a break', async () => {
    signIn();
    localStorage.setItem(REST_KEY, String(Date.now() + 5 * 60000));
    request = (config) => (config.url === '/children' ? [child] : []);

    showRoute('/van-hoa');

    expect(await screen.findByText(REST_TITLE)).toBeInTheDocument();
    expect(screen.queryByText(CULTURE_HEADING)).not.toBeInTheDocument();
  });

  it('lets a guest with no active child read Kho truyện normally', async () => {
    request = () => [];

    showRoute('/kho-truyen');

    expect(await screen.findByText(STORIES_HEADING)).toBeInTheDocument();
    expect(screen.queryByText(EXCEEDED_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(REST_TITLE)).not.toBeInTheDocument();
  });

  it('lets a guest with no active child read Văn hoá normally', async () => {
    request = () => [];

    showRoute('/van-hoa');

    expect(await screen.findByText(CULTURE_HEADING)).toBeInTheDocument();
    expect(screen.queryByText(EXCEEDED_TITLE)).not.toBeInTheDocument();
    expect(screen.queryByText(REST_TITLE)).not.toBeInTheDocument();
  });
});
