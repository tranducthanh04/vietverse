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
const vietnameseTagline = 'CÙNG CON MỞ KHO BÁU, TIẾNG VIỆT THÊM NHIỆM MÀU';
const englishTagline = 'OPEN THE TREASURE WITH YOUR CHILD, MAKE VIETNAMESE MAGICAL';
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
      <Route element={<KidsLayout />}><Route path="/kham-pha" element={<h1>Map destination</h1>} /></Route>
      <Route path="/" element={<h1>Home destination</h1>} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}

it.each([
  ['vi', vietnameseTagline],
  ['en', englishTagline],
] as const)('provides the complete %s brand and tagline in the kids header and links to existing home', async (language, tagline) => {
  useUiLanguageStore.setState({ manualLanguage: language });
  show();
  const header = within(screen.getByRole('banner'));
  const brand = header.getByRole('link', { name: /^VIETVERSE$/ });
  expect(brand).toHaveAttribute('href', '/');
  expect(brand).toHaveTextContent('VIETVERSE');
  expect(header.getByText(tagline, { exact: true })).toBeVisible();
  expect(within(screen.getByRole('navigation')).getAllByRole('link')).toHaveLength(6);
  fireEvent.click(brand);
  expect(await screen.findByRole('heading', { name: 'Home destination' })).toBeInTheDocument();
  expect(useChildStore.getState().activeChild).toEqual(child);
  expect(sessionStorage.getItem('vietverse_parent_gate_token')).toBeNull();
});

it('updates the whole tagline through the existing language switch without changing the active child', () => {
  show();
  const header = within(screen.getByRole('banner'));
  expect(header.getByText(vietnameseTagline)).toBeVisible();
  fireEvent.click(header.getByRole('button', { name: /bằng tiếng Anh/ }));
  expect(header.getByText(englishTagline)).toBeVisible();
  expect(header.queryByText(vietnameseTagline)).not.toBeInTheDocument();
  expect(header.getByRole('link', { name: /^VIETVERSE$/ })).toHaveAttribute('href', '/');
  expect(useChildStore.getState().activeChild).toEqual(child);
});

it.each(['parent', 'admin'] as const)('retains branding and existing controls for a %s with a long child name and large balance', role => {
  useAuthStore.setState({ user: { id: 'parent', email: 'p@example.test', displayName: 'Parent', role } });
  useChildStore.setState({ activeChild: { ...child, name: 'Nguyễn Thiên An Minh Khánh', viviPoints: 1234567890 } });
  show();
  const header = within(screen.getByRole('banner'));
  expect(header.getByRole('link', { name: /^VIETVERSE$/ })).toBeVisible();
  expect(header.getByText(vietnameseTagline)).toBeVisible();
  expect(header.getByRole('link', { name: /Điểm thưởng.*1\.234\.567\.890/i })).toHaveAttribute('href', '/diem-thuong');
  expect(header.getByRole('button', { name: /Góc Phụ Huynh/i })).toBeVisible();
  expect(header.queryByRole('button', { name: /quản trị/i }) !== null).toBe(role === 'admin');
  act(() => useChildStore.setState({ activeChild: null }));
  expect(header.getByRole('link', { name: /^VIETVERSE$/ })).toBeVisible();
  expect(header.getByText(vietnameseTagline)).toBeVisible();
});
