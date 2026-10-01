import { create } from 'zustand';
import { api, setApiAccessToken } from '../lib/api.js';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'parent' | 'admin';
  parentGatePin?: string;
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

export const useAuthStore = create<AuthState>((set) => ({
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
    setApiAccessToken(accessToken);
    set({ user, accessToken });
  },

  register: async (data) => {
    const res = await api.post('/auth/register', data);
    const { user, accessToken } = res.data.data;
    setApiAccessToken(accessToken);
    set({ user, accessToken });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    } finally {
      setApiAccessToken(null);
      set({ user: null, subscription: null, accessToken: null });
    }
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/auth/me');
      set({
        user: res.data.data.user,
        subscription: res.data.data.subscription,
      });
    } catch (err) {
      setApiAccessToken(null);
      set({ user: null, subscription: null, accessToken: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
