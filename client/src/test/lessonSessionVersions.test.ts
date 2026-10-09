import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';
import { useLessonSessionStore, readCachedSession } from '../store/lessonSessionStore.js';
import { useAuthStore } from '../store/authStore.js';

const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock('idb-keyval', () => ({ get: vi.fn(async (key: string) => cache.get(key)), set: vi.fn(async (key: string, value: unknown) => { cache.set(key, value); }), del: vi.fn(async (key: string) => { cache.delete(key); }) }));
beforeEach(() => { cache.clear(); vi.clearAllMocks(); useLessonSessionStore.setState({ currentSession: null }); });
describe('pinned lesson sessions', () => {
  it('restores unsent input without inventing graded answers', async () => {
    const store = useLessonSessionStore.getState();
    await store.initSession('lesson', 'child', 2);
    await store.savePartialInput({ lessonId: 'lesson', childId: 'child', contentVersion: 2 }, 'multi', ['letter-2']);
    expect(await readCachedSession('lesson', 'child')).toMatchObject({ partialInputs: { multi: ['letter-2'] }, answers: [] });
    await store.initSession('lesson', 'child', 2);
    expect(useLessonSessionStore.getState().currentSession?.partialInputs?.multi).toEqual(['letter-2']);
  });
  it('serializes edits and submission so delayed writes cannot lose newest state', async () => {
    const store = useLessonSessionStore.getState();
    await store.initSession('lesson', 'child', 2);
    let release!: () => void;
    vi.mocked(set).mockImplementationOnce(async (key, value) => {
      await new Promise<void>(resolve => { release = resolve; });
      cache.set(key as string, value);
    });
    const identity = { lessonId: 'lesson', childId: 'child', contentVersion: 2 };
    const first = store.savePartialInput(identity, 'multi', ['letter-2']);
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    const second = store.savePartialInput(identity, 'multi', ['letter-2','letter-4']);
    const submit = store.saveStepProgress(1, { activityId: 'multi', userAnswer: ['letter-2','letter-4'] });
    release(); await Promise.all([first, second, submit]);
    expect(await readCachedSession('lesson', 'child')).toMatchObject({ currentStepIndex: 1, hearts: 3,
      answers: [{ activityId: 'multi', userAnswer: ['letter-2','letter-4'] }] });
    expect((await readCachedSession('lesson','child'))?.partialInputs?.multi).toBeUndefined();
  });
  it('clear waits for an in-flight write then deletes rather than resurrecting the cache', async () => {
    const store = useLessonSessionStore.getState();
    await store.initSession('lesson', 'child', 2);
    let release!: () => void;
    vi.mocked(set).mockImplementationOnce(async (key,value) => {
      await new Promise<void>(resolve => { release = resolve; }); cache.set(key as string,value);
    });
    const writing = store.savePartialInput({lessonId:'lesson',childId:'child',contentVersion:2},'m',['x']);
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    const clearing = store.clearSession('lesson','child');
    release(); await Promise.all([writing,clearing]);
    expect(await readCachedSession('lesson','child')).toBeUndefined();
    expect(useLessonSessionStore.getState().currentSession).toBeNull();
  });
  it('rejects foreign child/version writes and ignores an old queued edit after child switch', async () => {
    const store = useLessonSessionStore.getState();
    await store.initSession('lesson','child-a',2);
    await expect(store.savePartialInput({lessonId:'lesson',childId:'child-b',contentVersion:2},'m',['x'])).rejects.toThrow();
    await expect(store.savePartialInput({lessonId:'lesson',childId:'child-a',contentVersion:3},'m',['x'])).rejects.toThrow();
    const old = store.savePartialInput({lessonId:'lesson',childId:'child-a',contentVersion:2},'m',['x']);
    await store.initSession('lesson','child-b',2); await old;
    expect(useLessonSessionStore.getState().currentSession?.childId).toBe('child-b');
    expect((await readCachedSession('lesson','child-b'))?.partialInputs).toEqual({});
  });
  it('keeps current state recoverable when storage rejects a partial write', async () => {
    const store = useLessonSessionStore.getState(); await store.initSession('lesson','child',2);
    vi.mocked(set).mockRejectedValueOnce(new Error('quota'));
    await expect(store.savePartialInput({lessonId:'lesson',childId:'child',contentVersion:2},'m',['x'])).rejects.toThrow('quota');
    await store.savePartialInput({lessonId:'lesson',childId:'child',contentVersion:2},'m',['x','y']);
    expect((await readCachedSession('lesson','child'))?.partialInputs?.m).toEqual(['x','y']);
  });
  it('invalidates in-memory answers when the account changes during a write', async () => {
    useAuthStore.setState({ user:{id:'first',email:'',displayName:'',role:'parent'} });
    const store=useLessonSessionStore.getState(); await store.initSession('lesson','child',2);
    let release!:()=>void;
    vi.mocked(set).mockImplementationOnce(async(key,value)=>{
      await new Promise<void>(resolve=>{release=resolve;}); cache.set(key as string,value);
    });
    const pending=store.savePartialInput({lessonId:'lesson',childId:'child',contentVersion:2},'m',['x']);
    await vi.waitFor(()=>expect(release).toBeTypeOf('function'));
    useAuthStore.setState({user:{id:'second',email:'',displayName:'',role:'parent'}});
    release(); await pending;
    expect(useLessonSessionStore.getState().currentSession).toBeNull();
    await store.initSession('lesson','other-child',2);
    expect(useLessonSessionStore.getState().currentSession?.partialInputs).toEqual({});
  });
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
