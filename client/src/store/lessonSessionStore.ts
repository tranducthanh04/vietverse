import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';

export interface ActivityAnswer {
  activityId: string;
  isCorrect: boolean;
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
}

interface LessonSessionState {
  currentSession: CachedLessonSession | null;
  initSession: (lessonId: string, childId: string, contentVersion: number) => Promise<CachedLessonSession>;
  saveStepProgress: (stepIndex: number, answer?: ActivityAnswer) => Promise<void>;
  loseHeart: () => Promise<number>;
  clearSession: (lessonId: string, childId: string) => Promise<void>;
}

export const readCachedSession = (lessonId: string, childId: string) => get<CachedLessonSession>(`vietverse_session_${childId}_${lessonId}`);
let generation = 0;

export const useLessonSessionStore = create<LessonSessionState>((setStore, getStore) => ({
  currentSession: null,

  initSession: async (lessonId: string, childId: string, contentVersion: number) => {
    const request = ++generation;
    setStore({ currentSession: null });
    const key = `vietverse_session_${childId}_${lessonId}`;
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
    };

    await set(key, newSession);
    if (request === generation) setStore({ currentSession: newSession });
    return newSession;
  },

  saveStepProgress: async (stepIndex: number, answer?: ActivityAnswer) => {
    const { currentSession } = getStore();
    if (!currentSession) return;

    const updatedAnswers = answer
      ? [...currentSession.answers.filter((a) => a.activityId !== answer.activityId), answer]
      : currentSession.answers;

    const updatedSession: CachedLessonSession = {
      ...currentSession,
      currentStepIndex: stepIndex,
      answers: updatedAnswers,
    };

    const key = `vietverse_session_${currentSession.childId}_${currentSession.lessonId}`;
    await set(key, updatedSession);
    if (getStore().currentSession === currentSession) setStore({ currentSession: updatedSession });
  },

  loseHeart: async () => {
    const { currentSession } = getStore();
    if (!currentSession) return 0;

    const nextHearts = Math.max(0, currentSession.hearts - 1);
    const updatedSession = { ...currentSession, hearts: nextHearts };
    const key = `vietverse_session_${currentSession.childId}_${currentSession.lessonId}`;
    await set(key, updatedSession);
    if (getStore().currentSession === currentSession) setStore({ currentSession: updatedSession });
    return nextHearts;
  },

  clearSession: async (lessonId: string, childId: string) => {
    generation++;
    const key = `vietverse_session_${childId}_${lessonId}`;
    await del(key);
    const current = getStore().currentSession;
    if (current?.lessonId === lessonId && current.childId === childId) setStore({ currentSession: null });
  },
}));
