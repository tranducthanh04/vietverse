import { create } from 'zustand';
import { api } from '../lib/api.js';
import { useAuthStore } from './authStore.js';

let fetchRequestId = 0;
let selectionVersion = 0;

export interface ChildProfile {
  _id: string;
  parentId: string;
  name: string;
  ageGroup: '5-6' | '6-8';
  companionLanguage: 'en' | 'ja' | 'ko' | 'zh' | 'fr' | 'other';
  avatarId: string;
  viviPoints: number;
  currentStageId?: any;
  level: number;
  badges: string[];
  ownedItemIds?: string[];
  /** Avatar bought in the shop; displayed instead of the onboarding `avatarId` when set. */
  equippedAvatarItemId?: string | null;
  profileDecorationId?: string | null;
  screenTimeLimit: number;
}

interface ChildState {
  children: ChildProfile[];
  activeChild: ChildProfile | null;
  isLoading: boolean;
  fetchChildren: () => Promise<ChildProfile[]>;
  selectChild: (childId: string) => Promise<void>;
  setActiveChild: (child: ChildProfile | null) => void;
  createChild: (data: {
    name: string;
    ageGroup: '5-6' | '6-8';
    companionLanguage: string;
    avatarId?: string;
  }) => Promise<ChildProfile>;
  updatePointsLocally: (newPoints: number) => void;
}

export const useChildStore = create<ChildState>((set, get) => ({
  children: [],
  activeChild: null,
  isLoading: false,

  setActiveChild: (child) => {
    selectionVersion++;
    set({ activeChild: child });
  },

  fetchChildren: async () => {
    const requestId = ++fetchRequestId;
    const selectionAtStart = selectionVersion;
    try {
      set({ isLoading: true });
      const res = await api.get('/children');
      const list = res.data.data;
      if (requestId !== fetchRequestId) return list;
      set({ children: list });

      // A newer selection/create operation owns the active profile, not this older response.
      if (selectionVersion === selectionAtStart) {
        const currentId = get().activeChild?._id;
        const updated = list.find((profile: ChildProfile) => profile._id === currentId);
        set({ activeChild: updated || list[0] || null });
      }

      return list;
    } finally {
      if (requestId === fetchRequestId) set({ isLoading: false });
    }
  },

  selectChild: async (childId: string) => {
    const selectionId = ++selectionVersion;
    const res = await api.patch(`/children/${childId}/select`);
    if (selectionId === selectionVersion) set({ activeChild: res.data.data });
  },

  createChild: async (data) => {
    const ownerId = useAuthStore.getState().user?.id;
    const res = await api.post('/children', data);
    const newChild = res.data.data;
    if (ownerId !== useAuthStore.getState().user?.id) return newChild;
    selectionVersion++;
    set((state) => ({
      children: [...state.children, newChild],
      activeChild: newChild,
    }));
    return newChild;
  },

  updatePointsLocally: (newPoints: number) => {
    set((state) => {
      if (!state.activeChild) return state;
      const updatedChild = { ...state.activeChild, viviPoints: newPoints };
      return {
        activeChild: updatedChild,
        children: state.children.map((c) => (c._id === updatedChild._id ? updatedChild : c)),
      };
    });
  },
}));

// Invalidate in-flight child requests as well as cached profiles when accounts change.
useAuthStore.subscribe((state, previous) => {
  if (state.user?.id === previous.user?.id) return;
  fetchRequestId++;
  selectionVersion++;
  useChildStore.setState({ children: [], activeChild: null, isLoading: false });
});
