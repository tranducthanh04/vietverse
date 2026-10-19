import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useAudioRecorder } from '../lib/audioRecorder.js';
import { claimPlayback, releasePlayback } from '../hooks/useNarration.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';

// Minimal MediaRecorder/mic stubs so startRecording -> stopRecording yields a Blob + object URL,
// matching the setup in audioRecorder.test.tsx. jsdom cannot decode audio, so we assert the
// playback *control flow* (play/pause and the single-reader handshake), not real sound.
class FakeRecorder {
  static isTypeSupported() { return true; }
  state = 'inactive';
  ondataavailable?: (event: { data: Blob }) => void;
  onstop?: () => void;
  start() { this.state = 'recording'; }
  stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) }); this.onstop?.(); }
}
const child = (id: string) => ({ _id: id, parentId: 'owner' } as ChildProfile);
let play: ReturnType<typeof vi.spyOn>, pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [{ stop: () => {} }] })) } });
  URL.createObjectURL = vi.fn(() => 'blob:test'); URL.revokeObjectURL = vi.fn();
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  useAuthStore.setState({ user: { id: 'owner', email: 'o@e.test', displayName: 'O', role: 'parent' } });
  useChildStore.setState({ activeChild: child('child') });
  // Clean single-reader slate between tests.
  const noop = () => {}; claimPlayback(noop); releasePlayback(noop);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function record(hook: { result: { current: ReturnType<typeof useAudioRecorder> } }) {
  await act(async () => hook.result.current.startRecording());
  act(() => hook.result.current.stopRecording());
}

describe('record_voice "Nghe lại" obeys the single-reader rule', () => {
  it('stops and resets isPlaying when another reader claims playback', async () => {
    const hook = renderHook(() => useAudioRecorder('k'));
    await record(hook);
    expect(hook.result.current.audioUrl).toBe('blob:test');

    act(() => hook.result.current.playRecording());
    expect(hook.result.current.isPlaying).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);

    pause.mockClear();
    // Narration (or any other reader) starts elsewhere and claims the single playback slot.
    act(() => claimPlayback(() => {}));

    expect(pause).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isPlaying).toBe(false);
  });

  it('stops the previously active reader when the child taps "Nghe lại"', async () => {
    const otherReaderStop = vi.fn();
    act(() => claimPlayback(otherReaderStop)); // e.g. a step's narration is currently playing

    const hook = renderHook(() => useAudioRecorder('k'));
    await record(hook);

    act(() => hook.result.current.playRecording());

    expect(otherReaderStop).toHaveBeenCalledTimes(1);
    expect(hook.result.current.isPlaying).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
  });
});
