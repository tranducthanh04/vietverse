import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';
import type { NewActivityInput } from '../features/lesson-player/activities/newActivity.types.js';
import { useAuthStore } from './authStore.js';

export interface ActivityAnswer {
  activityId: string;
  isCorrect?: boolean;
  userAnswer?: any;
}

export interface CachedLessonSession {
  contentVersion?: number;
  lessonId: string;
  childId: string;
  currentStepIndex: number;
  answers: ActivityAnswer[];
  hearts: number;
  startTime: number;
  partialInputs?: Record<string, NewActivityInput>;
}

interface LessonSessionState {
  currentSession: CachedLessonSession | null;
  initSession: (lessonId: string, childId: string, contentVersion: number) => Promise<CachedLessonSession>;
  saveStepProgress: (stepIndex: number, answer?: ActivityAnswer) => Promise<void>;
  loseHeart: () => Promise<number>;
  clearSession: (lessonId: string, childId: string) => Promise<void>;
  savePartialInput: (identity: { lessonId: string; childId: string; contentVersion: number }, activityId: string, value: NewActivityInput) => Promise<void>;
}

export const readCachedSession = (lessonId: string, childId: string) => get<CachedLessonSession>(`vietverse_session_${childId}_${lessonId}`);
let generation = 0;
const writes = new Map<string, Promise<void>>();
const sessionKey = (lessonId: string, childId: string) => `vietverse_session_${childId}_${lessonId}`;
function serialize(key: string, work: () => Promise<void>): Promise<void> {
  const next = (writes.get(key) ?? Promise.resolve()).catch(() => {}).then(work);
  writes.set(key, next);
  void next.finally(() => { if (writes.get(key) === next) writes.delete(key); }).catch(() => {});
  return next;
}

export const useLessonSessionStore = create<LessonSessionState>((setStore, getStore) => ({
  currentSession: null,

  initSession: async (lessonId: string, childId: string, contentVersion: number) => {
    const request = ++generation;
    setStore({ currentSession: null });
    const key = `vietverse_session_${childId}_${lessonId}`;
    await writes.get(key)?.catch(() => {});
    const cached = await get<CachedLessonSession>(key);

    if (cached) {
      if (request === generation) setStore({ currentSession: cached });
      return cached;
    }

    const newSession: CachedLessonSession = {
      lessonId,
      childId,
      contentVersion,
      currentStepIndex: 0,
      answers: [],
      hearts: 3,
      startTime: Date.now(),
      partialInputs: {},
    };

    if (request === generation) await serialize(key, async () => {
      if (request === generation) await set(key, newSession);
    });
    if (request === generation) setStore({ currentSession: newSession });
    return newSession;
  },

  saveStepProgress: async (stepIndex: number, answer?: ActivityAnswer) => {
    const { currentSession } = getStore();
    if (!currentSession) return;
    const request = generation;
    const key = sessionKey(currentSession.lessonId, currentSession.childId);
    await serialize(key, async () => {
      const latest = getStore().currentSession;
      if (!latest || request !== generation) return;
      const partialInputs = { ...latest.partialInputs };
      if (answer) delete partialInputs[answer.activityId];
      const updatedSession = { ...latest, currentStepIndex: stepIndex, partialInputs,
        answers: answer ? [...latest.answers.filter(a => a.activityId !== answer.activityId), answer] : latest.answers };
      await set(key, updatedSession);
      if (request === generation) setStore({ currentSession: updatedSession });
    });
  },

  savePartialInput: async (identity, activityId, value) => {
    const current = getStore().currentSession;
    if (!current || current.lessonId !== identity.lessonId || current.childId !== identity.childId || current.contentVersion !== identity.contentVersion) {
      throw new Error('Phiên học đã thay đổi');
    }
    const request = generation;
    const input = structuredClone(value);
    await serialize(sessionKey(identity.lessonId, identity.childId), async () => {
      const latest = getStore().currentSession;
      if (!latest || request !== generation) return;
      const updated = { ...latest, partialInputs: { ...latest.partialInputs, [activityId]: input } };
      await set(sessionKey(identity.lessonId, identity.childId), updated);
      if (request === generation) setStore({ currentSession: updated });
    });
  },

  loseHeart: async () => {
    const { currentSession } = getStore();
    if (!currentSession) return 0;

    const request = generation;
    let nextHearts = currentSession.hearts;
    await serialize(sessionKey(currentSession.lessonId, currentSession.childId), async () => {
      const latest = getStore().currentSession;
      if (!latest || request !== generation) return;
      nextHearts = Math.max(0, latest.hearts - 1);
      const updatedSession = { ...latest, hearts: nextHearts };
      await set(sessionKey(latest.lessonId, latest.childId), updatedSession);
      if (request === generation) setStore({ currentSession: updatedSession });
    });
    return nextHearts;
  },

  clearSession: async (lessonId: string, childId: string) => {
    const current = getStore().currentSession;
    if (current?.lessonId === lessonId && current.childId === childId) {
      generation++;
      setStore({ currentSession: null });
    }
    const key = sessionKey(lessonId, childId);
    await serialize(key, () => del(key));
  },
}));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) {
    generation++;
    useLessonSessionStore.setState({ currentSession: null });
  }
});
