import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ParentSettingsPage } from '../features/parent/ParentSettingsPage.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { useUiLanguageStore } from '../i18n/index.js';
import { enqueueOfflineCompletion, initOfflineSyncWorker } from '../lib/offlineSync.js';

const child: ChildProfile = {
  _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6',
  companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1,
  badges: [], ownedItemIds: [], screenTimeLimit: 20,
};
const otherChild: ChildProfile = { ...child, _id: 'b', name: 'Binh', screenTimeLimit: 30 };
const adapter = api.defaults.adapter;
let requests: Array<{ url: string; body: unknown; gate: unknown }>;
let respond: (config: InternalAxiosRequestConfig) => unknown | Promise<unknown>;
let stopWorker: (() => void) | undefined;
let queryClient: QueryClient | undefined;

beforeEach(() => {
  useAuthStore.setState({ user: { id: 'parent', email: 'parent@example.test', displayName: 'Parent', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: child, children: [child, otherChild] });
  useUiLanguageStore.setState({ manualLanguage: 'en' });
  sessionStorage.setItem('vietverse_parent_gate_token', 'test-gate');
  requests = [];
  respond = () => ({ ...child, screenTimeLimit: 0 });
  api.defaults.adapter = async config => {
    requests.push({ url: config.url!, body: config.data ? JSON.parse(config.data) : undefined, gate: config.headers['X-Parent-Gate-Token'] });
    return { data: { data: await respond(config) }, status: 200, statusText: 'OK', headers: {}, config };
  };
});
afterEach(() => {
  cleanup();
  stopWorker?.();
  stopWorker = undefined;
  queryClient?.clear();
  queryClient = undefined;
  vi.useRealTimers();
  api.defaults.adapter = adapter;
  localStorage.clear();
  sessionStorage.clear();
  useUiLanguageStore.setState({ manualLanguage: 'vi' });
});

async function startOfflineRefresh() {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  enqueueOfflineCompletion({ id: 'settings-offline', userId: 'parent', childId: 'a', lessonId: 'lesson', answers: [], savedAt: 1 });
  await act(async () => { stopWorker = initOfflineSyncWorker(queryClient!); });
  await waitFor(() => expect(requests.some(request => request.url === '/children')).toBe(true));
}

it('keeps the selected limit and loading through an offline profile refresh during save', async () => {
  const patch = deferred();
  respond = config => {
    if (config.url === '/parent/screen-time') return patch.promise;
    if (config.url === '/children') return [{ ...child, viviPoints: 10 }, otherChild];
    if (config.url === '/children/a/select') return { ...child, viviPoints: 10, screenTimeLimit: 0 };
    if (config.url === '/lessons/lesson/complete') return { passed: true };
    throw new Error(`Unexpected request: ${config.url}`);
  };
  show(); chooseUnlimited(); save();
  await startOfflineRefresh();
  await waitFor(() => expect(useChildStore.getState().activeChild?.viviPoints).toBe(10));
  expect(screen.getByRole('radio', { name: /^Unlimited/ })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await act(async () => patch.resolve({ ...child, screenTimeLimit: 0 }));
  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
  expect(useChildStore.getState().activeChild?.screenTimeLimit).toBe(0);
});

it.each(['patch', 'selection'] as const)('keeps the new child when offline refresh overlaps an old %s response', async phase => {
  const patch = deferred(), selection = deferred(), offline = deferred();
  respond = config => {
    if (config.url === '/parent/screen-time') return JSON.parse(config.data).childId === 'a' ? patch.promise : otherChild;
    if (config.url === '/children') return offline.promise;
    if (config.url === '/children/a/select') return selection.promise;
    if (config.url === '/children/b/select') return otherChild;
    if (config.url === '/lessons/lesson/complete') return { passed: true };
    throw new Error(`Unexpected request: ${config.url}`);
  };
  show(); chooseUnlimited(); save();
  await startOfflineRefresh();
  if (phase === 'selection') {
    await act(async () => patch.resolve({ ...child, screenTimeLimit: 0 }));
    await waitFor(() => expect(requests.some(request => request.url === '/children/a/select')).toBe(true));
  }
  act(() => useChildStore.getState().setActiveChild(otherChild));
  await act(async () => {
    offline.resolve([{ ...child, viviPoints: 10 }, otherChild]);
    if (phase === 'patch') patch.resolve({ ...child, screenTimeLimit: 0 });
    else selection.resolve({ ...child, screenTimeLimit: 0 });
  });
  expect(useChildStore.getState().activeChild?._id).toBe('b');
  expect(screen.getByRole('radio', { name: /^30 minutes/ })).toHaveAttribute('aria-checked', 'true');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
  expect(requests.filter(request => request.url === '/children/a/select')).toHaveLength(phase === 'selection' ? 1 : 0);
  save();
  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(useChildStore.getState().activeChild?._id).toBe('b');
});

it.each(['success', 'failure'] as const)('ignores refresh %s after account change', async outcome => {
  const refresh = deferred();
  respond = config => config.url?.endsWith('/select') ? refresh.promise : child;
  show(); save();
  await waitFor(() => expect(requests).toHaveLength(2));
  act(() => useAuthStore.setState({ user: { id: 'other-parent', email: 'other@example.test', displayName: 'Other', role: 'parent' } }));
  await act(async () => {
    if (outcome === 'success') refresh.resolve(child);
    else refresh.reject(new Error('old refresh failed'));
  });
  expect(useChildStore.getState().activeChild).toBeNull();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
});

it.each(['success', 'failure'] as const)('does not notify a remounted screen about the old refresh %s', async outcome => {
  const refresh = deferred();
  respond = config => config.url?.endsWith('/select') ? refresh.promise : child;
  const view = show(); save();
  await waitFor(() => expect(requests).toHaveLength(2));
  view.unmount();
  show();
  await act(async () => {
    if (outcome === 'success') refresh.resolve(child);
    else refresh.reject(new Error('old refresh failed'));
  });
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
  expect(requests).toHaveLength(2);
});

it('expires confirmation after three seconds and clears its timer when unmounted', async () => {
  vi.useFakeTimers();
  const view = show();
  await act(async () => save());
  expect(screen.getByRole('status')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(2999));
  expect(screen.getByRole('status')).toBeInTheDocument();
  act(() => vi.advanceTimersByTime(1));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  await act(async () => save());
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
const show = () => render(<MemoryRouter><ParentSettingsPage /></MemoryRouter>);
const save = () => fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
const chooseUnlimited = () => fireEvent.click(screen.getByRole('radio', { name: /^Unlimited/ }));
function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<unknown>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

it.each(['en', 'vi'] as const)('shows an accessible %s error, keeps zero and retries without a false success', async language => {
  useUiLanguageStore.setState({ manualLanguage: language });
  respond = () => { throw new Error('offline'); };
  show();
  const saveName = language === 'en' ? 'Save settings' : 'Lưu cài đặt';
  const unlimited = screen.getByRole('radio', { name: language === 'en' ? /^Unlimited/ : /^Không giới hạn/ });
  fireEvent.click(unlimited);
  fireEvent.click(screen.getByRole('button', { name: saveName }));
  expect(await screen.findByRole('alert')).toHaveTextContent(language === 'en' ? /try saving again/i : /thử lưu lại/i);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(unlimited).toHaveAttribute('aria-checked', 'true');
  expect(useChildStore.getState().activeChild?.screenTimeLimit).toBe(20);
  expect(requests).toEqual([{ url: '/parent/screen-time', body: { childId: 'a', limitMinutes: 0 }, gate: 'test-gate' }]);

  respond = () => ({ ...child, screenTimeLimit: 0 });
  fireEvent.click(screen.getByRole('button', { name: saveName }));
  expect(await screen.findByRole('status')).toHaveTextContent(language === 'en' ? /updated successfully/i : /thành công/i);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(useChildStore.getState().activeChild?.screenTimeLimit).toBe(0);
  expect(requests.map(request => request.url)).toEqual(['/parent/screen-time', '/parent/screen-time', '/children/a/select']);
});

it('disables editing and duplicate submits while pending and only confirms after profile refresh', async () => {
  const patch = deferred(), refresh = deferred();
  respond = config => config.url === '/parent/screen-time' ? patch.promise : refresh.promise;
  show(); chooseUnlimited(); save();
  expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled();
  for (const option of screen.getAllByRole('radio')) expect(option).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: /Processing/i }));
  await waitFor(() => expect(requests).toHaveLength(1));
  await act(async () => patch.resolve({ ...child, screenTimeLimit: 0 }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled();
  await act(async () => refresh.resolve({ ...child, screenTimeLimit: 0 }));
  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
  fireEvent.click(screen.getByRole('radio', { name: /^15 minutes/ }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('handles a failed profile refresh without claiming that the settings are confirmed', async () => {
  respond = config => {
    if (config.url?.endsWith('/select')) throw new Error('refresh failed');
    return { ...child, screenTimeLimit: 0 };
  };
  show(); chooseUnlimited(); save();
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('radio', { name: /^Unlimited/ })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
});

it('keeps the Parent Gate rejection and does not send a profile selection after failure', async () => {
  respond = config => { throw new AxiosError('gate expired', 'ERR_BAD_REQUEST', config, undefined, {
    data: { error: { code: 'PARENT_GATE_REQUIRED' } }, status: 403, statusText: 'Forbidden', headers: {}, config,
  }); };
  show(); save();
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(sessionStorage.getItem('vietverse_parent_gate_token')).toBeNull();
  expect(requests.map(request => request.url)).toEqual(['/parent/screen-time']);
});

it.each(['success', 'failure'] as const)('ignores late PATCH %s after switching profiles and permits a new save', async outcome => {
  const old = deferred();
  respond = () => old.promise;
  show(); chooseUnlimited(); save();
  await waitFor(() => expect(requests).toHaveLength(1));
  act(() => useChildStore.getState().setActiveChild(otherChild));
  expect(screen.getByRole('radio', { name: /^30 minutes/ })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeEnabled();
  await act(async () => {
    if (outcome === 'success') old.resolve({ ...child, screenTimeLimit: 0 });
    else old.reject(new Error('late failure'));
  });
  expect(useChildStore.getState().activeChild?._id).toBe('b');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(requests).toHaveLength(1);
  respond = () => otherChild;
  save();
  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(requests[1].body).toEqual({ childId: 'b', limitMinutes: 30 });
});

it('does not reactivate an earlier attempt when the profile changes away and back in one update', async () => {
  const pending = deferred(); respond = () => pending.promise;
  show(); chooseUnlimited(); save();
  await waitFor(() => expect(requests).toHaveLength(1));
  act(() => {
    useChildStore.getState().setActiveChild(otherChild);
    useChildStore.getState().setActiveChild(child);
  });
  await act(async () => pending.resolve({ ...child, screenTimeLimit: 0 }));
  expect(requests).toHaveLength(1);
  expect(useChildStore.getState().activeChild?.screenTimeLimit).toBe(20);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('ignores a stale profile refresh when selection changes during the second request', async () => {
  const refresh = deferred();
  respond = config => config.url?.endsWith('/select') ? refresh.promise : { ...child, screenTimeLimit: 0 };
  show(); chooseUnlimited(); save();
  await waitFor(() => expect(requests).toHaveLength(2));
  act(() => useChildStore.getState().setActiveChild(otherChild));
  await act(async () => refresh.resolve({ ...child, screenTimeLimit: 0 }));
  expect(useChildStore.getState().activeChild?._id).toBe('b');
  expect(screen.getByRole('radio', { name: /^30 minutes/ })).toHaveAttribute('aria-checked', 'true');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it.each(['success', 'failure'] as const)('handles a late %s after unmount without starting a selection request', async outcome => {
  const pending = deferred(); respond = () => pending.promise;
  const view = show(); chooseUnlimited(); save();
  await waitFor(() => expect(requests).toHaveLength(1));
  view.unmount();
  await act(async () => {
    if (outcome === 'success') pending.resolve({ ...child, screenTimeLimit: 0 });
    else pending.reject(new Error('late failure'));
  });
  expect(requests).toHaveLength(1);
  expect(useChildStore.getState().activeChild?.screenTimeLimit).toBe(20);
});

it('does not continue an old account save and disables save without a selected child', async () => {
  const pending = deferred(); respond = () => pending.promise;
  show(); save();
  await waitFor(() => expect(requests).toHaveLength(1));
  act(() => useAuthStore.setState({ user: null }));
  await act(async () => pending.resolve({ ...child, screenTimeLimit: 15 }));
  expect(requests).toHaveLength(1);
  expect(useChildStore.getState().activeChild).toBeNull();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save settings' })).toBeDisabled();
});

it.each([15, 20, 30])('preserves the existing %i minute option and saves it for the current profile', async limit => {
  respond = () => ({ ...child, screenTimeLimit: limit });
  show();
  fireEvent.click(screen.getByRole('radio', { name: new RegExp(`^${limit} minutes`) }));
  save();
  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(requests[0].body).toEqual({ childId: 'a', limitMinutes: limit });
  expect(useChildStore.getState().activeChild?.screenTimeLimit).toBe(limit);
});

it('does not let an old failure clear the loading state of a new profile save', async () => {
  const old = deferred(), current = deferred();
  respond = config => config.url === '/parent/screen-time'
    ? (JSON.parse(config.data).childId === 'a' ? old.promise : current.promise)
    : otherChild;
  show(); save();
  await waitFor(() => expect(requests).toHaveLength(1));
  act(() => useChildStore.getState().setActiveChild(otherChild));
  save();
  await waitFor(() => expect(requests).toHaveLength(2));
  await act(async () => old.reject(new Error('old request failed')));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled();
  await act(async () => current.resolve(otherChild));
  expect(await screen.findByRole('status')).toBeInTheDocument();
  expect(useChildStore.getState().activeChild?._id).toBe('b');
  expect(requests.map(request => request.url)).toEqual(['/parent/screen-time', '/parent/screen-time', '/children/b/select']);
});
