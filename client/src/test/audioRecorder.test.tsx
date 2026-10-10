import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useAudioRecorder } from '../lib/audioRecorder.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { api } from '../lib/api.js';

let tracksStopped: number, recorder: FakeRecorder;
class FakeRecorder {
  static isTypeSupported() { return true; }
  state = 'inactive';
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  constructor() { recorder = this; }
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['voice'],{ type:'audio/webm' }) }); this.onstop?.(); }
}
const child = (id: string) => ({ _id: id, parentId: 'owner' } as ChildProfile);
beforeEach(() => {
  tracksStopped = 0;
  vi.stubGlobal('MediaRecorder',FakeRecorder);
  Object.defineProperty(navigator,'mediaDevices',{ configurable:true,value:{ getUserMedia:vi.fn(async () => ({ getTracks:() => [{ stop:() => tracksStopped++ }] })) } });
  URL.createObjectURL = vi.fn(() => 'blob:test'); URL.revokeObjectURL = vi.fn();
  useAuthStore.setState({ user: { id:'owner',email:'owner@example.test',displayName:'Owner',role:'parent' } });
  useChildStore.setState({ activeChild:child('child') });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
async function record(hook: { result: { current: ReturnType<typeof useAudioRecorder> } }) {
  await act(async () => hook.result.current.startRecording());
  act(() => hook.result.current.stopRecording());
}
describe('recorder lifecycle', () => {
  it('retains the same Blob for explicit expired-intent resend through the real hook', async () => {
    vi.stubEnv('VITE_DIRECT_RECORDING_UPLOAD','true');
    const previousAdapter = api.defaults.adapter;
    let expired = true;
    const requests: string[] = [], files: Blob[] = [];
    api.defaults.adapter = async config => {
      if (config.url?.endsWith('upload-intent')) {
        requests.push(JSON.parse(config.data).requestId);
        return { data: { data: { intentId:'abcdefabcdefabcdefabcdef', expiresAt:'2030-01-01', upload:{ url:'https://api.cloudinary.com/v1_1/test/video/upload', fields:{ public_id:'id',timestamp:'123',overwrite:'false',upload_preset:'signed',api_key:'key',signature:'sig' } } } },status:201,statusText:'Created',headers:{},config };
      }
      if (expired) throw { response:{ data:{ error:{ code:'UPLOAD_INTENT_EXPIRED' } } } };
      return { data:{ data:{ id:'123456789012345678901234' } },status:201,statusText:'Created',headers:{},config };
    };
    vi.stubGlobal('fetch',vi.fn(async (_url,config: RequestInit) => { files.push((config.body as FormData).get('file') as Blob); return { ok:true }; }));
    try {
      const hook = renderHook(useAudioRecorder); await record(hook);
      const retained = hook.result.current.audioBlob;
      await expect(hook.result.current.uploadRecording({ childId:'child' })).rejects.toBeDefined();
      act(() => hook.result.current.restartExpiredUpload());
      expired = false;
      await expect(hook.result.current.uploadRecording({ childId:'child' })).resolves.toMatchObject({ id:'123456789012345678901234' });
      expect(hook.result.current.audioBlob).toBe(retained);
      expect(requests[0]).not.toBe(requests[1]);
      expect(files.map(file => file.size)).toEqual([5,5]);
    } finally { api.defaults.adapter = previousAdapter; }
  });
  it('reports overshoot instead of pretending a blocked main thread produced a valid take', async () => {
    let elapsed = 0, tick!: () => void;
    vi.spyOn(performance,'now').mockImplementation(() => elapsed);
    vi.spyOn(globalThis,'setInterval').mockImplementation(((callback: () => void) => { tick = callback; return 123; }) as never);
    const hook = renderHook(useAudioRecorder);
    await act(async () => hook.result.current.startRecording());
    elapsed = 185000;
    act(() => tick());
    expect(hook.result.current.durationSec).toBe(185);
    expect(hook.result.current.errorMessage).toContain('vượt 180 giây');
    expect(hook.result.current.audioBlob).toBeInstanceOf(Blob);
  });
  it('measures elapsed time instead of callback count when timers are delayed', async () => {
    let elapsed = 0, tick!: () => void;
    vi.spyOn(performance, 'now').mockImplementation(() => elapsed);
    vi.spyOn(globalThis, 'setInterval').mockImplementation(((callback: () => void) => { tick = callback; return 123; }) as never);
    const hook = renderHook(useAudioRecorder);
    await act(async () => hook.result.current.startRecording());
    elapsed = 90000;
    act(() => tick());
    expect(hook.result.current.durationSec).toBe(90);
    elapsed = 179000;
    act(() => tick());
    expect(hook.result.current.isRecording).toBe(false);
    expect(hook.result.current.audioBlob).toBeInstanceOf(Blob);
    expect(tracksStopped).toBe(1);
  });
  it('stops and retains audio when the recording page becomes hidden', async () => {
    const hook = renderHook(useAudioRecorder);
    await act(async () => hook.result.current.startRecording());
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(hook.result.current.isRecording).toBe(false);
    expect(hook.result.current.audioBlob).toBeInstanceOf(Blob);
    expect(tracksStopped).toBe(1);
  });
  it('stops with a one-second safety margin and closes microphone tracks', async () => {
    vi.useFakeTimers({ toFake: ['setInterval','clearInterval','setTimeout','clearTimeout','performance'] });
    const hook = renderHook(useAudioRecorder);
    await act(async () => hook.result.current.startRecording());
    act(() => vi.advanceTimersByTime(181000));
    expect(hook.result.current.isRecording).toBe(false);
    expect(hook.result.current.durationSec).toBe(179);
    expect(hook.result.current.audioBlob).toBeInstanceOf(Blob);
    expect(tracksStopped).toBe(1);
  });
  it('closes microphone tracks on unmount', async () => {
    const hook = renderHook(useAudioRecorder);
    await act(async () => hook.result.current.startRecording());
    hook.unmount();
    expect(recorder.state).toBe('inactive');
    expect(tracksStopped).toBe(1);
  });
  it('does not reuse a Blob when the lesson/activity/version session changes', async () => {
    const hook = renderHook(({ sessionKey }) => useAudioRecorder(sessionKey), { initialProps: { sessionKey:'lesson:voice:0' } });
    await record(hook);
    expect(hook.result.current.audioBlob).toBeInstanceOf(Blob);
    hook.rerender({ sessionKey:'lesson:other:1' });
    expect(hook.result.current.audioBlob).toBeNull();
  });
  it.each(['child','account'])('invalidates old audio when the %s changes, even if it changes back', async kind => {
    const hook = renderHook(useAudioRecorder); await record(hook);
    act(() => {
      if (kind==='child') { useChildStore.setState({ activeChild:child('other') }); useChildStore.setState({ activeChild:child('child') }); }
      else { useAuthStore.setState({ user:null }); useAuthStore.setState({ user:{ id:'owner',email:'owner@example.test',displayName:'Owner',role:'parent' } }); useChildStore.setState({ activeChild:child('child') }); }
    });
    const post = vi.spyOn(api,'post').mockResolvedValue({ data:{ data:{ id:'123456789012345678901234' } } });
    await expect(hook.result.current.uploadRecording({ childId:'child' })).rejects.toBeDefined();
    expect(post).not.toHaveBeenCalled();
  });
  it('does not invalidate audio on a same-user access token refresh, keeps the Blob after failure', async () => {
    const hook = renderHook(useAudioRecorder); await record(hook);
    const blob = hook.result.current.audioBlob;
    act(() => useAuthStore.setState({ accessToken:'refreshed' }));
    const post = vi.spyOn(api,'post').mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data:{ data:{ id:'123456789012345678901234' } } });
    await expect(hook.result.current.uploadRecording({ childId:'child' })).rejects.toThrow('offline');
    expect(hook.result.current.audioBlob).toBe(blob);
    expect((await hook.result.current.uploadRecording({ childId:'child' })).id).toBe('123456789012345678901234');
    expect(post).toHaveBeenCalledTimes(2);
  });
});
