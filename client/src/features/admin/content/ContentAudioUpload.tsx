import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api.js';
import { useAuthStore } from '../../../store/authStore.js';

// Accept the formats the backend stores for content audio. Browsers report m4a/mp3 inconsistently,
// so also accept by file extension; the server re-validates by magic bytes regardless.
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/wave'];
const ALLOWED_EXT = /\.(mp3|m4a|ogg|wav)$/i;
const MAX_BYTES = 10 * 1024 * 1024;
const RETURNED_URL = /^\/api\/v1\/media\/audio\/[a-f0-9]{16}\.(mp3|m4a|ogg|wav)$/;

function failure(error: unknown) {
  return (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error;
}

/**
 * Admin-only upload of a content audio file to the backend's own storage
 * (`POST /admin/content/audio`). Files are content-addressed by sha256, so re-uploading the same
 * file returns the same relative URL. On success the returned `/api/v1/media/audio/<sha>.<ext>` URL
 * is handed back to the form via `onUploaded`; the admin still saves the draft to persist it. Pasting
 * a URL by hand stays available in the sibling text field — this only adds an upload shortcut.
 */
export function ContentAudioUpload({ onUploaded, onBusyChange, disabled = false }: {
  onUploaded: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const latest = useRef(onUploaded);
  latest.current = onUploaded;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); onBusyChange?.(false); };
  }, [onBusyChange]);

  function choose(next?: File) {
    setError(''); setMessage(''); setFile(null);
    if (!next) return;
    const okType = ALLOWED_TYPES.includes(next.type) || ALLOWED_EXT.test(next.name);
    if (!okType || next.size < 1 || next.size > MAX_BYTES) {
      setError('Chọn audio MP3, M4A, OGG hoặc WAV, tối đa 10 MB.');
      return;
    }
    setFile(next);
  }

  async function send() {
    if (!file || controller.current || disabled) return;
    const user = useAuthStore.getState().user;
    if (user?.role !== 'admin') { setError('Phiên đăng nhập đã đổi. Hãy chọn tệp và tải lại.'); return; }
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); onBusyChange?.(true); setError(''); setMessage('');
    try {
      const body = new FormData();
      body.append('audio', file, file.name);
      const response = await api.post('/admin/content/audio', body, { signal: abort.signal, timeout: 60000, headers: { 'Content-Type': 'multipart/form-data' } });
      if (!mounted.current || abort.signal.aborted || useAuthStore.getState().user !== user) throw new Error('Phiên đăng nhập đã đổi. Hãy chọn tệp và tải lại.');
      const url: unknown = response.data.data?.url;
      if (typeof url !== 'string' || !RETURNED_URL.test(url)) throw new Error('Không nhận được URL audio hợp lệ.');
      latest.current(url);
      setFile(null);
      setMessage('Đã tải audio. Bấm Lưu nháp để lưu; nội dung chưa xuất bản.');
    } catch (err) {
      if (mounted.current) setError(failure(err)?.message ?? (abort.signal.aborted ? 'Tải audio quá lâu. Hãy thử lại.' : err instanceof Error && err.message.startsWith('Phiên') ? err.message : 'Không tải được audio. Hãy thử lại hoặc chọn tệp khác.'));
    } finally {
      controller.current = null;
      if (mounted.current) { setBusy(false); onBusyChange?.(false); }
    }
  }

  return (
    <div className="cms-audio-upload">
      <label className="cms-field">
        <span>Chọn tệp audio</span>
        <input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav" disabled={busy || disabled}
          onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }} />
      </label>
      <p>MP3, M4A, OGG hoặc WAV · tối đa 10 MB. Lưu theo nội dung nên tải lại cùng tệp sẽ trùng URL.</p>
      {file && <p>{file.name} · {(file.size / 1024).toFixed(0)} KiB</p>}
      {file && <button type="button" disabled={busy || disabled} onClick={() => void send()}>{busy ? 'Đang tải audio…' : error ? 'Thử tải audio lại' : 'Tải audio lên'}</button>}
      {busy && <p role="status">Đang tải audio…</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
