import { create } from 'zustand';
import { api, authPost, getApiAccessToken, refreshSession, setApiAccessToken } from '../lib/api.js';

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
      setApiAccessToken(null);
      set({ user: null, subscription: null, accessToken: null });
    }
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      // Reload has no in-memory token: one refresh call restores token, user and subscription.
      // With a token in memory (in-app re-check), /auth/me is enough.
      const session: { user: User; subscription: Subscription; accessToken?: string } = getApiAccessToken()
        ? (await api.get('/auth/me')).data.data
        : await refreshSession<User, Subscription>();
      if (!session?.user?.id) throw new Error('Phiên đăng nhập không hợp lệ');
      // A bootstrap restore is not a new login; keep the tab's signed gate on reload.
      const previousUser = get().user;
      if (previousUser && previousUser.id !== session.user.id) clearParentGate();
      set({
        user: session.user,
        subscription: session.subscription,
        ...(session.accessToken ? { accessToken: session.accessToken } : {}),
      });
    } catch (err) {
      clearParentGate();
      setApiAccessToken(null);
      set({ user: null, subscription: null, accessToken: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
