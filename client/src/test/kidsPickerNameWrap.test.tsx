import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { KidsLayout } from '../app/layouts/KidsLayout.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { useUiLanguageStore } from '../i18n/index.js';
import { api } from '../lib/api.js';

const child: ChildProfile = {
  _id: 'a', parentId: 'parent', name: 'An', ageGroup: '5-6',
  companionLanguage: 'en', avatarId: 'star', viviPoints: 0, level: 1,
  badges: [], ownedItemIds: [], screenTimeLimit: 0,
};
const names = ['abcdefghij'.repeat(3), 'Nguyễn Hoàng Thiên An Minh Anh'];
const profiles = [child, ...names.map((name, i) => ({ ...child, _id: `child-${i}`, name, viviPoints: 1234567890 }))];
let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ user: { id: 'parent', email: 'p@example.test', displayName: 'Parent', role: 'parent' }, isLoading: false });
  useChildStore.setState({ activeChild: child, children: profiles, isLoading: false });
  useUiLanguageStore.setState({ manualLanguage: 'vi' });
});
afterEach(() => { cleanup(); client.clear(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });

function show() {
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/kham-pha']}>
    <Routes><Route element={<KidsLayout />}>
      <Route path="/kham-pha" element={<button>Outside picker</button>} />
    </Route></Routes>
  </MemoryRouter></QueryClientProvider>);
  return screen.getByRole('button', { name: /Chọn hồ sơ bé|Choose child profile/ });
}

// Layout/clipping assertions live in the real-CSS browser test; jsdom has no layout.
it.each(['vi', 'en'] as const)('keeps full valid names and balances available in the %s picker without changing the active child', language => {
  useUiLanguageStore.setState({ manualLanguage: language });
  const patch = vi.spyOn(api, 'patch');
  fireEvent.click(show());
  const menu = document.getElementById('child-picker-menu')!;
  for (const name of names) {
    expect(name).toHaveLength(30);
    const option = within(menu).getByRole('button', { name: new RegExp(`^${name}`) });
    expect(within(option).getByText(name, { exact: true })).toBeVisible();
    expect(option).toHaveTextContent(language === 'vi' ? '1.234.567.890' : '1,234,567,890');
  }
  expect(useChildStore.getState().activeChild).toEqual(child);
  expect(patch).not.toHaveBeenCalled();
});

it.each([1, 2])('selects the intended full-name profile %s through the existing API and closes the picker', async index => {
  const selected = profiles[index];
  const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: selected } });
  const trigger = show();
  fireEvent.click(trigger);
  fireEvent.click(within(document.getElementById('child-picker-menu')!).getByRole('button', { name: new RegExp(`^${selected.name}`) }));
  await waitFor(() => expect(useChildStore.getState().activeChild).toEqual(selected));
  expect(patch).toHaveBeenCalledExactlyOnceWith(`/children/${selected._id}/select`);
  expect(trigger).toHaveTextContent(selected.name);
  expect(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(document.getElementById('child-picker-menu')).toBeNull();
  expect(screen.getByRole('link', { name: /Điểm thưởng.*1\.234\.567\.890/ })).toHaveAttribute('href', '/diem-thuong');
});

it('keeps Escape focus restoration and outside dismissal without selecting a profile', () => {
  const patch = vi.spyOn(api, 'patch');
  const trigger = show();
  fireEvent.click(trigger);
  const option = within(document.getElementById('child-picker-menu')!).getByRole('button', { name: /^abcdefghij/ });
  option.focus();
  fireEvent.keyDown(option, { key: 'Escape' });
  expect(trigger).toHaveFocus();
  expect(document.getElementById('child-picker-menu')).toBeNull();
  fireEvent.click(trigger);
  const outside = screen.getByRole('button', { name: 'Outside picker' });
  outside.focus();
  fireEvent.mouseDown(outside);
  expect(document.getElementById('child-picker-menu')).toBeNull();
  expect(outside).toHaveFocus();
  expect(useChildStore.getState().activeChild).toEqual(child);
  expect(patch).not.toHaveBeenCalled();
});
