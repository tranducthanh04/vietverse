import { afterEach, beforeEach, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { enqueueOfflineCompletion, initOfflineSyncWorker, readOfflineCompletions, syncOfflineCompletions } from '../lib/offlineSync.js';

const originalAdapter = api.defaults.adapter;
let client: QueryClient;
let stopWorker: (() => void) | undefined;
let unsubscribe: Array<() => void>;
let posted: string[];
let profileReads: number;
const parent = { id: 'parent', email: 'parent@example.test', displayName: 'Parent', role: 'parent' as const };
function child(id = 'child-a', points = 5): ChildProfile {
  return { _id: id, parentId: parent.id, name: id, ageGroup: '5-6', companionLanguage: 'en',
    avatarId: 'a', viviPoints: points, level: 1, badges: [], screenTimeLimit: 20 };
}
function enqueue(id = 'lesson-a', childId = 'child-a') {
  enqueueOfflineCompletion({ id, userId: parent.id, childId, lessonId: id,
    contentVersion: 2, answers: [{ activityId: 'a', userAnswer: 'b' }], savedAt: 1 });
}
function watch(key: string[], next: unknown) {
  client.setQueryData(key, { value: 'before' });
  const observer = new QueryObserver(client, { queryKey: key, queryFn: async () => next, staleTime: Infinity });
  unsubscribe.push(observer.subscribe(() => {}));
}
function respond(config: InternalAxiosRequestConfig, data: unknown) {
  return { data: { success: true, data }, status: 200, statusText: 'OK', headers: {}, config };
}

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: parent, isLoading: false });
  useChildStore.setState({ children: [child(), child('child-b', 50)], activeChild: child() });
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  unsubscribe = [];
  posted = [];
  profileReads = 0;
  api.defaults.adapter = async config => {
    if (config.method === 'post') {
      posted.push(config.url!);
      return respond(config, { passed: true, totalPoints: 999 });
    }
    if (config.url === '/children') {
      profileReads++;
      return respond(config, [child('child-a', 30), child('child-b', 50)]);
    }
    throw new Error(`Unexpected request: ${config.url}`);
  };
});

afterEach(() => {
  stopWorker?.();
  stopWorker = undefined;
  unsubscribe.forEach(stop => stop());
  client.clear();
  api.defaults.adapter = originalAdapter;
  localStorage.clear();
});

it('refreshes points, history, map, parent progress and header from the server after startup sync', async () => {
  const keys = [['childPoints', 'child-a'], ['childPoints', 'child-a', 'history'],
    ['stages', 'child-a'], ['parentProgress', 'child-a']];
  for (const key of keys) watch(key, { value: 'after' });
  client.setQueryData(['childPoints', 'child-b'], { value: 'other-child' });
  enqueue();
  stopWorker = initOfflineSyncWorker(client);
  await waitFor(() => expect(client.getQueryData(keys[0])).toEqual({ value: 'after' }));
  for (const key of keys) expect(client.getQueryData(key)).toEqual({ value: 'after' });
  expect(client.getQueryState(['childPoints', 'child-b'])?.isInvalidated).toBe(false);
  await waitFor(() => expect(useChildStore.getState().activeChild?.viviPoints).toBe(30));
  expect(readOfflineCompletions()).toEqual([]);
  expect(posted).toEqual(['/lessons/lesson-a/complete']);
  expect(profileReads).toBe(1);
});

it('invalidates inactive queries only for successfully acknowledged children in a partial batch', async () => {
  for (const id of ['child-a', 'child-b']) client.setQueryData(['stages', id], { value: 'before' });
  const adapter = api.defaults.adapter as AxiosAdapter;
  api.defaults.adapter = async config => {
    if (config.url === '/lessons/rejected/complete') throw { response: { status: 409, data: { error: { code: 'CONTENT_CONFLICT' } } } };
    return adapter(config);
  };
  enqueue();
  enqueue('rejected', 'child-b');
  stopWorker = initOfflineSyncWorker(client);
  await waitFor(() => expect(client.getQueryState(['stages', 'child-a'])?.isInvalidated).toBe(true));
  expect(client.getQueryState(['stages', 'child-b'])?.isInvalidated).toBe(false);
  expect(readOfflineCompletions()).toMatchObject([{ id: 'rejected', status: 'needs_attention' }]);
});

it('refreshes a saved unsuccessful attempt without inventing completion or points', async () => {
  const adapter = api.defaults.adapter as AxiosAdapter;
  api.defaults.adapter = async config => config.method === 'post'
    ? respond(config, { passed: false, pointsEarned: 0, totalPoints: 5 })
    : adapter(config);
  watch(['parentProgress', 'child-a'], { status: 'in_progress', points: 5 });
  enqueue();
  stopWorker = initOfflineSyncWorker(client);
  await waitFor(() => expect(client.getQueryData(['parentProgress', 'child-a'])).toEqual({ status: 'in_progress', points: 5 }));
  expect(readOfflineCompletions()).toEqual([]);
});

