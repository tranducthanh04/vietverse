import React from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { KidsLayout } from '../app/layouts/KidsLayout.js';
import { PublicLayout } from '../app/layouts/PublicLayout.js';
import { PricingPage } from '../features/public/PricingPage.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { useUiLanguageStore } from '../i18n/index.js';

const child: ChildProfile = {
  _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6',
  companionLanguage: 'en', avatarId: 'star', viviPoints: 2500, level: 1,
  badges: [], ownedItemIds: [], screenTimeLimit: 20,
};
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ user: { id: 'parent', email: 'p@example.test', displayName: 'Parent', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: child, children: [child], isLoading: false });
  useUiLanguageStore.setState({ manualLanguage: 'vi' });
});
afterEach(() => { cleanup(); client.clear(); localStorage.clear(); sessionStorage.clear(); });

function show() {
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/kham-pha']}>
    <Routes>
      <Route element={<KidsLayout />}><Route path="/kham-pha" element={<h1>Map</h1>} /></Route>
      <Route element={<PublicLayout />}><Route path="/gia" element={<PricingPage />} /></Route>
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}

it.each([
  ['vi', 'Khóa học', ['Bản đồ', 'Kho truyện', 'Văn hóa', 'Đổi quà', 'Báu vật']],
  ['en', 'Courses', ['Map', 'Stories', 'Culture', 'Rewards', 'Treasure']],
] as const)('opens existing pricing from %s kids navigation without losing the five existing destinations', async (language, courses, labels) => {
  useUiLanguageStore.setState({ manualLanguage: language });
  show();
  const nav = within(screen.getByRole('navigation'));
  const courseLink = nav.getByRole('link', { name: courses });
  expect(courseLink).toHaveAttribute('href', '/gia');
  expect(nav.getAllByRole('link')).toHaveLength(6);
  const paths = ['/kham-pha', '/kho-truyen', '/van-hoa', '/diem-thuong', '/phong-bau-vat'];
  labels.forEach((label, i) => expect(nav.getByRole('link', { name: label })).toHaveAttribute('href', paths[i]));
  fireEvent.click(courseLink);
  expect(await screen.findByText('250.000đ')).toBeVisible();
  expect(screen.getByText('990.000đ')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(useChildStore.getState().activeChild).toEqual(child);
  expect(sessionStorage.getItem('vietverse_parent_gate_token')).toBeNull();
});

it('updates the course label when the existing language control is used', () => {
  show();
  expect(screen.getByRole('link', { name: 'Khóa học' })).toHaveAttribute('href', '/gia');
  fireEvent.click(screen.getByRole('button', { name: /bằng tiếng Anh/ }));
  expect(screen.getByRole('link', { name: 'Courses' })).toHaveAttribute('href', '/gia');
  expect(screen.queryByRole('link', { name: 'Khóa học' })).not.toBeInTheDocument();
});
