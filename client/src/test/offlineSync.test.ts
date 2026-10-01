import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncOfflineCompletions } from '../lib/offlineSync.js';
import { api } from '../lib/api.js';

vi.mock('../lib/api.js', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('Offline Completion Queue Sync Worker', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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
    });
    // Queue should be cleared after successful sync
    expect(localStorage.getItem('vietverse_offline_completions')).toBeNull();
  });

  it('retains queued item in localStorage when network call fails', async () => {
    const queue = [
      {
        lessonId: 'lesson-123',
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
