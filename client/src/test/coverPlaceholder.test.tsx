import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CoverPlaceholder } from '../components/ui/CoverPlaceholder.js';
import { CulturePage } from '../features/culture/CulturePage.js';
import { CultureDetailPage } from '../features/culture/CultureDetailPage.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChildStore } from '../store/childStore.js';

it.each([
  ['story', 'dong_dao', 'music', 'from-primary-light to-accent-light', 'text-primary'],
  ['story', 'co_tich', 'book-open', 'from-secondary-light to-cream-muted', 'text-secondary'],
  ['story', 'tho', 'feather', 'from-accent-light to-culture-light/40', 'text-culture'],
  ['story', 'ngu_ngon', 'sparkles', 'from-cream-muted to-primary-light', 'text-primary'],
  ['culture', 'tet', 'gift', 'from-primary-light to-accent-light', 'text-primary'],
  ['culture', 'am_thuc', 'utensils-crossed', 'from-accent-light to-secondary-light', 'text-secondary'],
  ['culture', 'trang_phuc', 'shirt', 'from-primary-light to-cream-muted', 'text-primary'],
  ['culture', 'phong_tuc', 'users', 'from-secondary-light to-culture-light/40', 'text-culture'],
  ['culture', 'le_hoi', 'moon', 'from-accent-light to-primary-light', 'text-secondary'],
  ['culture', 'vat_dung', 'drum', 'from-cream-muted to-secondary-light', 'text-secondary'],
  ['culture', 'thien_nhien', 'trees', 'from-culture-light/50 to-cream-muted', 'text-culture'],
  ['culture', 'tro_choi_dan_gian', 'puzzle', 'from-culture-light/40 to-accent-light', 'text-culture'],
] as const)('preserves the %s/%s cover icon and palette', (kind, variant, icon, gradient, color) => {
  const markup = renderToStaticMarkup(<CoverPlaceholder kind={kind} variant={variant} className="w-full h-full" />);
  expect(markup).toContain(`lucide-${icon}`);
  expect(markup).toContain(gradient);
  expect(markup).toContain(color);
  expect(markup).toContain('w-full h-full');
  expect(markup).toContain('aria-hidden="true"');
});

for (const kind of ['story', 'culture'] as const) {
  it.each(['unknown', '', undefined, 'constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    `uses the ${kind} fallback for non-owned variant %s`, variant => {
      const markup = renderToStaticMarkup(<CoverPlaceholder kind={kind} variant={variant} className="custom-cover" />);
      expect(markup).toContain(kind === 'story' ? 'lucide-book-open' : 'lucide-compass');
      expect(markup).toContain(kind === 'story' ? 'from-primary-light to-cream-muted' : 'from-culture-light/40 to-cream-muted');
      expect(markup).toContain(kind === 'story' ? 'text-primary' : 'text-culture');
      expect(markup).toContain('custom-cover');
      expect(markup).toContain('aria-hidden="true"');
    },
  );
}

let queries: QueryClient;
const adapter = api.defaults.adapter;
beforeEach(() => {
  queries = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.setState({ user: null });
  useChildStore.setState({ activeChild: null, children: [] });
});
afterEach(() => { cleanup(); queries.clear(); api.defaults.adapter = adapter; });

it.each(['/van-hoa', '/van-hoa/legacy'])('renders legacy category=constructor from API at %s', async path => {
  const article = { _id: 'legacy', category: 'constructor', title: 'Legacy culture', intro: 'Readable introduction', funFacts: ['A fact'], quiz: [] };
  api.defaults.adapter = async config => {
    if (config.method !== 'get' || !['/culture', '/culture/legacy'].includes(config.url!)) throw new Error(`Unexpected request: ${config.url}`);
    return { data: { data: config.url === '/culture' ? [article] : article }, status: 200, statusText: 'OK', headers: {}, config };
  };
  const { container } = render(<QueryClientProvider client={queries}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/van-hoa" element={<CulturePage />} />
    <Route path="/van-hoa/:id" element={<CultureDetailPage />} />
  </Routes></MemoryRouter></QueryClientProvider>);
  expect(await screen.findByRole('heading', { name: 'Legacy culture' })).toBeVisible();
  expect(screen.getByText('Readable introduction')).toBeVisible();
  expect(container.querySelector('.lucide-compass')?.parentElement).toHaveAttribute('aria-hidden', 'true');
  if (path === '/van-hoa') expect(screen.getByRole('link', { name: /Legacy culture/ })).toHaveAttribute('href', '/van-hoa/legacy');
});

it.each(['/van-hoa', '/van-hoa/legacy'])('preserves supplied cover images at %s', async path => {
  const article = { _id: 'legacy', category: 'constructor', title: 'Covered culture', intro: 'Intro', funFacts: ['Fact'], quiz: [], coverImage: '/images/approved-cover.jpg' };
  api.defaults.adapter = async config => ({ data: { data: config.url === '/culture' ? [article] : article }, status: 200, statusText: 'OK', headers: {}, config });
  const { container } = render(<QueryClientProvider client={queries}><MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/van-hoa" element={<CulturePage />} />
    <Route path="/van-hoa/:id" element={<CultureDetailPage />} />
  </Routes></MemoryRouter></QueryClientProvider>);
  await screen.findByRole('heading', { name: 'Covered culture' });
  expect(container.querySelector('img')).toHaveAttribute('src', '/images/approved-cover.jpg');
  expect(container.querySelector('.lucide-compass')).toBeNull();
});
