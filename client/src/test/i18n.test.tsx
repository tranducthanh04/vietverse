import React from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi as viDict } from '../i18n/vi.js';
import { en as enDict } from '../i18n/en.js';
import { createTranslator } from '../i18n/translator.js';
import { companionToUiLanguage, useUiLanguageStore } from '../i18n/uiLanguageStore.js';
import { PublicLayout } from '../app/layouts/PublicLayout.js';
import { KidsLayout } from '../app/layouts/KidsLayout.js';
import { ParentLayout } from '../app/layouts/ParentLayout.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';

const STORAGE_KEY = 'vietverse_ui_language';

const enChild: ChildProfile = {
  _id: 'child-en', parentId: 'parent', name: 'An', ageGroup: '5-6',
  companionLanguage: 'en', companionLanguages: ['en'], avatarId: 'star',
  viviPoints: 30, level: 1, badges: [], ownedItemIds: [], screenTimeLimit: 20,
};

const viChild: ChildProfile = {
  ...enChild, _id: 'child-vi', companionLanguage: 'vi', companionLanguages: ['vi', 'en'],
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
  it('maps vi to Vietnamese, every other companion language to English, and nothing to null', () => {
    expect(companionToUiLanguage('vi')).toBe('vi');
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

  it('shows the kids area in Vietnamese when the child companion language is vi', () => {
    // No manual choice: a child whose first companion language is `vi` defaults to the Vietnamese UI.
    useUiLanguageStore.setState({ manualLanguage: null });
    useChildStore.setState({ activeChild: viChild, children: [viChild] });
    showKids();
    expect(screen.getByLabelText('Chọn hồ sơ bé')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enter the Parent Corner (unlock required)' })).not.toBeInTheDocument();
  });

  it('lets a manual choice override the child-derived default', () => {
    // A vi child would default to Vietnamese; an explicit EN choice must still win.
    useUiLanguageStore.setState({ manualLanguage: 'en' });
    useChildStore.setState({ activeChild: viChild, children: [viChild] });
    showKids();
    expect(screen.getByRole('button', { name: 'Enter the Parent Corner (unlock required)' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Chọn hồ sơ bé')).not.toBeInTheDocument();
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

describe('mobile language controls', () => {
  let appStyles: string;
  beforeAll(async () => {
    const config = resolve('tailwind.config.js');
    const result = await postcss([tailwindcss(config)]).process('@tailwind utilities;', { from: undefined });
    appStyles = result.css;
  });
  afterEach(() => sessionStorage.clear());

  it.each([
    ['kids', KidsLayout],
    ['parent', ParentLayout],
  ] as const)('keeps the %s switch visible with mobile base CSS and changes the interface', (_, Layout) => {
    useUiLanguageStore.setState({ manualLanguage: null });
    useChildStore.setState({ activeChild: enChild, children: [enChild] });
    sessionStorage.setItem('vietverse_parent_gate_token', 'local-test-gate');
    sessionStorage.setItem('vietverse_parent_gate_unlocked', String(Date.now() + 60_000));
    render(
      <QueryClientProvider client={queryClient}>
        {/* jsdom applies base CSS, not desktop media queries; browser QA covers actual widths. */}
        <style>{appStyles}</style>
        <MemoryRouter>
          <Routes><Route path="/" element={<Layout />} /></Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const header = screen.getByRole('banner');
    const vietnamese = within(header).getByRole('button', { name: 'Show the interface in Vietnamese' });
    expect(vietnamese).toBeVisible();
    fireEvent.click(vietnamese);
    expect(within(header).getByRole('button', { name: 'Hiển thị giao diện bằng tiếng Việt' })).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('vi');
    fireEvent.click(within(header).getByRole('button', { name: 'Hiển thị giao diện bằng tiếng Anh' }));
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
});
