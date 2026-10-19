import React from 'react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { StoriesPage } from '../features/stories/StoriesPage.js';
import { useUiLanguageStore } from '../i18n/index.js';

const originalAdapter = api.defaults.adapter;
let queries: QueryClient;
const stories = ['dong_dao', 'co_tich', 'tho', 'ngu_ngon'].map((type, index) => ({
  _id: `story-${index}`, type, title: `Story ${index}`, description: 'Local test story',
  author: '', coverImage: '', audioUrl: '', durationSec: 0, lyrics: [],
  vocab: [], quiz: [], ageGroups: ['5-6'], contentVersion: 1,
}));

beforeEach(() => {
  queries = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  api.defaults.adapter = async config => ({
    data: { data: stories }, status: 200, statusText: 'OK', headers: {}, config,
  });
});
afterEach(() => {
  cleanup();
  queries.clear();
  api.defaults.adapter = originalAdapter;
});
function show() {
  render(<QueryClientProvider client={queries}><MemoryRouter initialEntries={['/kho-truyen']}>
    <Routes>
      <Route path="/kho-truyen" element={<StoriesPage />} />
      <Route path="/kho-truyen/story-3" element={<h1>Selected story detail</h1>} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}

const languages = [
  { language: 'vi' as const, labels: ['Đồng dao', 'Cổ tích', 'Thơ ca', 'Truyện ngụ ngôn'], all: 'Tất cả thể loại' },
  { language: 'en' as const, labels: ['Rhyme', 'Fairy tale', 'Poem', 'Fables'], all: 'All types' },
];

it.each(languages)('labels all four story types correctly in both responsive badge locations ($language)', async ({ language, labels }) => {
  useUiLanguageStore.setState({ manualLanguage: language });
  show();
  await screen.findByRole('heading', { name: 'Story 3' });
  for (const [index, label] of labels.entries()) {
    const card = screen.getByRole('heading', { name: `Story ${index}` }).closest('a')!;
    const badges = within(card).getAllByText(label, { exact: true });
    expect(badges).toHaveLength(2);
    expect(badges[0].parentElement).toHaveClass('hidden', 'sm:flex');
    expect(badges[1]).toHaveClass('sm:hidden');
  }
});

it.each(languages)('does not classify unknown or missing legacy types as poems ($language)', async ({ language, labels }) => {
  useUiLanguageStore.setState({ manualLanguage: language });
  // A supplied cover isolates the inherited-key badge case from the existing placeholder lookup bug.
  const legacy = ['legacy', '', null, undefined, 'constructor'].map((type, index) => ({
    ...stories[0], _id: `legacy-${index}`, title: `Legacy ${index}`, type,
    coverImage: type === 'constructor' ? '/fixture-cover.png' : '',
  }));
  api.defaults.adapter = async config => ({ data: { data: legacy }, status: 200, statusText: 'OK', headers: {}, config });
  show();
  await screen.findByRole('heading', { name: 'Legacy 4' });
  for (const card of screen.getAllByRole('link')) {
    for (const label of labels) expect(within(card).queryAllByText(label)).toHaveLength(0);
    expect(card.querySelector('.sm\\:hidden')).not.toBeInTheDocument();
    expect(card.querySelector('.sm\\:flex')).not.toBeInTheDocument();
  }
});

it.each(languages)('preserves type/search query parameters and story navigation ($language)', async ({ language, labels, all }) => {
  useUiLanguageStore.setState({ manualLanguage: language });
  const requests: Array<{ type?: string; search?: string }> = [];
  api.defaults.adapter = async config => {
    if (config.url !== '/stories') throw new Error(`Unexpected request ${config.url}`);
    requests.push({ ...config.params });
    const data = stories.filter(story => (!config.params.type || story.type === config.params.type)
      && (!config.params.search || story.title.includes(config.params.search)));
    return { data: { data }, status: 200, statusText: 'OK', headers: {}, config };
  };
  show();
  await screen.findByRole('heading', { name: 'Story 0' });
  fireEvent.click(screen.getByRole('button', { name: labels[3] }));
  await screen.findByRole('heading', { name: 'Story 3' });
  expect(screen.queryByRole('heading', { name: 'Story 0' })).not.toBeInTheDocument();
  expect(requests.at(-1)).toEqual({ type: 'ngu_ngon', search: undefined });
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Story 3' } });
  await screen.findByRole('heading', { name: 'Story 3' });
  expect(requests.at(-1)).toEqual({ type: 'ngu_ngon', search: 'Story 3' });
  fireEvent.click(screen.getByRole('button', { name: all }));
  await screen.findByRole('heading', { name: 'Story 3' });
  expect(requests.at(-1)).toEqual({ type: undefined, search: 'Story 3' });
  fireEvent.click(screen.getByRole('heading', { name: 'Story 3' }).closest('a')!);
  expect(await screen.findByRole('heading', { name: 'Selected story detail' })).toBeInTheDocument();
});

it('updates both fable badges when the interface language changes without translating story content', async () => {
  show();
  const heading = await screen.findByRole('heading', { name: 'Story 3' });
  const card = within(heading.closest('a')!);
  expect(card.getAllByText('Truyện ngụ ngôn')).toHaveLength(2);
  act(() => useUiLanguageStore.setState({ manualLanguage: 'en' }));
  expect(card.getAllByText('Fables')).toHaveLength(2);
  expect(card.queryByText('Truyện ngụ ngôn')).not.toBeInTheDocument();
  expect(card.getByRole('heading', { name: 'Story 3' })).toBeInTheDocument();
});
