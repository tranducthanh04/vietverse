import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore } from '../store/childStore.js';
import { useLessonSessionStore } from '../store/lessonSessionStore.js';
import { LessonPlayerPage } from '../features/lesson-player/LessonPlayerPage.js';

const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock('canvas-confetti', () => ({ default: () => {} }));
vi.mock('idb-keyval', () => ({
  get: async (key: string) => cache.get(key),
  set: vi.fn(async (key: string, value: unknown) => { cache.set(key, value); }),
  del: vi.fn(async (key: string) => { cache.delete(key); }),
}));

const original = api.defaults.adapter;
let client: QueryClient;
let calls: Array<{ url?: string; method?: string }>;

// Two lessons in the same stage. The stage catalogue still reports lesson2 as locked (stale),
// which is exactly the state right after finishing lesson1 before a refetch.
const lesson = (id: string, prompt: string) => ({ _id: id, contentVersion: 2, activities: [{ id: `c-${id}`, type: 'word_card', prompt, targetWord: 'A' }] });
let stages: unknown;
let completeResult: unknown;

beforeEach(() => {
  cache.clear(); localStorage.clear(); calls = [];
  useAuthStore.setState({ user: { id: 'parent', email: '', displayName: '', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: { _id: 'child', parentId: 'parent', name: 'Child', ageGroup: '5-6', companionLanguage: 'en', avatarId: '', viviPoints: 0, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 0 } as any });
  useLessonSessionStore.setState({ currentSession: null } as any);
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  stages = [{ _id: 's1', order: 1, lessons: [
    { _id: 'lesson1', order: 1, isUnlocked: true, status: 'completed' },
    { _id: 'lesson2', order: 2, isUnlocked: false, status: 'not_started' },
  ] }];
  completeResult = { stars: 3, pointsEarned: 10, totalPoints: 10, passed: true, scorePercent: 100 };
  api.defaults.adapter = async config => {
    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();
    calls.push({ url, method });
    let data: unknown = {};
    if (method === 'post' && url.includes('/complete')) data = completeResult;
    else if (url.includes('/stages')) data = stages;
    else if (url.includes('/lessons/lesson2')) data = lesson('lesson2', 'Bài hai');
    else if (url.includes('/lessons/lesson1')) data = lesson('lesson1', 'Bài một');
    return { data: { data }, status: 200, statusText: 'OK', headers: {}, config } as any;
  };
});
afterEach(() => { cleanup(); client.clear(); api.defaults.adapter = original; vi.restoreAllMocks(); });

function show(path = '/hoc/lesson1') {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path="/hoc/:lessonId" element={<LessonPlayerPage />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('next lesson navigation after completion', () => {
  it('offers and opens the next lesson in the stage once this one is passed', async () => {
    show(); await screen.findByText('Bài một');
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành bài' }));

    // The completion modal exposes a "next lesson" action (previously missing entirely).
    const next = await screen.findByRole('button', { name: 'Bài tiếp theo' });
    // Completion must refresh the map's unlock state so the next lesson is reachable.
    expect(calls.some(call => call.url?.includes('/stages'))).toBe(true);

    fireEvent.click(next);
    // Navigating to /hoc/lesson2 loads the following lesson in place.
    await screen.findByText('Bài hai');
  });

  it('does not offer a next lesson when the completed lesson is the last one', async () => {
    stages = [{ _id: 's1', order: 1, lessons: [{ _id: 'lesson1', order: 1, isUnlocked: true, status: 'completed' }] }];
    show(); await screen.findByText('Bài một');
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành bài' }));
    await screen.findByRole('button', { name: 'Về bản đồ' });
    expect(screen.queryByRole('button', { name: 'Bài tiếp theo' })).not.toBeInTheDocument();
  });

  it('does not offer a next lesson when the attempt did not pass', async () => {
    completeResult = { stars: 0, pointsEarned: 0, totalPoints: 0, passed: false, scorePercent: 0 };
    show(); await screen.findByText('Bài một');
    fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành bài' }));
    await screen.findByText('Bé hãy luyện tập thêm nhé!');
    expect(screen.queryByRole('button', { name: 'Bài tiếp theo' })).not.toBeInTheDocument();
  });
});
