import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api, setApiAccessToken } from '../lib/api.js';
import { useAuthStore, type User } from '../store/authStore.js';
import '../store/childStore.js';

const parent: User = { id: 'parent-a', email: 'a@example.test', displayName: 'Parent A', role: 'parent' };
const originalAdapter = api.defaults.adapter;

function unlockGate() {
  sessionStorage.setItem('vietverse_parent_gate_token', 'signed-parent-gate');
  sessionStorage.setItem('vietverse_parent_gate_unlocked', String(Date.now() + 60000));
}

function expectGateCleared() {
  expect(sessionStorage.getItem('vietverse_parent_gate_token')).toBeNull();
  expect(sessionStorage.getItem('vietverse_parent_gate_unlocked')).toBeNull();
}

beforeEach(() => {
  useAuthStore.setState({ user: null, subscription: null, accessToken: null, isLoading: true });
  sessionStorage.clear();
  api.defaults.adapter = async (config) => ({
    data: { data: { user: parent, accessToken: 'access', subscription: { plan: 'free', maxChildren: 1 } } },
    status: 200, statusText: 'OK', headers: {}, config,
  });
});

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  setApiAccessToken(null);
  sessionStorage.clear();
});

describe('parent gate authentication lifecycle', () => {
  it('preserves an unexpired gate while restoring the account on reload', async () => {
    unlockGate();
    await useAuthStore.getState().fetchMe();
    expect(useAuthStore.getState().user?.id).toBe('parent-a');
    expect(sessionStorage.getItem('vietverse_parent_gate_token')).toBe('signed-parent-gate');
    expect(Number(sessionStorage.getItem('vietverse_parent_gate_unlocked'))).toBeGreaterThan(Date.now());
  });

  it.each(['login', 'register'] as const)('clears the previous gate after an explicit %s even for the same user', async (method) => {
    useAuthStore.setState({ user: parent, isLoading: false });
    unlockGate();
    await useAuthStore.getState()[method]({ email: parent.email, password: 'test-password', displayName: parent.displayName });
    expectGateCleared();
  });

  it('clears the gate when session restoration fails before any user is loaded', async () => {
    unlockGate();
    api.defaults.adapter = async () => { throw new Error('Session unavailable'); };
    await useAuthStore.getState().fetchMe();
    expectGateCleared();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('clears the gate when the server restores a different signed-in account', async () => {
    useAuthStore.setState({ user: { ...parent, id: 'parent-b' }, isLoading: false });
    unlockGate();
    await useAuthStore.getState().fetchMe();
    expectGateCleared();
  });

  it('clears the gate on logout even when the request fails', async () => {
    useAuthStore.setState({ user: parent, isLoading: false });
    unlockGate();
    api.defaults.adapter = async () => { throw new Error('Offline'); };
    await useAuthStore.getState().logout();
    expectGateCleared();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
