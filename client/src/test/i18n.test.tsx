import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi as viDict } from '../i18n/vi.js';
import { en as enDict } from '../i18n/en.js';
import { createTranslator } from '../i18n/translator.js';
import { companionToUiLanguage, useUiLanguageStore } from '../i18n/uiLanguageStore.js';
import { PublicLayout } from '../app/layouts/PublicLayout.js';
import { KidsLayout } from '../app/layouts/KidsLayout.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';

const STORAGE_KEY = 'vietverse_ui_language';

const enChild: ChildProfile = {
  _id: 'child-en', parentId: 'parent', name: 'An', ageGroup: '5-6',
  companionLanguage: 'en', companionLanguages: ['en'], avatarId: 'star',
  viviPoints: 30, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 20,
};

let queryClient: QueryClient;

beforeEach(() => {
  localStorage.clear();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ user: { id: 'parent', email: 'p@example.test', displayName: 'Parent', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: null, children: [], isLoading: false });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
  localStorage.clear();
  // Reset to the suite-wide Vietnamese default so later files are unaffected.
  useUiLanguageStore.setState({ manualLanguage: 'vi' });
});

describe('i18n dictionaries', () => {
  it('provides an English string for every Vietnamese key (and no extras)', () => {
    for (const namespace of Object.keys(viDict) as Array<keyof typeof viDict>) {
      const viGroup = viDict[namespace] as Record<string, string>;
      const enGroup = enDict[namespace] as Record<string, string> | undefined;
      expect(enGroup, `en is missing namespace "${namespace}"`).toBeDefined();
      for (const key of Object.keys(viGroup)) {
        expect(typeof enGroup![key], `en is missing key "${namespace}.${key}"`).toBe('string');
      }
    }
    for (const namespace of Object.keys(enDict)) {
      expect(viDict, `en has an extra namespace "${namespace}"`).toHaveProperty(namespace);
    }
  });

  it('falls back to Vietnamese and then to the raw key for unknown lookups', () => {
    const t = createTranslator('en');
    expect(t('nav.login')).toBe(enDict.nav.login);
    // A key that does not exist resolves to the key itself rather than blank.
    expect(t('nav.doesNotExist' as never)).toBe('nav.doesNotExist');
  });

  it('interpolates named parameters', () => {
    expect(createTranslator('en')('victory.pointsEarned', { points: 10 })).toBe('+10 ViVi Points');
  });
});

describe('companion language mapping', () => {
  it('maps any companion language to English and nothing to Vietnamese', () => {
    expect(companionToUiLanguage('en')).toBe('en');
    expect(companionToUiLanguage('ja')).toBe('en');
    expect(companionToUiLanguage(undefined)).toBeNull();
  });
});

function showPublic() {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function showKids() {
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<KidsLayout />}>
            <Route path="/" element={<div />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('language switch button', () => {
  it('changes the header text when the user picks EN', () => {
    useUiLanguageStore.setState({ manualLanguage: 'vi' });
    showPublic();
    expect(screen.getAllByText('Trang chủ').length).toBeGreaterThan(0);
    expect(screen.queryByText('Home')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Hiển thị giao diện bằng tiếng Anh' }));

    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.queryByText('Trang chủ')).not.toBeInTheDocument();
    expect(useUiLanguageStore.getState().manualLanguage).toBe('en');
  });
});

describe('default language from the active child', () => {
  it('shows the kids area in English when the child companion language is en', () => {
    // No manual choice: the active child's companion language drives the default.
    useUiLanguageStore.setState({ manualLanguage: null });
    useChildStore.setState({ activeChild: enChild, children: [enChild] });
    showKids();
    expect(screen.getByRole('button', { name: 'Enter the Parent Corner (unlock required)' })).toBeInTheDocument();
    expect(screen.queryByText('Góc Phụ Huynh')).not.toBeInTheDocument();
  });

  it('lets a manual choice override the child-derived default', () => {
    useUiLanguageStore.setState({ manualLanguage: 'vi' });
    useChildStore.setState({ activeChild: enChild, children: [enChild] });
    showKids();
    expect(screen.getByLabelText('Chọn hồ sơ bé')).toBeInTheDocument();
  });
});

describe('remembering the manual choice', () => {
  it('persists the chosen language to localStorage', () => {
    useUiLanguageStore.getState().setLanguage('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
    useUiLanguageStore.getState().setLanguage('vi');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('vi');
    useUiLanguageStore.getState().clearManualLanguage();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
