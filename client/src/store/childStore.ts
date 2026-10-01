import { create } from 'zustand';
import { api } from '../lib/api.js';

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

  setActiveChild: (child) => set({ activeChild: child }),

  fetchChildren: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/children');
      const list = res.data.data;
      set({ children: list });

      // Automatically select active child if not selected or restore from local selection
      const currentActive = get().activeChild;
      if (!currentActive && list.length > 0) {
        set({ activeChild: list[0] });
      } else if (currentActive) {
        const updated = list.find((c: ChildProfile) => c._id === currentActive._id);
        if (updated) set({ activeChild: updated });
      }

      return list;
    } finally {
      set({ isLoading: false });
    }
  },

  selectChild: async (childId: string) => {
    const res = await api.patch(`/children/${childId}/select`);
    set({ activeChild: res.data.data });
  },

  createChild: async (data) => {
    const res = await api.post('/children', data);
    const newChild = res.data.data;
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
