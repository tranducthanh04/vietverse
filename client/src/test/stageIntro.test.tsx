import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestMapPage } from '../features/quest-map/QuestMapPage.js';
import {
  STAGE_INTRO_SCRIPTS,
  hasSeenStageIntro,
} from '../features/quest-map/stageIntroScripts.js';
import { claimPlayback } from '../hooks/useNarration.js';
import { vi as viDict, useUiLanguageStore } from '../i18n/index.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';

const child: ChildProfile = {
  _id: 'child-a', parentId: 'parent-a', name: 'An', ageGroup: '5-6',
  companionLanguage: 'en', companionLanguages: ['en'], avatarId: 'star',
  viviPoints: 0, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 0,
};
const parent = { id: 'parent-a', email: 'a@example.test', displayName: 'Parent', role: 'parent' as const };

const stage = {
  _id: 's1', order: 1, title: 'Chặng 1: Khởi hành', goal: 'Mục tiêu chặng 1',
  isUnlocked: true, isCompleted: false, requiresSubscription: false,
  totalLessons: 1, completedCount: 0,
  lessons: [{ _id: 'l1', order: 1, title: 'Bài 1', description: 'Bài học đầu tiên', isUnlocked: true, status: 'not_started', stars: 0 }],
};

const originalAdapter = api.defaults.adapter;
const initialAuth = useAuthStore.getState();
const initialChildren = useChildStore.getState();
const initialLanguage = useUiLanguageStore.getState();
let client: QueryClient;
let router: ReturnType<typeof createMemoryRouter>;
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ user: parent, isLoading: false });
  useChildStore.setState({ children: [child], activeChild: child, isLoading: false });
  useUiLanguageStore.setState({ manualLanguage: 'vi' });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  api.defaults.adapter = async config => {
    if (config.url !== '/stages') throw new Error(`Unexpected request: ${config.url}`);
    return { data: { data: [stage] }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

afterEach(() => {
  cleanup();
  router?.dispose();
  client.clear();
  api.defaults.adapter = originalAdapter;
  play.mockRestore();
  pause.mockRestore();
  useAuthStore.setState(initialAuth, true);
  useChildStore.setState(initialChildren, true);
  useUiLanguageStore.setState(initialLanguage, true);
});

async function show() {
  router = createMemoryRouter(
    [
      { path: '/kham-pha', element: <QuestMapPage /> },
      { path: '/hoc/:id', element: <div>TRANG BÀI HỌC</div> },
    ],
    { initialEntries: ['/kham-pha'] },
  );
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
  // Wait for the /stages query to resolve and the lesson card to render.
  await screen.findByText(viDict.map.startLesson);
}

describe('stage intro flow', () => {
  it('shows the intro before entering a lesson of an unseen stage, then enters on skip', async () => {
    await show();
    fireEvent.click(screen.getByText(viDict.map.startLesson));

    // The intro dialog appears and we have NOT navigated yet.
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText(STAGE_INTRO_SCRIPTS[0].vi)).toBeInTheDocument();
    expect(screen.queryByText('TRANG BÀI HỌC')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(viDict.stageIntro.skip));

    // Now we navigate into the lesson and remember that the stage intro was seen.
    expect(await screen.findByText('TRANG BÀI HỌC')).toBeInTheDocument();
    expect(hasSeenStageIntro('child-a', 1)).toBe(true);
  });

  it('enters the lesson directly when the stage intro was already seen', async () => {
    localStorage.setItem('vietverse_stage_intro_seen_v1', JSON.stringify({ 'child-a': [1] }));
    await show();
    fireEvent.click(screen.getByText(viDict.map.startLesson));

    expect(await screen.findByText('TRANG BÀI HỌC')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('still shows the intro and enters the lesson when localStorage throws', async () => {
    // Fail only the stage-intro key so the app's own storage (auth, language) keeps working;
    // the point is that a seen-flag read/write failure must never hide the intro or block entry.
    const SEEN_KEY = 'vietverse_stage_intro_seen_v1';
    const realGet = Storage.prototype.getItem;
    const realSet = Storage.prototype.setItem;
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key: string) {
      if (key === SEEN_KEY) throw new Error('blocked');
      return realGet.call(this, key);
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key === SEEN_KEY) throw new Error('blocked');
      return realSet.call(this, key, value);
    });
    try {
      await show();
      fireEvent.click(screen.getByText(viDict.map.startLesson));
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      fireEvent.click(screen.getByText(viDict.stageIntro.skip));
      expect(await screen.findByText('TRANG BÀI HỌC')).toBeInTheDocument();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });

  it('replays the greeting from the map without navigating', async () => {
    await show();
    fireEvent.click(screen.getByText(viDict.stageIntro.replay));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText(viDict.stageIntro.continue));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.queryByText('TRANG BÀI HỌC')).not.toBeInTheDocument();
  });

  it('claims the single playback slot on open and releases audio on close', async () => {
    const otherReaderStop = vi.fn();
    claimPlayback(otherReaderStop);
    await show();
    fireEvent.click(screen.getByText(viDict.map.startLesson));
    await screen.findByRole('dialog');

    // Opening the intro takes over playback from any other reader.
    expect(otherReaderStop).toHaveBeenCalledTimes(1);

    pause.mockClear();
    fireEvent.click(screen.getByText(viDict.stageIntro.skip));
    // Closing stops the clip.
    expect(pause).toHaveBeenCalled();
  });
});

describe('stage intro scripts data', () => {
  it('has a non-empty, concise line for every one of the five stages', () => {
    const orders = STAGE_INTRO_SCRIPTS.map(s => s.order);
    expect(orders).toEqual([1, 2, 3, 4, 5]);
    for (const script of STAGE_INTRO_SCRIPTS) {
      expect(script.vi.trim().length).toBeGreaterThan(0);
      const sentences = script.vi.split(/[.!?…]+/).map(s => s.trim()).filter(Boolean);
      expect(sentences.length).toBeGreaterThanOrEqual(2);
      expect(sentences.length).toBeLessThanOrEqual(4);
      const words = script.vi.trim().split(/\s+/);
      expect(words.length).toBeLessThanOrEqual(35);
    }
  });

  it('provides all five support-language translations for every stage', () => {
    for (const script of STAGE_INTRO_SCRIPTS) {
      for (const lang of ['en', 'ja', 'ko', 'zh', 'fr'] as const) {
        expect(script.translations[lang]?.trim().length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});
