import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { claimPlayback } from '../hooks/useNarration.js';
import { useChildStore } from '../store/childStore.js';
import { ParentRecordingsPage } from '../features/parent/ParentRecordingsPage.js';
import { ListenChooseActivity } from '../features/lesson-player/activities/ListenChooseActivity.js';
import { RecordVoiceActivity } from '../features/lesson-player/activities/RecordVoiceActivity.js';

const upload = vi.hoisted(() => vi.fn());
vi.mock('../lib/audioRecorder.js', () => ({ useAudioRecorder: () => ({ audioBlob: new Blob(['audio']), durationSec: 1, uploadRecording: upload, restartExpiredUpload: () => {}, clearRecording: () => {}, playRecording: () => {} }) }));

let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); upload.mockReset(); });

function showRecordings(failFirst = false) {
  useChildStore.setState({ activeChild: { _id: 'child-1' } as never });
  const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [
    { _id: 'rec-1', url: 'https://res.cloudinary.com/x/video/upload/one.webm', createdAt: '2026-10-13T00:00:00.000Z', wordOrPrompt: 'A' },
  ] } });
  if (failFirst) get.mockRejectedValueOnce(new Error('Network unavailable'));
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><ParentRecordingsPage /></QueryClientProvider>);
}

describe('parent recordings playback', () => {
  it('shows a load error instead of an empty archive and supports retry', async () => {
    showRecordings(true);
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/Bé chưa có bản thu âm nào/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại ngay' }));
    expect(await screen.findByRole('button', { name: 'Phát bản ghi âm' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('resets the play state when the browser rejects play()', async () => {
    play.mockRejectedValueOnce(new Error('NotAllowedError'));
    showRecordings();
    fireEvent.click(await screen.findByRole('button', { name: 'Phát bản ghi âm' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Phát bản ghi âm' })).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveTextContent(/Không phát được/);
    fireEvent.click(screen.getByRole('button', { name: 'Phát bản ghi âm' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
  it('stops audio on unmount and when another reader claims playback', async () => {
    const view = showRecordings();
    fireEvent.click(await screen.findByRole('button', { name: 'Phát bản ghi âm' }));
    expect(screen.getByRole('button', { name: 'Dừng' })).toBeInTheDocument();
    pause.mockClear();
    act(() => claimPlayback(() => {})); // e.g. narration starts elsewhere
    await waitFor(() => expect(screen.getByRole('button', { name: 'Phát bản ghi âm' })).toBeInTheDocument());
    expect(pause).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Phát bản ghi âm' }));
    pause.mockClear();
    view.unmount();
    expect(pause).toHaveBeenCalledTimes(1);
  });
});

describe('listen_choose without source audio', () => {
  const activity = { id: 'listen', prompt: 'Con gì kêu meo meo?', correctAnswer: 'a', options: [{ id: 'a', text: 'Mèo' }] };
  it('says there is no source audio instead of implying a listening clip', () => {
    render(<ListenChooseActivity activity={activity} onComplete={() => {}} />);
    expect(screen.getByText(/Chưa có audio nguồn/)).toBeInTheDocument();
  });
  it('shows no notice when the source audio exists', () => {
    render(<ListenChooseActivity activity={{ ...activity, audioUrl: '/audio/meo.mp3' }} onComplete={() => {}} />);
    expect(screen.queryByText(/Chưa có audio nguồn/)).not.toBeInTheDocument();
  });
});

describe('record voice timeouts', () => {
  it('leaves the spinner on a request timeout and offers retry and re-record', async () => {
    upload.mockRejectedValueOnce(Object.assign(new Error('timeout of 30000ms exceeded'), { code: 'ECONNABORTED' }))
      .mockResolvedValueOnce({ id: '123456789012345678901234' });
    const complete = vi.fn();
    render(<RecordVoiceActivity activity={{ id: 'voice', prompt: 'Say A' }} childId="child" lessonId="lesson" onComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gửi giọng đọc của bé' }));
    const retry = await screen.findByRole('button', { name: 'Thử gửi lại giọng đọc' });
    expect(screen.getByText(/Mạng chậm/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thu lại' })).not.toBeDisabled();
    fireEvent.click(retry);
    await waitFor(() => expect(complete).toHaveBeenCalledWith(true, '123456789012345678901234'));
  });
});