it('keeps caches and queued answers when the submission fails', async () => {
  client.setQueryData(['childPoints', 'child-a'], { value: 'before' });
  api.defaults.adapter = async () => { throw { code: 'ERR_NETWORK' }; };
  stopWorker = initOfflineSyncWorker(client);
  await syncOfflineCompletions();
  enqueue();
  expect(await syncOfflineCompletions()).toEqual({ syncedCount: 0, errors: 1 });
  expect(client.getQueryState(['childPoints', 'child-a'])?.isInvalidated).toBe(false);
  expect(useChildStore.getState().activeChild?.viviPoints).toBe(5);
  expect(readOfflineCompletions()).toHaveLength(1);
});

it('does not refresh another account when an old submission finishes after an account switch', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const adapter = api.defaults.adapter as AxiosAdapter;
  api.defaults.adapter = async config => {
    if (config.method === 'post') await pending;
    return adapter(config);
  };
  client.setQueryData(['stages', 'child-a'], { value: 'before' });
  enqueue();
  stopWorker = initOfflineSyncWorker(client);
  useAuthStore.setState({ user: { ...parent, id: 'other-parent' } });
  release();
  await waitFor(() => expect(readOfflineCompletions()).toEqual([]));
  expect(client.getQueryState(['stages', 'child-a'])?.isInvalidated).toBe(false);
  expect(profileReads).toBe(0);
  expect(useChildStore.getState().activeChild).toBeNull();
});

it('does not resend an acknowledged completion when refreshing the profile fails', async () => {
  const adapter = api.defaults.adapter as AxiosAdapter;
  api.defaults.adapter = async config => {
    if (config.url === '/children') { profileReads++; throw { code: 'ERR_NETWORK' }; }
    return adapter(config);
  };
  enqueue();
  stopWorker = initOfflineSyncWorker(client);
  await waitFor(() => expect(profileReads).toBe(1));
  expect(readOfflineCompletions()).toEqual([]);
  expect(await syncOfflineCompletions()).toEqual({ syncedCount: 0, errors: 0 });
  expect(posted).toHaveLength(1);
  expect(useChildStore.getState().activeChild?.viviPoints).toBe(5);
});

it('removes refresh listeners on cleanup and refreshes once after restarting the worker', async () => {
  stopWorker = initOfflineSyncWorker(client);
  await syncOfflineCompletions();
  stopWorker();
  enqueue();
  await syncOfflineCompletions();
  expect(profileReads).toBe(0);
  stopWorker = initOfflineSyncWorker(client);
  await syncOfflineCompletions();
  enqueue('lesson-b');
  await syncOfflineCompletions();
  await waitFor(() => expect(profileReads).toBe(1));
});

it('refreshes each affected child once for a batch and preserves the legacy ownership fallback', async () => {
  let mapReads = 0;
  client.setQueryData(['stages', 'child-a'], { value: 'before' });
  const observer = new QueryObserver(client, {
    queryKey: ['stages', 'child-a'], staleTime: Infinity,
    queryFn: async () => { mapReads++; return { value: 'after' }; },
  });
  unsubscribe.push(observer.subscribe(() => {}));
  enqueue();
  enqueue('lesson-b');
  enqueueOfflineCompletion({ childId: 'child-a', lessonId: 'legacy', answers: [], savedAt: 1 });
  stopWorker = initOfflineSyncWorker(client);
  await waitFor(() => expect(client.getQueryData(['stages', 'child-a'])).toEqual({ value: 'after' }));
  expect(posted).toHaveLength(3);
  expect(readOfflineCompletions()).toEqual([]);
  expect(mapReads).toBe(1);
  expect(profileReads).toBe(1);
});

it('keeps the newly selected child when the profile refresh for an offline submission returns late', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const adapter = api.defaults.adapter as AxiosAdapter;
  let refreshStarted = false;
  api.defaults.adapter = async config => {
    if (config.url === '/children') { refreshStarted = true; await pending; }
    return adapter(config);
  };
  enqueue();
  stopWorker = initOfflineSyncWorker(client);
  await waitFor(() => expect(refreshStarted).toBe(true));
  useChildStore.getState().setActiveChild(child('child-b', 50));
  release();
  await waitFor(() => expect(useChildStore.getState().isLoading).toBe(false));
  expect(useChildStore.getState().activeChild?._id).toBe('child-b');
  expect(useChildStore.getState().activeChild?.viviPoints).toBe(50);
  expect(useChildStore.getState().children.find(profile => profile._id === 'child-a')?.viviPoints).toBe(30);
});

it('discards a late profile response after logout without restoring the previous account data', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const adapter = api.defaults.adapter as AxiosAdapter;
  let refreshStarted = false;
  api.defaults.adapter = async config => {
    if (config.url === '/children') { refreshStarted = true; await pending; }
    return adapter(config);
  };
  enqueue();
  stopWorker = initOfflineSyncWorker(client);
  await waitFor(() => expect(refreshStarted).toBe(true));
  useAuthStore.setState({ user: null });
  release();
  await waitFor(() => expect(profileReads).toBe(1));
  expect(useChildStore.getState().children).toEqual([]);
  expect(useChildStore.getState().activeChild).toBeNull();
});
