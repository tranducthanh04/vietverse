import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api.js';
import { useAuthStore } from '../../../store/authStore.js';

export type CoverUploadContext = { kind: 'story' | 'culture'; contentId: string; draftVersion: number };
type Intent = { ticket: string; upload: { url: string; fields: Record<string, string> } };
type Attempt = { file: File; requestId: string; intent?: Intent; attempted: boolean };
function failure(error: unknown) {
  return (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error;
}
export function CoverImageUpload({ context, onUploaded, onBusyChange, disabled = false }: {
  context: CoverUploadContext; onUploaded: (url: string) => void; onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const attempt = useRef<Attempt | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const latest = useRef(onUploaded);
  latest.current = onUploaded;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); onBusyChange(false); };
  }, [onBusyChange]);
  function choose(next?: File) {
    setError(''); setMessage(''); setFile(null); attempt.current = null;
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type) || next.size < 1 || next.size > 5242880) {
      setError('Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MiB.'); return;
    }
    setFile(next);
    attempt.current = { file: next, requestId: crypto.randomUUID(), attempted: false };
  }
  async function send() {
    const current = attempt.current;
    if (!current || controller.current || disabled) return;
    const user = useAuthStore.getState().user;
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true); onBusyChange(true); setError(''); setMessage('');
    const active = () => {
      if (!mounted.current || abort.signal.aborted || user !== useAuthStore.getState().user || user?.role !== 'admin') throw new Error('Phiên đăng nhập đã đổi. Hãy chọn ảnh và tải lại.');
    };
    const verify = async () => {
      active();
      const response = await api.post('/admin/content-images/finalize', { ticket: current.intent!.ticket }, { signal: abort.signal, timeout: 20000 });
      active();
      const url: unknown = response.data.data?.url;
      if (typeof url !== 'string' || !/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) throw new Error('Không nhận được URL ảnh đã xác minh.');
      return url;
    };
    try {
      active();
      if (!current.intent) {
        const response = await api.post('/admin/content-images/intent', { ...context, requestId: current.requestId, bytes: current.file.size, mimeType: current.file.type }, { signal: abort.signal, timeout: 20000 });
        active(); current.intent = response.data.data;
      }
      let verified: string | undefined;
      if (current.attempted) {
        try { verified = await verify(); }
        catch (err) { if (failure(err)?.code !== 'IMAGE_ASSET_NOT_FOUND') throw err; }
      }
      if (!verified) {
        active();
        const upload = current.intent!.upload;
        if (!/^https:\/\/api\.cloudinary\.com\/v1_1\/[^/?#]+\/image\/upload$/.test(upload.url)) throw new Error('Địa chỉ tải ảnh không hợp lệ.');
        const body = new FormData();
        for (const key of ['public_id', 'timestamp', 'overwrite', 'allowed_formats', 'upload_preset', 'api_key', 'signature']) {
          if (upload.fields[key] !== undefined) body.append(key, upload.fields[key]);
        }
        body.append('file', current.file);
        current.attempted = true;
        const timer = setTimeout(() => abort.abort(), 60000);
        let providerResponse: Response | undefined;
        try {
          // Provider requests must never inherit app cookies, JWT or Parent Gate headers.
          providerResponse = await fetch(upload.url, { method: 'POST', body, credentials: 'omit', redirect: 'error', signal: abort.signal });
        } catch {
          active(); // A lost provider response may still have stored the asset.
        } finally { clearTimeout(timer); }
        if (providerResponse && !providerResponse.ok) throw new Error('Cloudinary từ chối tệp ảnh. Hãy thử lại hoặc chọn ảnh khác.');
        verified = await verify();
      }
      active(); latest.current(verified);
      attempt.current = null; setFile(null); setMessage('Đã tải ảnh. Bấm Lưu nháp để lưu; nội dung chưa xuất bản.');
    } catch (err) {
      if (mounted.current) setError(failure(err)?.message ?? (abort.signal.aborted ? 'Tải ảnh quá lâu. Hãy thử lại.' : err instanceof Error && err.message.startsWith('Phiên') ? err.message : 'Không tải được ảnh. Hãy thử lại hoặc chọn lại ảnh.'));
    } finally {
      controller.current = null;
      if (mounted.current) { setBusy(false); onBusyChange(false); }
    }
  }
  return <div className="cms-cover-upload">
    <label className="cms-field"><span>Chọn ảnh bìa</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || disabled} onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }} /></label>
    <p>JPG, PNG hoặc WebP · tối đa 5 MiB. Ảnh hiển thị được tối ưu, giữ nguyên tỷ lệ.</p>
    {file && <p>{file.name} · {(file.size / 1024).toFixed(0)} KiB</p>}
    {file && <button type="button" disabled={busy || disabled} onClick={() => void send()}>{busy ? 'Đang tải và kiểm tra ảnh…' : error ? 'Thử tải ảnh lại' : 'Tải ảnh lên'}</button>}
    {busy && <p role="status">Đang tải và kiểm tra ảnh…</p>}
    {error && <p role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
  </div>;
}
