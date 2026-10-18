import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RecordVoiceActivity } from '../features/lesson-player/activities/RecordVoiceActivity.js';

const recorder = vi.hoisted(() => ({ isRecording: false, isPlaying: false, startRecording: vi.fn(), stopRecording: vi.fn(), durationSec: 0 }));
vi.mock('../lib/audioRecorder.js', () => ({ useAudioRecorder: () => recorder }));
beforeEach(() => {
  recorder.isRecording = false;
  recorder.startRecording.mockReset();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

it('resets a pending microphone start on context change and ignores the old completion', async () => {
  let resolveOld!: () => void;
  let resolveNew!: () => void;
  recorder.startRecording
    .mockImplementationOnce(() => new Promise<void>(resolve => { resolveOld = resolve; }))
    .mockImplementationOnce(() => new Promise<void>(resolve => { resolveNew = resolve; }));
  const activity = { id: 'voice', prompt: 'Doc lai', targetWord: 'Me', audioUrl: '/audio/me.mp3' };
  const view = render(<RecordVoiceActivity activity={activity} childId="child" lessonId="old" onComplete={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
  expect(screen.getByRole('button', { name: 'Bắt đầu ghi âm' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Nghe mẫu' })).not.toBeInTheDocument();

  view.rerender(<RecordVoiceActivity activity={activity} childId="child" lessonId="new" onComplete={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Bắt đầu ghi âm' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Nghe mẫu' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu ghi âm' }));
  await act(async () => { resolveOld(); });
  expect(screen.getByRole('button', { name: 'Bắt đầu ghi âm' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Nghe mẫu' })).not.toBeInTheDocument();
  await act(async () => { resolveNew(); });
  expect(screen.getByRole('button', { name: 'Bắt đầu ghi âm' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Nghe mẫu' })).toBeInTheDocument();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('shows the spoken guidance and plays model audio without completing the activity', async () => {
  const complete = vi.fn();
  const activity = { id: 'voice', prompt: 'Doc cung be', targetWord: 'Me', subPrompt: 'Nghe va doc lai tu mau.', audioUrl: '/audio/me.mp3' };
  const view = render(<RecordVoiceActivity activity={activity} childId="child" lessonId="lesson" onComplete={complete} />);
  expect(screen.getByText('Nghe va doc lai tu mau.')).toBeInTheDocument();
  const sample = screen.getByRole('button', { name: 'Nghe mẫu' });
  expect(view.container.querySelector('audio')).toHaveAttribute('src', '/audio/me.mp3');
  fireEvent.click(sample);
  await waitFor(() => expect(sample).toHaveAttribute('aria-pressed', 'true'));
  expect(complete).not.toHaveBeenCalled();
  recorder.isRecording = true;
  view.rerender(<RecordVoiceActivity activity={activity} childId="child" lessonId="lesson" onComplete={complete} />);
  expect(view.container.querySelector('audio')).toBeNull();
});

it('reads the target with labelled device speech when no source asset exists', () => {
  const spoken: string[] = [];
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  vi.stubGlobal('speechSynthesis', { getVoices: () => [{ lang: 'vi-VN' }], speak: (value: SpeechSynthesisUtterance) => spoken.push(value.text), cancel: vi.fn() });
  const complete = vi.fn();
  render(<RecordVoiceActivity activity={{ id: 'voice', prompt: 'Doc lai', targetWord: 'Me' }} childId="child" lessonId="lesson" onComplete={complete} />);
  expect(screen.getByText(/Giọng đọc thiết bị/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Nghe mẫu' }));
  expect(spoken).toEqual(['Me']);
  expect(complete).not.toHaveBeenCalled();
});
