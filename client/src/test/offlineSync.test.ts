import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncOfflineCompletions, readOfflineCompletions, enqueueOfflineCompletion } from '../lib/offlineSync.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

vi.mock('../lib/api.js', () => ({
  api: {
    post: vi.fn(),
  },
  setApiAccessToken: vi.fn(),
}));

describe('Offline Completion Queue Sync Worker', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: 'parent', email: '', displayName: '', role: 'parent' }, isLoading: false });
  });

  it('returns 0 synced when queue is empty', async () => {
    const res = await syncOfflineCompletions();
    expect(res.syncedCount).toBe(0);
    expect(res.errors).toBe(0);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('successfully synchronizes queued offline lesson completion to server', async () => {
    const queue = [
      {
        lessonId: 'lesson-123',
        id: 'one', userId: 'parent', contentVersion: 0,
        childId: 'child-456',
        answers: [{ activityId: 'act-1', isCorrect: true }],
        savedAt: Date.now(),
      },
    ];
    localStorage.setItem('vietverse_offline_completions', JSON.stringify(queue));

    (api.post as any).mockResolvedValueOnce({
      data: { success: true, data: { stars: 3, pointsEarned: 10, totalPoints: 100 } },
    });

    const res = await syncOfflineCompletions();
    expect(res.syncedCount).toBe(1);
    expect(res.errors).toBe(0);
    expect(api.post).toHaveBeenCalledWith('/lessons/lesson-123/complete', {
      childId: 'child-456',
      answers: queue[0].answers,
      contentVersion: 0,
    });
    // Queue should be cleared after successful sync
    expect(localStorage.getItem('vietverse_offline_completions')).toBeNull();
  });

  it('retains queued item in localStorage when network call fails', async () => {
    const queue = [
      {
        lessonId: 'lesson-123',
        id: 'one', userId: 'parent', contentVersion: 0,
        childId: 'child-456',
        answers: [{ activityId: 'act-1', isCorrect: true }],
        savedAt: Date.now(),
      },
    ];
    localStorage.setItem('vietverse_offline_completions', JSON.stringify(queue));

    (api.post as any).mockRejectedValueOnce({
      code: 'ERR_NETWORK',
    });

    const res = await syncOfflineCompletions();
    expect(res.syncedCount).toBe(0);
    expect(res.errors).toBe(1);
    // Queue must remain in storage for next retry
    const remaining = JSON.parse(localStorage.getItem('vietverse_offline_completions') || '[]');
    expect(remaining.length).toBe(1);
  });
});

const key = 'vietverse_offline_completions';
const item = (id: string) => ({ id, userId: 'parent', childId: 'child', lessonId: id, contentVersion: 0, answers: [{ activityId: 'a', userAnswer: 'b' }], savedAt: 1, status: 'pending' as const });
describe('lossless offline submissions', () => {
  beforeEach(() => {
    localStorage.clear(); vi.resetAllMocks();
    useAuthStore.setState({ user: { id: 'parent', email: '', role: 'parent', displayName: 'Parent' }, isLoading: false });
  });
  it('keeps the failed item and all unprocessed tail on network loss', async () => {
    localStorage.setItem(key, JSON.stringify(['one', 'two', 'three'].map(item)));
    vi.mocked(api.post).mockRejectedValueOnce({ code: 'ERR_NETWORK' });
    const result = await syncOfflineCompletions();
    expect(readOfflineCompletions().map(i => i.id)).toEqual(['one', 'two', 'three']);
    expect(result).toEqual({ syncedCount: 0, errors: 1 });
  });
  it.each([400, 403, 404, 409])('retains a %s item for attention and continues independent submissions', async status => {
    localStorage.setItem(key, JSON.stringify(['one', 'two'].map(item)));
    vi.mocked(api.post).mockRejectedValueOnce({ response: { status, data: { error: { code: 'CONTENT_CONFLICT' } } } }).mockResolvedValueOnce({ data: {} });
    expect(await syncOfflineCompletions()).toEqual({ syncedCount: 1, errors: 1 });
    expect(readOfflineCompletions()).toEqual([expect.objectContaining({ id: 'one', status: 'needs_attention', answers: item('one').answers })]);
    await syncOfflineCompletions();
    expect(api.post).toHaveBeenCalledTimes(2);
  });
  it('sends the pinned version and does not remove items appended during the request', async () => {
    localStorage.setItem(key, JSON.stringify([item('one')]));
    vi.mocked(api.post).mockImplementationOnce(async (_url, body) => { expect(body).toMatchObject({ contentVersion: 0 }); enqueueOfflineCompletion(item('two')); return { data: {} }; });
    await syncOfflineCompletions();
    expect(readOfflineCompletions().map(i => i.id)).toEqual(['two']);
  });
  it('does not send another account queue or anything before auth is ready', async () => {
    localStorage.setItem(key, JSON.stringify([item('one')]));
    useAuthStore.setState({ user: null });
    await syncOfflineCompletions(); expect(api.post).not.toHaveBeenCalled();
    useAuthStore.setState({ user: { id: 'other', email: '', displayName: '', role: 'parent' } });
    await syncOfflineCompletions(); expect(api.post).not.toHaveBeenCalled();
    expect(readOfflineCompletions()).toHaveLength(1);
  });
  it('stops after an auth change during sync without sending the tail under a different account', async () => {
    localStorage.setItem(key, JSON.stringify(['one', 'two'].map(item)));
    vi.mocked(api.post).mockImplementationOnce(async () => { useAuthStore.setState({ user: null }); return { data: {} }; });
    await syncOfflineCompletions();
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(readOfflineCompletions().some(i => i.id === 'two')).toBe(true);
  });
  it('keeps malformed stored JSON and reports an error instead of deleting it', async () => {
    localStorage.setItem(key, '{broken');
    expect((await syncOfflineCompletions()).errors).toBe(1);
    expect(localStorage.getItem(key)).toBe('{broken');
    localStorage.setItem(key, JSON.stringify([item('one')]));
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
    expect((await syncOfflineCompletions()).syncedCount).toBe(1);
  });
});
