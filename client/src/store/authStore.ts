import { create } from 'zustand';
import { api, authPost, clearSessionHint, getApiAccessToken, hasProbedLegacySession, hasSessionHint, markLegacySessionProbed, refreshSession, setApiAccessToken } from '../lib/api.js';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'parent' | 'admin';
}

export interface Subscription {
  plan: 'free' | 'monthly' | 'yearly';
  maxChildren: number;
}

interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setAccessToken: (token: string | null) => void;
  acceptSession: (data: { user: User; accessToken: string }) => void;
}

function clearParentGate() {
  sessionStorage.removeItem('vietverse_parent_gate_token');
  sessionStorage.removeItem('vietverse_parent_gate_unlocked');
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  subscription: null,
  accessToken: null,
  isLoading: true,

  setAccessToken: (token) => {
    setApiAccessToken(token);
    set({ accessToken: token });
  },

  acceptSession: ({ user, accessToken }) => {
    clearParentGate();
    setApiAccessToken(accessToken);
    set({ user, accessToken, subscription: null });
  },

  login: async (credentials) => {
    const res = await authPost('/auth/login', credentials);
    const { user, accessToken } = res.data.data;
    clearParentGate();
    setApiAccessToken(accessToken);
    set({ user, accessToken });
  },

  register: async (data) => {
    const res = await authPost('/auth/register', data);
    const { user, accessToken } = res.data.data;
    clearParentGate();
    setApiAccessToken(accessToken);
    set({ user, accessToken });
  },

  logout: async () => {
    try {
      await authPost('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      clearParentGate();
      clearSessionHint();
      setApiAccessToken(null);
      set({ user: null, subscription: null, accessToken: null });
    }
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const token = getApiAccessToken();
      // A guest who has never signed in has no session hint: skip the refresh call so the browser
      // does not log a 401 on every public page. The httpOnly cookie is unreadable, so the hint is
      // the only signal that a session may exist — except for sessions issued before the hint
      // existed, which get one probe per browser so returning users are not signed out.
      // The probe is only spent on a definitive answer (below), so a network blip retries next load.
      if (!token && !hasSessionHint() && hasProbedLegacySession()) {
        clearParentGate();
        setApiAccessToken(null);
        set({ user: null, subscription: null, accessToken: null });
        return;
      }
      // Reload has no in-memory token: one refresh call restores token, user and subscription.
      // With a token in memory (in-app re-check), /auth/me is enough.
      const session: { user: User; subscription: Subscription; accessToken?: string } = token
        ? (await api.get('/auth/me')).data.data
        : await refreshSession<User, Subscription>();
      if (!session?.user?.id) throw new Error('Phiên đăng nhập không hợp lệ');
      // A bootstrap restore is not a new login; keep the tab's signed gate on reload.
      const previousUser = get().user;
      if (previousUser && previousUser.id !== session.user.id) clearParentGate();
      markLegacySessionProbed();
      set({
        user: session.user,
        subscription: session.subscription,
        ...(session.accessToken ? { accessToken: session.accessToken } : {}),
      });
    } catch (err) {
      // Only a definitive auth rejection means the session is truly gone: drop the hint so the next
      // load stays quiet. A transient/network error keeps the hint so a logged-in user still recovers
      // on the next reload once connectivity returns.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        clearSessionHint();
        markLegacySessionProbed();
      }
      clearParentGate();
      setApiAccessToken(null);
      set({ user: null, subscription: null, accessToken: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
