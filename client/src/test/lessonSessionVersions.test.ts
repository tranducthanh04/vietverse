import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';
import { useLessonSessionStore, readCachedSession } from '../store/lessonSessionStore.js';

const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock('idb-keyval', () => ({ get: vi.fn(async (key: string) => cache.get(key)), set: vi.fn(async (key: string, value: unknown) => { cache.set(key, value); }), del: vi.fn(async (key: string) => { cache.delete(key); }) }));
beforeEach(() => { cache.clear(); vi.clearAllMocks(); useLessonSessionStore.setState({ currentSession: null }); });
describe('pinned lesson sessions', () => {
  it('persists the opened version and never upgrades a cached session silently', async () => {
    const store = useLessonSessionStore.getState();
    await store.initSession('lesson', 'child', 0);
    await store.saveStepProgress(1, { activityId: 'a', isCorrect: true, userAnswer: 'answer' });
    const restored = await store.initSession('lesson', 'child', 2);
    expect(restored.contentVersion).toBe(0);
    expect(restored.answers).toHaveLength(1);
    expect((await readCachedSession('lesson', 'child'))?.contentVersion).toBe(0);
  });
  it('preserves a legacy session without assigning the current live version', async () => {
    await set('vietverse_session_child_lesson', { lessonId: 'lesson', childId: 'child', answers: [{ activityId: 'old' }], currentStepIndex: 1, hearts: 2, startTime: 1 });
    const session = await useLessonSessionStore.getState().initSession('lesson', 'child', 3);
    expect(session.contentVersion).toBeUndefined(); expect(session.answers[0].activityId).toBe('old');
  });
  it('ignores late IndexedDB reads after switching children', async () => {
    let resolve!: (value: undefined) => void;
    vi.mocked(get).mockImplementationOnce(() => new Promise(r => { resolve = r; }));
    const first = useLessonSessionStore.getState().initSession('lesson', 'child-a', 0);
    await useLessonSessionStore.getState().initSession('lesson', 'child-b', 1);
    resolve(undefined); await first;
    expect(useLessonSessionStore.getState().currentSession?.childId).toBe('child-b');
  });
});
