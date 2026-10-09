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
  it('stops at 180 seconds and closes microphone tracks', async () => {
    vi.useFakeTimers();
    const hook = renderHook(useAudioRecorder);
    await act(async () => hook.result.current.startRecording());
    act(() => vi.advanceTimersByTime(181000));
    expect(hook.result.current.isRecording).toBe(false);
    expect(hook.result.current.durationSec).toBe(180);
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
