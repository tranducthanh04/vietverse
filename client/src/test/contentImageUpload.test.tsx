import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { ContentEditorPage } from '../features/admin/content/ContentEditorPage.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

const originalAdapter = api.defaults.adapter;
const uploadUrl = 'https://api.cloudinary.com/test/image/upload';
const imageUrl = 'https://res.cloudinary.com/test/image/upload/verified.png';
const intent = { ticket: 'image-ticket', upload: { url: uploadUrl.replace('/test/', '/v1_1/test/'), fields: { public_id: 'random-id', signature: 'signed', api_key: 'public-key', timestamp: '123', upload_preset: 'images' } } };
let calls: { path: string; body: Record<string, unknown> }[];
let finalizeFailures: number;
let remoteUpload: ReturnType<typeof vi.fn>;
let client: QueryClient;
beforeEach(() => {
  calls = []; finalizeFailures = 0;
  useAuthStore.setState({ user: { id: 'admin', role: 'admin', email: 'admin@example.test', displayName: 'Admin' } });
  remoteUpload = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', remoteUpload);
  api.defaults.adapter = async config => {
    const path = config.url!;
    calls.push({ path, body: config.data ? JSON.parse(config.data) : {} });
    if (path.endsWith('/finalize') && finalizeFailures-- > 0) throw new Error('Lost response');
    const payload = { title: 'Original title', type: 'dong_dao', category: 'tet', coverImage: '/old.png', audioUrl: '', author: '', description: '', durationSec: 0, ageGroups: [], vocab: [], lyrics: [], quiz: [], intro: '', tags: [], funFacts: [] };
    return { data: { data: path.endsWith('/intent') ? intent : path.endsWith('/finalize') ? { url: imageUrl } : { live: null, draft: { payload, state: 'editing', draftVersion: 1, editorialNotes: [], updatedBy: 'admin', updatedAt: '2026-10-12' } } }, status: 200, statusText: 'OK', headers: {}, config };
  };
});
afterEach(() => { cleanup(); client?.clear(); api.defaults.adapter = originalAdapter; vi.unstubAllGlobals(); vi.restoreAllMocks(); useAuthStore.setState({ user: null }); });
async function show(kind: 'story' | 'culture' = 'story') {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: '/edit/:id', element: <ContentEditorPage kind={kind} /> }], { initialEntries: ['/edit/content-id'] });
  render(<QueryClientProvider client={client}><RouterProvider router={router} /></QueryClientProvider>);
  await screen.findByLabelText('Tiêu đề');
}
function choose(file = new File(['image'], 'cover.png', { type: 'image/png' })) {
  fireEvent.change(screen.getByLabelText('Chọn ảnh bìa'), { target: { files: [file] } });
}
it.each(['story', 'culture'] as const)('uploads a %s cover and only updates the unsaved form after verification', async kind => {
  await show(kind);
  choose();
  fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }));
  await waitFor(() => expect(screen.getByLabelText('URL ảnh')).toHaveValue(imageUrl));
  expect(calls.filter(call => call.path.endsWith('/intent'))[0].body).toMatchObject({ kind, contentId: 'content-id', draftVersion: 1, bytes: 5, mimeType: 'image/png' });
  expect(calls.some(call => /\/draft$|\/publish$/.test(call.path))).toBe(false);
  expect(remoteUpload.mock.calls[0][1]).toMatchObject({ credentials: 'omit', redirect: 'error' });
  expect(remoteUpload.mock.calls[0][1].headers).toBeUndefined();
  expect(screen.getByRole('img', { name: 'Ảnh nội dung' })).toHaveAttribute('src', imageUrl);
  expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeEnabled();
});
it.each([new File(['svg'], 'cover.svg', { type: 'image/svg+xml' }), new File([new Uint8Array(5242881)], 'huge.png', { type: 'image/png' })])('rejects disallowed files before any upload request', async file => {
  await show(); choose(file);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(calls.filter(call => call.path.endsWith('/intent'))).toHaveLength(0);
  expect(screen.getByLabelText('URL ảnh')).toHaveValue('/old.png');
});
it('retries verification without uploading a second asset or overwriting other edits', async () => {
  await show(); finalizeFailures = 1; choose();
  fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }));
  await screen.findByRole('alert');
  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'Edited title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Thử tải ảnh lại' }));
  await waitFor(() => expect(screen.getByLabelText('URL ảnh')).toHaveValue(imageUrl));
  expect(remoteUpload).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Tiêu đề')).toHaveValue('Edited title');
});
it('does not finalize when Cloudinary rejects the provider upload', async () => {
  await show();
  remoteUpload.mockResolvedValue({ ok: false, status: 400 });
  choose(); fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }));
  await screen.findByRole('alert');
  expect(calls.filter(call => call.path.endsWith('/finalize'))).toHaveLength(0);
  expect(screen.getByLabelText('URL ảnh')).toHaveValue('/old.png');
});
it('disables upload while a draft save is in flight but allows metadata typing', async () => {
  await show(); choose();
  const previousAdapter = api.defaults.adapter as (config: import('axios').InternalAxiosRequestConfig) => Promise<import('axios').AxiosResponse>;
  let finishSave!: () => void;
  api.defaults.adapter = config => config.method === 'put'
    ? new Promise(resolve => { finishSave = () => resolve({ data: { data: { state: 'editing', draftVersion: 2, payload: JSON.parse(config.data).payload, editorialNotes: [], updatedBy: 'admin', updatedAt: '2026-10-12' } }, status: 200, statusText: 'OK', headers: {}, config }); })
    : previousAdapter(config);
  fireEvent.change(screen.getByLabelText('Tiêu đề'), { target: { value: 'New title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu nháp' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Tải ảnh lên' })).toBeDisabled());
  expect(screen.getByLabelText('Chọn ảnh bìa')).toBeDisabled();
  expect(screen.getByLabelText('Tiêu đề')).toBeEnabled();
  expect(remoteUpload).not.toHaveBeenCalled();
  finishSave();
  await screen.findByText('Đã lưu nháp. Chưa xuất bản.');
});
it('blocks save during upload and ignores a result from a replaced login session', async () => {
  await show();
  let finish!: (value: { ok: boolean }) => void;
  remoteUpload.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  choose(); fireEvent.click(screen.getByRole('button', { name: 'Tải ảnh lên' }));
  await waitFor(() => expect(remoteUpload).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Lưu nháp' })).toBeDisabled();
  useAuthStore.setState({ user: null }); finish({ ok: true });
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  expect(screen.getByLabelText('URL ảnh')).toHaveValue('/old.png');
  expect(calls.filter(call => call.path.endsWith('/finalize'))).toHaveLength(0);
});
