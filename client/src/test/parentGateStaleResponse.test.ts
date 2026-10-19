import { AxiosError, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api, getApiAccessToken, setApiAccessToken, hasSessionHint, hasProbedLegacySession, markLegacySessionProbed, clearSessionHint } from '../lib/api.js';

const tokenKey = 'vietverse_parent_gate_token';
const deadlineKey = 'vietverse_parent_gate_unlocked';
const originalAdapter = api.defaults.adapter;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function unlock(token = 'new-synthetic-gate', deadline = '2222222222222') {
  sessionStorage.setItem(tokenKey, token);
  sessionStorage.setItem(deadlineKey, deadline);
}

function expectPair(token: string | null = 'new-synthetic-gate', deadline: string | null = '2222222222222') {
  expect([sessionStorage.getItem(tokenKey), sessionStorage.getItem(deadlineKey)]).toEqual([token, deadline]);
}

function httpError(config: InternalAxiosRequestConfig, code = 'PARENT_GATE_EXPIRED', status = 403) {
  const response = { config, status, statusText: 'Rejected', headers: {}, data: { success: false, error: { code, message: 'Synthetic denial' } } };
  return new AxiosError('Synthetic denial', AxiosError.ERR_BAD_REQUEST, config, undefined, response);
}

async function dispatch(options: AxiosRequestConfig = {}) {
  const started = deferred<InternalAxiosRequestConfig>();
  const reply = deferred<AxiosResponse>();
  const result = api.get('/parent/progress/synthetic-child', {
    ...options,
    adapter: config => { started.resolve(config); return reply.promise; },
  }).then(value => ({ value, error: undefined }), error => ({ value: undefined, error }));
  const config = await started.promise;
  return { config, result, ...reply };
}

beforeEach(() => { sessionStorage.clear(); localStorage.clear(); clearSessionHint(); setApiAccessToken(null); });
afterEach(() => { sessionStorage.clear(); localStorage.clear(); clearSessionHint(); setApiAccessToken(null); api.defaults.adapter = originalAdapter; });

