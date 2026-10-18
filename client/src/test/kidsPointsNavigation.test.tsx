import React from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { KidsLayout } from '../app/layouts/KidsLayout.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { useUiLanguageStore } from '../i18n/index.js';

const child: ChildProfile = {
  _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6',
  companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1,
  badges: [], ownedItemIds: [], screenTimeLimit: 20,
};
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ user: { id: 'parent', email: 'p@example.test', displayName: 'Parent', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: child, children: [child], isLoading: false });
  useUiLanguageStore.setState({ manualLanguage: 'vi' });
});
afterEach(() => { cleanup(); client.clear(); localStorage.clear(); });

function show() {
  render(<QueryClientProvider client={client}>
    <MemoryRouter initialEntries={['/kham-pha']}>
      <Routes><Route element={<KidsLayout />}>
        <Route path="/kham-pha" element={<h1>Map destination</h1>} />
        <Route path="/diem-thuong" element={<h1>Points destination</h1>} />
      </Route></Routes>
    </MemoryRouter>
  </QueryClientProvider>);
}

it.each([
  ['vi', 0, '0', /điểm thưởng/i],
  ['en', 0, '0', /rewards/i],
  ['vi', 1234567890, '1.234.567.890', /điểm thưởng/i],
  ['en', 1234567890, '1,234,567,890', /rewards/i],
] as const)('opens rewards from the %s header with balance %i', async (language, balance, formatted, destination) => {
  useUiLanguageStore.setState({ manualLanguage: language });
  useChildStore.setState({ activeChild: { ...child, viviPoints: balance } });
  show();
  const header = within(screen.getByRole('banner'));
  const pill = header.getByRole('link', { name: destination });
  expect(pill).toHaveAttribute('href', '/diem-thuong');
  expect(pill).toHaveAccessibleName(new RegExp(formatted.replace(/[.,]/g, '\\$&')));
  expect(pill).toHaveTextContent(formatted);
  expect(header.getByRole('button', { name: language === 'vi' ? /bằng tiếng Anh/ : /in Vietnamese/ })).toBeVisible();
  fireEvent.click(pill);
  expect(await screen.findByRole('heading', { name: 'Points destination' })).toBeInTheDocument();
  expect(useChildStore.getState().activeChild?.viviPoints).toBe(balance);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('updates the link balance and accessible name with the active child and interface language', () => {
  show();
  const header = within(screen.getByRole('banner'));
  const pill = header.getByRole('link', { name: /điểm thưởng/i });
  act(() => useChildStore.getState().setActiveChild({ ...child, _id: 'b', viviPoints: 2500 }));
  expect(pill).toHaveTextContent('2.500');
  expect(pill).toHaveAccessibleName(/2\.500/);
  fireEvent.click(header.getByRole('button', { name: /bằng tiếng Anh/ }));
  expect(pill).toHaveTextContent('2,500');
  expect(pill).toHaveAccessibleName(/rewards.*2,500/i);
  act(() => useChildStore.getState().setActiveChild(child));
  expect(pill).toHaveTextContent('0');
  expect(pill).toHaveAccessibleName(/rewards.*0/i);
});
