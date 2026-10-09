import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RecordVoiceActivity } from '../features/lesson-player/activities/RecordVoiceActivity.js';
const upload = vi.hoisted(() => vi.fn());
vi.mock('../lib/audioRecorder.js', () => ({ useAudioRecorder: () => ({ audioBlob: new Blob(['audio']), durationSec: 1, uploadRecording: upload, clearRecording: () => {}, playRecording: () => {} }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('recording submission', () => {
  it('does not complete from a successful response that has no valid recording ID', async () => {
    upload.mockResolvedValue({ url: '/audio' });
    const complete = vi.fn();
    render(<RecordVoiceActivity activity={{ id: 'voice', prompt: 'Say A', targetWord: 'A' }} childId="child" lessonId="lesson" contentVersion={4} onComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gửi giọng đọc của bé' }));
    expect(await screen.findByRole('button', { name: 'Thử gửi lại giọng đọc' })).toBeInTheDocument();
    expect(complete).not.toHaveBeenCalled();
  });
  it('passes the pinned version and completes only with a real returned ID', async () => {
    upload.mockResolvedValue({ id: '123456789012345678901234' });
    const complete = vi.fn();
    render(<RecordVoiceActivity activity={{ id: 'voice', prompt: 'Say A' }} childId="child" lessonId="lesson" contentVersion={4} onComplete={complete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gửi giọng đọc của bé' }));
    await waitFor(() => expect(complete).toHaveBeenCalledWith(true, '123456789012345678901234'));
    expect(upload).toHaveBeenCalledWith(expect.objectContaining({ contentVersion: 4 }));
  });
  it('does not complete an unmounted activity from a late upload response', async () => {
    let finish!: (value: unknown) => void;
    upload.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const complete = vi.fn();
    const view = render(<RecordVoiceActivity activity={{ id:'voice',prompt:'A' }} childId="child" lessonId="lesson" onComplete={complete} />);
    fireEvent.click(screen.getByRole('button',{ name:'Gửi giọng đọc của bé' }));
    view.unmount();
    await act(async () => finish({ id:'123456789012345678901234' }));
    expect(complete).not.toHaveBeenCalled();
  });
  it('does not complete a different child/activity from an old response', async () => {
    let finish!: (value: unknown) => void;
    upload.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const complete = vi.fn();
    const view = render(<RecordVoiceActivity activity={{ id:'voice',prompt:'A' }} childId="child" lessonId="lesson" onComplete={complete} />);
    fireEvent.click(screen.getByRole('button',{ name:'Gửi giọng đọc của bé' }));
    view.rerender(<RecordVoiceActivity activity={{ id:'new',prompt:'B' }} childId="other" lessonId="lesson" onComplete={complete} />);
    await act(async () => finish({ id:'123456789012345678901234' }));
    expect(complete).not.toHaveBeenCalled();
  });
});
