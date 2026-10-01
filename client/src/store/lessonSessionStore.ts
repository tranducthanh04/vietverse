import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';

export interface ActivityAnswer {
  activityId: string;
  isCorrect: boolean;
  userAnswer?: any;
}

export interface CachedLessonSession {
  lessonId: string;
  childId: string;
  currentStepIndex: number;
  answers: ActivityAnswer[];
  hearts: number;
  startTime: number;
}

interface LessonSessionState {
  currentSession: CachedLessonSession | null;
  initSession: (lessonId: string, childId: string) => Promise<CachedLessonSession>;
  saveStepProgress: (stepIndex: number, answer?: ActivityAnswer) => Promise<void>;
  loseHeart: () => Promise<number>;
  clearSession: (lessonId: string, childId: string) => Promise<void>;
}

export const useLessonSessionStore = create<LessonSessionState>((setStore, getStore) => ({
  currentSession: null,

  initSession: async (lessonId: string, childId: string) => {
    const key = `vietverse_session_${childId}_${lessonId}`;
    const cached = await get<CachedLessonSession>(key);

    if (cached) {
      setStore({ currentSession: cached });
      return cached;
    }

    const newSession: CachedLessonSession = {
      lessonId,
      childId,
      currentStepIndex: 0,
      answers: [],
      hearts: 3,
      startTime: Date.now(),
    };

    await set(key, newSession);
    setStore({ currentSession: newSession });
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
    setStore({ currentSession: updatedSession });
  },

  loseHeart: async () => {
    const { currentSession } = getStore();
    if (!currentSession) return 0;

    const nextHearts = Math.max(0, currentSession.hearts - 1);
    const updatedSession = { ...currentSession, hearts: nextHearts };
    const key = `vietverse_session_${currentSession.childId}_${currentSession.lessonId}`;
    await set(key, updatedSession);
    setStore({ currentSession: updatedSession });
    return nextHearts;
  },

  clearSession: async (lessonId: string, childId: string) => {
    const key = `vietverse_session_${childId}_${lessonId}`;
    await del(key);
    setStore({ currentSession: null });
  },
}));
