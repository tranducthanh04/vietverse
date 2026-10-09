import { create } from 'zustand';
import { api, setApiAccessToken } from '../lib/api.js';

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

  login: async (credentials) => {
    const res = await api.post('/auth/login', credentials);
    const { user, accessToken } = res.data.data;
    clearParentGate();
    setApiAccessToken(accessToken);
    set({ user, accessToken });
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, accessToken } = res.data.data;
    clearParentGate();
    setApiAccessToken(accessToken);
    set({ user, accessToken });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
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
      const res = await api.get('/auth/me');
      // A bootstrap restore is not a new login; keep the tab's signed gate on reload.
      const previousUser = get().user;
      if (previousUser && previousUser.id !== res.data.data.user.id) clearParentGate();
      set({
        user: res.data.data.user,
        subscription: res.data.data.subscription,
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
