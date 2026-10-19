import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api, setApiAccessToken } from '../lib/api.js';
import { createDirectRecordingUpload } from '../lib/directRecordingUpload.js';

const receipt = { id: '123456789012345678901234', url: '/api/v1/recordings/123456789012345678901234/audio?t=tok', durationSec: 1 };
let calls: Array<{ path: string; form: FormData }>;
let nextFailure: unknown;
let responseBody: unknown;
const previousAdapter = api.defaults.adapter;
beforeEach(() => {
  calls = []; nextFailure = undefined; responseBody = { recording: receipt };
  setApiAccessToken('private-jwt');
  api.defaults.adapter = async config => {
    calls.push({ path: config.url!, form: config.data as FormData });
    if (nextFailure !== undefined) { const error = nextFailure; nextFailure = undefined; throw error; }
    return { data: { data: responseBody }, status: 201, statusText: 'Created', headers: {}, config };
  };
});
afterEach(() => { api.defaults.adapter = previousAdapter; setApiAccessToken(null); });
const make = (isCurrent = () => true, blob = new Blob(['voice'], { type: 'audio/webm' })) =>
  createDirectRecordingUpload(blob, { childId: 'child', lessonId: 'lesson', activityId: 'voice', contentVersion: 3, durationSec: 1 }, isCurrent);

describe('recording upload (single multipart call)', () => {
  it('uploads once to /recordings/upload with every required field', async () => {
    const result = await make().submit();
    expect(result).toMatchObject({ id: receipt.id });
    expect(calls.map(c => c.path)).toEqual(['/recordings/upload']);
    const form = calls[0].form;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('audio')).toBeInstanceOf(Blob);
    expect(form.get('childId')).toBe('child');
    expect(form.get('lessonId')).toBe('lesson');
    expect(form.get('activityId')).toBe('voice');
    expect(form.get('contentVersion')).toBe('3');
    // The old Cloudinary two-step must be gone entirely.
    expect(calls.some(c => /upload-intent|finalize/.test(c.path))).toBe(false);
  });
  it('accepts a bare receipt shape as well as { recording }', async () => {
    responseBody = receipt;
    expect(await make().submit()).toMatchObject({ id: receipt.id });
  });
  it('rejects a response without a valid recording id', async () => {
    responseBody = { recording: { url: '/x' } };
    await expect(make().submit()).rejects.toThrow('chưa xác nhận');
  });
  it('surfaces a network failure unchanged so the UI can show the offline message', async () => {
    nextFailure = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    await expect(make().submit()).rejects.toMatchObject({ code: 'ERR_NETWORK' });
    expect(calls.map(c => c.path)).toEqual(['/recordings/upload']);
  });
  it('surfaces a 503 AUDIO_STORAGE_UNAVAILABLE so the UI can map it', async () => {
    nextFailure = { response: { status: 503, data: { error: { code: 'AUDIO_STORAGE_UNAVAILABLE' } } } };
    await expect(make().submit()).rejects.toMatchObject({ response: { data: { error: { code: 'AUDIO_STORAGE_UNAVAILABLE' } } } });
  });
  it('keeps the blob and simply re-posts on the next submit after a failure', async () => {
    const task = make();
    nextFailure = Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    await expect(task.submit()).rejects.toBeDefined();
    expect(await task.submit()).toMatchObject({ id: receipt.id });
    expect(calls.map(c => c.path)).toEqual(['/recordings/upload', '/recordings/upload']);
    expect(calls[1].form.get('childId')).toBe('child');
  });
  it('caches a success and never re-uploads on a later submit', async () => {
    const task = make();
    expect(await task.submit()).toMatchObject({ id: receipt.id });
    expect(await task.submit()).toMatchObject({ id: receipt.id });
    expect(calls).toHaveLength(1);
  });
  it('shares one in-flight request for concurrent submits', async () => {
    const task = make();
    const [a, b] = await Promise.all([task.submit(), task.submit()]);
    expect(a).toBe(b);
    expect(calls).toHaveLength(1);
  });
  it('rejects an oversize recording before any request', async () => {
    await expect(make(() => true, new Blob([new Uint8Array(5242881)], { type: 'audio/webm' })).submit()).rejects.toThrow('5 MiB');
    expect(calls).toHaveLength(0);
  });
  it('guards dispatch so a queued request cannot run under a changed account', async () => {
    let current = true;
    const interceptor = api.interceptors.request.use(config => { current = false; return config; });
    try { await expect(make(() => current).submit()).rejects.toMatchObject({ code: 'RECORDING_CONTEXT_CHANGED' }); }
    finally { api.interceptors.request.eject(interceptor); }
    expect(calls).toHaveLength(0);
  });
  it('rejects a context change detected before the request is sent', async () => {
    await expect(make(() => false).submit()).rejects.toMatchObject({ code: 'RECORDING_CONTEXT_CHANGED' });
    expect(calls).toHaveLength(0);
  });
});
