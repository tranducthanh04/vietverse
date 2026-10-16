import { useEffect, useRef, useState, type FormEvent } from 'react';
import { authPost } from '../../lib/api.js';
import { loadGoogleIdentity } from '../../lib/googleIdentity.js';
import { useAuthStore } from '../../store/authStore.js';
import { Button } from '../ui/Button.js';

type Phase = 'idle' | 'starting' | 'ready' | 'submitting' | 'link' | 'done';
type Session = Parameters<ReturnType<typeof useAuthStore.getState>['acceptSession']>[0];
type AuthState = ReturnType<typeof useAuthStore.getState>;
type Flow = { nonce: string; user: AuthState['user']; token: string | null };
type SubmitBody = { credential: string } | { password: string };
interface Props { disabled?: boolean; onActiveChange: (active: boolean) => void; onSuccess: () => Promise<void> }

function errorDetails(error: unknown) {
  const response = (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response;
  return { code: response?.data?.error?.code, message: response?.data?.error?.message ||
    (error instanceof Error ? error.message : 'Không thể đăng nhập Google. Vui lòng thử lại.') };
}

export function GoogleSignInButton({ disabled, onActiveChange, onSuccess }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const mounted = useRef(false);
  const busy = useRef(false);
  const cancelPending = useRef(false);
  const flow = useRef<Flow>();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current++; window.google?.accounts.id.cancel?.(); };
  }, []);

  const isCurrent = (id: number) => mounted.current && generation.current === id;
  const reset = () => {
    generation.current++; flow.current = undefined; busy.current = false;
    host.current?.replaceChildren(); setPhase('idle'); setEmail(''); setPassword(''); onActiveChange(false);
  };
  const finish = async (session: Session) => {
    flow.current = undefined; host.current?.replaceChildren(); setPassword(''); setPhase('done');
    useAuthStore.getState().acceptSession(session);
    try { await onSuccess(); }
    catch { if (mounted.current) setError('Đăng nhập thành công nhưng chưa tải được trang tiếp theo. Vui lòng thử tiếp tục.'); }
  };
  const submit = async (id: number, body: SubmitBody) => {
    const current = flow.current;
    if (!isCurrent(id) || busy.current || !current) return;
    const linking = 'password' in body;
    const state = useAuthStore.getState();
    if (state.user !== current.user || state.accessToken !== current.token) { reset(); return; }
    busy.current = true; setPhase('submitting'); setError('');
    try {
      const response = await authPost(linking ? '/auth/google/link' : '/auth/google', { ...body, nonce: current.nonce });
      if (!isCurrent(id)) return;
      const latest = useAuthStore.getState();
      if (latest.user !== current.user || latest.accessToken !== current.token) { reset(); return; }
      if (response.data.data.linkRequired) { setEmail(response.data.data.email); setPhase('link'); }
      else await finish(response.data.data);
    } catch (err) {
      if (!isCurrent(id)) return;
      const details = errorDetails(err);
      if (linking && details.code === 'GOOGLE_LINK_PASSWORD_INVALID') setPhase('link');
      else reset();
      setError(details.message);
    } finally { if (isCurrent(id)) busy.current = false; }
  };
  const begin = async () => {
    if (busy.current || cancelPending.current || disabled) return;
    const id = ++generation.current;
    busy.current = true; onActiveChange(true); setPhase('starting'); setError('');
    const snapshot = useAuthStore.getState();
    try {
      const { data } = await authPost('/auth/google/start');
      const identity = await loadGoogleIdentity();
      if (!isCurrent(id) || !host.current) return;
      flow.current = { nonce: data.data.nonce, user: snapshot.user, token: snapshot.accessToken };
      identity.initialize({ client_id: data.data.clientId, nonce: data.data.nonce, auto_select: false,
        callback: response => { void submit(id, { credential: response.credential }); } });
      host.current.replaceChildren();
      identity.renderButton(host.current, { theme: 'outline', size: 'large', text: 'continue_with', locale: 'vi',
        width: Math.max(200, Math.min(360, host.current.clientWidth || 240)) });
      setPhase('ready');
    } catch (err) {
      if (isCurrent(id)) { reset(); setError(errorDetails(err).message); }
    } finally { if (isCurrent(id)) busy.current = false; }
  };
  const cancel = async () => {
    if (busy.current) return;
    const nonce = flow.current?.nonce;
    cancelPending.current = true; reset(); setPhase('starting'); setError(''); window.google?.accounts.id.cancel?.();
    // Abandoned flows also expire server-side; cancellation never blocks email login.
    if (nonce) await authPost('/auth/google/cancel', { nonce }).catch(() => undefined);
    cancelPending.current = false;
    if (mounted.current) setPhase('idle');
  };
  const link = (event: FormEvent) => { event.preventDefault(); void submit(generation.current, { password }); };
  const submitting = phase === 'submitting';

  return <section aria-label="Đăng nhập Google" className="space-y-3">
    {phase === 'idle' && <Button type="button" variant="outline" className="w-full" disabled={disabled} onClick={begin}>Tiếp tục với Google</Button>}
    {phase === 'starting' && <p role="status" className="text-sm text-center">Đang kết nối Google…</p>}
    <div ref={host} hidden={phase !== 'ready'} className="flex justify-center" />
    {(phase === 'link' || (submitting && email)) && <form onSubmit={link} className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 space-y-3">
      <p className="text-sm text-amber-900">Email <strong>{email}</strong> đã có tài khoản. Nhập mật khẩu Vietverse để liên kết. Đây không phải mật khẩu Google.</p>
      <label htmlFor="google-link-password" className="block text-sm font-bold">Mật khẩu Vietverse hiện tại</label>
      <input id="google-link-password" type="password" required autoComplete="current-password" maxLength={256} disabled={submitting}
        value={password} onChange={event => setPassword(event.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-cream-border bg-white" />
      <Button type="submit" isLoading={submitting} className="w-full">Xác nhận liên kết</Button>
    </form>}
    {submitting && !email && <p role="status" className="text-sm text-center">Đang xác minh tài khoản…</p>}
    {(phase === 'ready' || phase === 'link') && <Button type="button" variant="ghost" className="w-full" onClick={cancel}>Hủy đăng nhập Google</Button>}
    {phase === 'done' && <Button type="button" className="w-full" onClick={async () => {
      setError(''); try { await onSuccess(); } catch { setError('Chưa tải được trang tiếp theo. Vui lòng thử lại.'); }
    }}>Tiếp tục vào Vietverse</Button>}
    {error && <p role="alert" className="rounded-xl bg-red-50 text-red-700 border border-red-200 p-3 text-sm">{error}</p>}
  </section>;
}
