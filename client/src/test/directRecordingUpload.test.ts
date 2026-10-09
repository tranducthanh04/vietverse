import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, setApiAccessToken } from '../lib/api.js';
import { createDirectRecordingUpload } from '../lib/directRecordingUpload.js';

const receipt = { id: '123456789012345678901234' };
const intent = { intentId: 'abcdefabcdefabcdefabcdef', expiresAt: new Date(Date.now()+600000).toISOString(),
  upload: { url: 'https://api.cloudinary.com/v1_1/test-cloud/video/upload', fields: { public_id: 'random-id', overwrite: 'false', signature: 'signature', api_key: 'key', timestamp: '123', upload_preset: 'signed' } } };
let calls: Array<{ path: string; body: Record<string, unknown> }>;
let provider: RequestInit[];
let finalizeFailure: unknown;
const previousAdapter = api.defaults.adapter;
beforeEach(() => {
  calls = []; provider = []; finalizeFailure = undefined;
  setApiAccessToken('private-jwt');
  sessionStorage.setItem('vietverse_parent_gate_token','private-gate');
  api.defaults.adapter = async config => {
    calls.push({ path: config.url!, body: JSON.parse(config.data) });
    if (config.url === '/recordings/finalize' && finalizeFailure) {
      const error = finalizeFailure; finalizeFailure = undefined; throw error;
    }
    return { data: { data: config.url?.endsWith('upload-intent') ? intent : receipt }, status: 201, statusText: 'Created', headers: {}, config };
  };
  vi.stubGlobal('fetch', vi.fn(async (_url, config: RequestInit) => { provider.push(config); return { ok: true }; }));
});
afterEach(() => { api.defaults.adapter = previousAdapter; setApiAccessToken(null); sessionStorage.clear(); vi.unstubAllGlobals(); });
const make = (isCurrent = () => true, blob = new Blob(['voice'],{ type: 'audio/webm' })) => createDirectRecordingUpload(blob,{ childId: 'child', lessonId: 'lesson', activityId: 'voice', contentVersion: 3, durationSec: 1 },isCurrent);

describe('direct recording workflow', () => {
  it('only retries finalize after a saved upload, with no app credentials sent to Cloudinary', async () => {
    finalizeFailure = { response: { status: 503, data: { error: { code: 'DATABASE_UNAVAILABLE' } } } };
    const task = make();
    await expect(task.submit()).rejects.toBeDefined();
    expect(await task.submit()).toEqual(receipt);
    expect(provider).toHaveLength(1);
    expect(provider[0].credentials).toBe('omit');
    const headers = new Headers(provider[0].headers);
    expect(headers.has('Authorization')).toBe(false);
    expect(headers.has('X-Parent-Gate-Token')).toBe(false);
    expect(headers.has('Cookie')).toBe(false);
    const form = provider[0].body as FormData;
    expect(form.get('file')).toBeInstanceOf(Blob);
    expect([...form.keys()]).not.toContain('childId');
    expect(calls.map(c => c.path)).toEqual(['/recordings/upload-intent','/recordings/finalize','/recordings/finalize']);
    expect(calls[1].body).toEqual({ intentId: intent.intentId });
  });
  it('first checks finalize when the provider may have saved a file but the response was lost', async () => {
    vi.stubGlobal('fetch', vi.fn(async (_url, config: RequestInit) => { provider.push(config); throw new TypeError('network lost'); }));
    const task = make();
    await expect(task.submit()).rejects.toBeDefined();
    expect(await task.submit()).toEqual(receipt);
    expect(provider).toHaveLength(1);
    expect(calls.map(c => c.path)).toEqual(['/recordings/upload-intent','/recordings/finalize']);
  });
  it('uploads again only after an ambiguous upload is confirmed missing', async () => {
    let attempts = 0;
    vi.stubGlobal('fetch', vi.fn(async (_url, config: RequestInit) => { provider.push(config); if (++attempts===1) throw new TypeError('lost'); return { ok: true }; }));
    const task = make();
    await expect(task.submit()).rejects.toBeDefined();
    finalizeFailure = { response: { status: 404, data: { error: { code: 'UPLOAD_ASSET_NOT_FOUND' } } } };
    expect(await task.submit()).toEqual(receipt);
    expect(provider).toHaveLength(2);
    expect(calls.filter(c => c.path.endsWith('upload-intent'))).toHaveLength(1);
  });
  it.each(['NOT_FOUND','UPLOAD_INTENT_EXPIRED','DATABASE_UNAVAILABLE'])('does not bypass %s by reuploading or issuing a new intent', async code => {
    vi.stubGlobal('fetch', vi.fn(async (_url, config: RequestInit) => { provider.push(config); throw new TypeError('lost'); }));
    const task = make(); await expect(task.submit()).rejects.toBeDefined();
    finalizeFailure = { response: { status: 409, data: { error: { code } } } };
    await expect(task.submit()).rejects.toBeDefined();
    expect(provider).toHaveLength(1);
    expect(calls.filter(c => c.path.endsWith('upload-intent'))).toHaveLength(1);
  });
  it('rejects context changes while provider upload is pending without finalizing', async () => {
    let current = true, finish!: () => void;
    vi.stubGlobal('fetch', vi.fn((_url, config: RequestInit) => { provider.push(config); return new Promise(resolve => { finish = () => resolve({ ok: true }); }); }));
    const task = make(() => current);
    const pending = task.submit();
    await vi.waitFor(() => expect(provider).toHaveLength(1));
    current = false; finish();
    await expect(pending).rejects.toMatchObject({ code: 'RECORDING_CONTEXT_CHANGED' });
    expect(calls.map(c => c.path)).toEqual(['/recordings/upload-intent']);
  });
  it('guards dispatch too, so queued requests cannot run under a changed account', async () => {
    let current = true;
    const interceptor = api.interceptors.request.use(config => { current = false; return config; });
    try { await expect(make(() => current).submit()).rejects.toMatchObject({ code: 'RECORDING_CONTEXT_CHANGED' }); }
    finally { api.interceptors.request.eject(interceptor); }
    expect(calls).toHaveLength(0);
  });
  it('rejects oversize before creating permission and uses a new requestId for a different Blob/context', async () => {
    await expect(make(() => true,new Blob([new Uint8Array(5242881)], { type: 'audio/webm' })).submit()).rejects.toThrow('5 MiB');
    expect(calls).toHaveLength(0);
    await make().submit(); await make().submit();
    const ids = calls.filter(c => c.path.endsWith('upload-intent')).map(c => c.body.requestId);
    expect(ids[0]).not.toBe(ids[1]);
  });
  it.each(['http://api.cloudinary.com/v1_1/test/video/upload','https://attacker.test/upload','https://api.cloudinary.com/v1_1/test/image/upload'])('does not send audio to an unsafe destination %s', async url => {
    api.defaults.adapter = async config => ({ data: { data: { ...intent, upload: { ...intent.upload,url } } }, status:201,statusText:'Created',headers:{},config });
    await expect(make().submit()).rejects.toBeDefined();
    expect(provider).toHaveLength(0);
  });
});
