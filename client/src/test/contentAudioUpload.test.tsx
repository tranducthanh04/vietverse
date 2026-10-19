import React, { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ContentAudioUpload } from '../features/admin/content/ContentAudioUpload.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

const originalAdapter = api.defaults.adapter;
const audioUrl = '/api/v1/media/audio/abcdef0123456789.mp3';
let calls: { path: string; form: FormData }[];
let failNext: unknown;
beforeEach(() => {
  calls = []; failNext = undefined;
  useAuthStore.setState({ user: { id: 'admin', role: 'admin', email: 'admin@example.test', displayName: 'Admin' } });
  api.defaults.adapter = async config => {
    calls.push({ path: config.url!, form: config.data as FormData });
    if (failNext !== undefined) { const error = failNext; failNext = undefined; throw error; }
    return { data: { data: { url: audioUrl } }, status: 201, statusText: 'Created', headers: {}, config };
  };
});
afterEach(() => { cleanup(); api.defaults.adapter = originalAdapter; useAuthStore.setState({ user: null }); vi.restoreAllMocks(); });

function Harness() {
  const [value, setValue] = useState('');
  return (<><ContentAudioUpload onUploaded={setValue} /><output data-testid="field">{value}</output></>);
}
function choose(file = new File(['ID3 audio bytes'], 'clip.mp3', { type: 'audio/mpeg' })) {
  fireEvent.change(screen.getByLabelText('Chọn tệp audio'), { target: { files: [file] } });
}

it('uploads an audio file and fills the returned URL into the form field', async () => {
  render(<Harness />);
  choose();
  fireEvent.click(screen.getByRole('button', { name: 'Tải audio lên' }));
  await waitFor(() => expect(screen.getByTestId('field')).toHaveTextContent(audioUrl));
  expect(calls.map(c => c.path)).toEqual(['/admin/content/audio']);
  expect(calls[0].form.get('audio')).toBeInstanceOf(File);
  expect(screen.getByText(/Đã tải audio/)).toBeInTheDocument();
});
it('rejects a disallowed file type before any upload request', async () => {
  render(<Harness />);
  choose(new File(['text'], 'note.txt', { type: 'text/plain' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('MP3, M4A, OGG hoặc WAV');
  expect(calls).toHaveLength(0);
  expect(screen.queryByRole('button', { name: /Tải audio/ })).not.toBeInTheDocument();
});
it('rejects an oversize file before any upload request', async () => {
  render(<Harness />);
  choose(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.mp3', { type: 'audio/mpeg' }));
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(calls).toHaveLength(0);
});
it('shows the server error message and offers a retry when the upload fails', async () => {
  render(<Harness />);
  failNext = { response: { data: { error: { message: 'Định dạng audio không hợp lệ.' } } } };
  choose();
  fireEvent.click(screen.getByRole('button', { name: 'Tải audio lên' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Định dạng audio không hợp lệ.');
  expect(screen.getByTestId('field')).toHaveTextContent('');
  expect(screen.getByRole('button', { name: 'Thử tải audio lại' })).toBeInTheDocument();
});