describe('parent gate response ownership through real Axios interceptors', () => {
  it('still invalidates the same credential after only its local deadline changes', async () => {
    unlock('same-synthetic-gate', '1111111111111');
    const request = await dispatch();
    unlock('same-synthetic-gate', '3333333333333');
    const error = httpError(request.config);
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair(null, null);
  });

  it.each(['old-synthetic-gate', 'new-synthetic-gate'])('gate denial for %s leaves PR30 hint, legacy marker and access token intact without retry', async token => {
    document.cookie = 'vv_has_session=1; path=/';
    markLegacySessionProbed();
    setApiAccessToken('synthetic-access');
    unlock(token);
    let attempts = 0;
    const started = deferred<InternalAxiosRequestConfig>();
    const reply = deferred<AxiosResponse>();
    const pending = api.get('/parent/progress/synthetic-child', { adapter: config => {
      attempts++; started.resolve(config); return reply.promise;
    } }).catch(error => error);
    const config = await started.promise;
    expect(config.headers.get('x-parent-gate-token')).toBe(token);
    unlock();
    const error = httpError(config); reply.reject(error);
    expect(await pending).toBe(error);
    expect(attempts).toBe(1);
    expect(hasSessionHint()).toBe(true);
    expect(hasProbedLegacySession()).toBe(true);
    expect(getApiAccessToken()).toBe('synthetic-access');
    if (token === 'old-synthetic-gate') expectPair(); else expectPair(null, null);
  });

  it('does not let an old protected-request denial erase a newly unlocked pair', async () => {
    unlock('old-synthetic-gate', '1111111111111');
    const request = await dispatch();
    expect(request.config.headers.get('X-Parent-Gate-Token')).toBe('old-synthetic-gate');
    unlock();
    const error = httpError(request.config);
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair();
  });

  it('does not let a tokenless request erase a pair created while it was pending', async () => {
    const request = await dispatch();
    expect(request.config.headers.has('X-Parent-Gate-Token')).toBe(false);
    unlock();
    const error = httpError(request.config, 'PARENT_GATE_REQUIRED');
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair();
  });

  it.each(['PARENT_GATE_EXPIRED', 'PARENT_GATE_INVALID', 'PARENT_GATE_REQUIRED'])('still clears both keys on a current-token %s', async code => {
    unlock();
    const request = await dispatch();
    expect(request.config.headers.get('x-parent-gate-token')).toBe('new-synthetic-gate');
    const error = httpError(request.config, code);
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair(null, null);
  });

  it.each(['FORBIDDEN', 'ORIGIN_NOT_ALLOWED', 'NOT_PARENT_GATE_EXPIRED', ''])('preserves the pair and exact error for ordinary403 code=%s', async code => {
    unlock();
    const request = await dispatch();
    expect(request.config.headers.get('x-parent-gate-token')).toBe('new-synthetic-gate');
    const error = httpError(request.config, code);
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair();
  });

  it('does not clear a gate for a non403 response with the same error code', async () => {
    unlock();
    const request = await dispatch();
    const error = httpError(request.config, 'PARENT_GATE_EXPIRED', 400);
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair();
  });

  it.each(['missing config', 'missing headers'])('preserves unrelated state without request evidence: %s', async missing => {
    unlock();
    const request = await dispatch();
    expect(request.config.headers.get('x-parent-gate-token')).toBe('new-synthetic-gate');
    const error = httpError(request.config);
    if (missing === 'missing config') error.config = undefined;
    else error.config = { ...request.config, headers: undefined } as unknown as InternalAxiosRequestConfig;
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair();
  });

  it.each(['', null, false] as const)('does not infer request ownership from an empty/disabled token=%s', async token => {
    const request = await dispatch({ headers: { 'X-Parent-Gate-Token': token } });
    expect(request.config.headers.get('X-Parent-Gate-Token')).toBe(token);
    unlock();
    const error = httpError(request.config, 'PARENT_GATE_REQUIRED');
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair();
  });

  it.each(['x-parent-gate-token', 'X-PARENT-GATE-TOKEN', 'X-Parent-Gate-Token'])('recognizes a transport-normalized %s header', async header => {
    unlock();
    const request = await dispatch();
    expect(request.config.headers.get('X-Parent-Gate-Token')).toBe('new-synthetic-gate');
    // Some adapters expose a plain header map rather than AxiosHeaders on errors.
    const config = { ...request.config, headers: { [header]: 'new-synthetic-gate' } } as unknown as InternalAxiosRequestConfig;
    const error = httpError(config);
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair(null, null);
  });

  it('uses the actual interceptor-attached token rather than a caller-supplied old header', async () => {
    unlock();
    const request = await dispatch({ headers: { 'x-parent-gate-token': 'caller-old-gate' } });
    expect(request.config.headers.get('x-parent-gate-token')).toBe('new-synthetic-gate');
    const error = httpError(request.config);
    request.reject(error);
    expect((await request.result).error).toBe(error);
    expectPair(null, null);
  });

  it('compares storage when the error handler runs, not when the adapter settles', async () => {
    unlock('old-synthetic-gate', '1111111111111');
    const request = await dispatch();
    expect(request.config.headers.get('x-parent-gate-token')).toBe('old-synthetic-gate');
    const error = httpError(request.config);
    request.reject(error);
    unlock(); // Same turn: the Axios response chain has not consumed the rejection.
    expect((await request.result).error).toBe(error);
    expectPair();
  });

  it('preserves newer success through reordered old failures, but clears a newer denial', async () => {
    unlock('old-synthetic-gate', '1111111111111');
    const oldA = await dispatch();
    const oldB = await dispatch();
    expect([oldA, oldB].map(r => r.config.headers.get('x-parent-gate-token'))).toEqual(['old-synthetic-gate', 'old-synthetic-gate']);
    unlock();
    const fresh = await dispatch();
    expect(fresh.config.headers.get('x-parent-gate-token')).toBe('new-synthetic-gate');
    fresh.resolve({ config: fresh.config, status: 200, statusText: 'OK', headers: {}, data: { data: { marker: 'new-authorized-progress' } } });
    expect((await fresh.result).value?.data).toEqual({ data: { marker: 'new-authorized-progress' } });
    for (const request of [oldB, oldA]) {
      const error = httpError(request.config);
      request.reject(error);
      expect((await request.result).error).toBe(error);
      expectPair();
    }
    const denied = await dispatch();
    expect(denied.config.headers.get('x-parent-gate-token')).toBe('new-synthetic-gate');
    const error = httpError(denied.config);
    denied.reject(error);
    expect((await denied.result).error).toBe(error);
    expectPair(null, null);
  });

  it('does not restore a cleared pair when an old successful request finishes', async () => {
    unlock();
    const pending = await dispatch();
    const denied = await dispatch();
    denied.reject(httpError(denied.config));
    expect((await denied.result).error.response.status).toBe(403);
    pending.resolve({ config: pending.config, status: 200, statusText: 'OK', headers: {}, data: { data: {} } });
    expect((await pending.result).value?.status).toBe(200);
    expectPair(null, null);
  });

  it('keeps a new pair after cancellation races with an old403', async () => {
    unlock('old-synthetic-gate', '1111111111111');
    const controller = new AbortController();
    const request = await dispatch({ signal: controller.signal });
    expect(request.config.headers.get('x-parent-gate-token')).toBe('old-synthetic-gate');
    controller.abort();
    unlock();
    request.reject(httpError(request.config));
    expect((await request.result).error.code).toBe('ERR_CANCELED');
    expectPair();
  });

  it('retains401 refresh/retry with the current access and gate headers', async () => {
    unlock();
    setApiAccessToken('old-access');
    const sent: Array<[string | undefined, unknown, unknown]> = [];
    api.defaults.adapter = async config => {
      sent.push([config.url, config.headers.get('Authorization'), config.headers.get('x-parent-gate-token')]);
      if (config.url === '/auth/refresh') return { config, status: 200, statusText: 'OK', headers: {}, data: { data: { accessToken: 'fresh-access', user: { id: 'synthetic-parent' }, subscription: null } } };
      if (sent.length === 1) throw httpError(config, 'TOKEN_EXPIRED', 401);
      return { config, status: 200, statusText: 'OK', headers: {}, data: { data: 'authorized-progress' } };
    };
    const result = await api.get('/parent/progress/synthetic-child');
    expect(result.data).toEqual({ data: 'authorized-progress' });
    expect(sent).toEqual([
      ['/parent/progress/synthetic-child', 'Bearer old-access', 'new-synthetic-gate'],
      ['/auth/refresh', 'Bearer old-access', 'new-synthetic-gate'],
      ['/parent/progress/synthetic-child', 'Bearer fresh-access', 'new-synthetic-gate'],
    ]);
    expect(getApiAccessToken()).toBe('fresh-access');
    expectPair();
  });
});
