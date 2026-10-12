import { afterEach, beforeEach, expect, it } from 'vitest';
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { LoginPage } from '../features/auth/LoginPage.js';
import { api, getApiAccessToken, setApiAccessToken } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

const originalAdapter = api.defaults.adapter;
let callback: (response: { credential: string }) => void;
let linkRequired: boolean;
let unavailable: boolean;
let received: Array<{ url?: string; body: unknown }>;
let children: unknown[];
let role: 'parent' | 'admin';
const session = { user: { id: 'google-parent', email: 'parent@example.test', displayName: 'Parent', role: 'parent' }, accessToken: 'google-access' };

beforeEach(() => {
  received = []; linkRequired = false; unavailable = false; children = []; role = 'parent';
  useAuthStore.setState({ user: null, subscription: null, accessToken: null, isLoading: false });
  setApiAccessToken(null);
  Object.assign(window, { google: { accounts: { id: {
    initialize: (options: { callback: typeof callback; nonce: string; client_id: string }) => {
      if (options.nonce !== 'a'.repeat(64) || options.client_id !== 'test-client') throw new Error('Wrong Google challenge');
      callback = options.callback;
    },
    renderButton: (element: HTMLElement) => {
      const button = document.createElement('button'); button.textContent = 'Chọn tài khoản Google';
      button.onclick = () => callback({ credential: 'google-id-token' }); element.appendChild(button);
    },
  } } } });
  api.defaults.adapter = async config => {
    const body = config.data ? JSON.parse(config.data) : undefined;
    received.push({ url: config.url, body });
    if (unavailable || (config.url?.endsWith('/link') && body.password !== 'LocalPass123!')) {
      throw { response: { status: unavailable ? 503 : 401, data: { error: {
        code: unavailable ? 'GOOGLE_NOT_CONFIGURED' : 'GOOGLE_LINK_PASSWORD_INVALID',
        message: unavailable ? 'Đăng nhập Google chưa được cấu hình.' : 'Mật khẩu Vietverse chưa đúng.',
      } } }, config };
    }
    const data = config.url?.endsWith('/start') ? { clientId: 'test-client', nonce: 'a'.repeat(64) }
      : config.url === '/children' ? children
      : config.url === '/auth/google' && linkRequired ? { linkRequired: true, email: 'parent@example.test' } : { ...session, user: { ...session.user, role } };
    return { data: { data }, status: 200, statusText: 'OK', headers: {}, config };
  };
});
afterEach(() => { cleanup(); api.defaults.adapter = originalAdapter; Reflect.deleteProperty(window, 'google'); sessionStorage.clear(); });

function mount(register = true, location = '/auth') {
  return render(<StrictMode><MemoryRouter initialEntries={[location]}><Routes>
    <Route path="/auth" element={register ? <RegisterPage /> : <LoginPage />} />
    <Route path="/bat-dau" element={<h1>Onboarding</h1>} />
    <Route path="/kham-pha" element={<h1>Explore</h1>} />
    <Route path="/admin" element={<h1>Admin</h1>} />
    <Route path="/van-hoa" element={<h1>Culture</h1>} />
  </Routes></MemoryRouter></StrictMode>);
}

async function chooseGoogle() {
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Chọn tài khoản Google' }));
}

it.each([true, false])('signs in from registration=%s and clears the previous Parent Gate', async register => {
  useAuthStore.setState({ subscription: { plan: 'yearly', maxChildren: 3 } });
  sessionStorage.setItem('vietverse_parent_gate_token', 'old-gate');
  mount(register);
  await chooseGoogle();
  expect(await screen.findByRole('heading', { name: 'Onboarding' })).toBeInTheDocument();
  expect(useAuthStore.getState().user?.id).toBe('google-parent');
  expect(getApiAccessToken()).toBe('google-access');
  expect(sessionStorage.getItem('vietverse_parent_gate_token')).toBeNull();
  expect(useAuthStore.getState().subscription).toBeNull();
  expect(received.find(item => item.url === '/auth/google')?.body).toEqual({ credential: 'google-id-token', nonce: 'a'.repeat(64) });
});

it('asks for the Vietverse password before accepting a link and allows a wrong password retry', async () => {
  linkRequired = true; mount(); await chooseGoogle();
  const password = await screen.findByLabelText('Mật khẩu Vietverse hiện tại');
  expect(useAuthStore.getState().user).toBeNull();
  fireEvent.change(password, { target: { value: 'wrong' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận liên kết' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu Vietverse chưa đúng');
  expect(useAuthStore.getState().user).toBeNull();
  fireEvent.change(password, { target: { value: 'LocalPass123!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận liên kết' }));
  expect(await screen.findByRole('heading', { name: 'Onboarding' })).toBeInTheDocument();
  expect(received.some(item => item.url === '/auth/refresh')).toBe(false);
});

it('reports missing configuration without authenticating', async () => {
  unavailable = true; mount();
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('chưa được cấu hình');
  expect(useAuthStore.getState().user).toBeNull();
  expect(screen.getByRole('button', { name: 'Tiếp tục với Google' })).toBeEnabled();
});

it('ignores a provider callback from an unmounted page', async () => {
  const view = mount();
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
  await screen.findByRole('button', { name: 'Chọn tài khoản Google' });
  view.unmount(); callback({ credential: 'google-id-token' });
  await waitFor(() => expect(received.filter(item => item.url === '/auth/google')).toHaveLength(0));
  expect(useAuthStore.getState().user).toBeNull();
});

it('uses existing children rather than onboarding when Google is chosen on registration', async () => {
  children = [{ _id: 'existing-child', parentId: 'google-parent', name: 'An' }];
  mount(); await chooseGoogle();
  expect(await screen.findByRole('heading', { name: 'Explore' })).toBeInTheDocument();
});

it('routes an existing admin to admin even from registration', async () => {
  role = 'admin'; mount(); await chooseGoogle();
  expect(await screen.findByRole('heading', { name: 'Admin' })).toBeInTheDocument();
});

it('preserves a local content redirect', async () => {
  mount(false, '/auth?redirect=%2Fvan-hoa'); await chooseGoogle();
  expect(await screen.findByRole('heading', { name: 'Culture' })).toBeInTheDocument();
});

it('cancels linking without accepting the session and ignores an old provider callback', async () => {
  linkRequired = true; mount(); await chooseGoogle();
  await screen.findByLabelText('Mật khẩu Vietverse hiện tại');
  fireEvent.click(screen.getByRole('button', { name: 'Hủy đăng nhập Google' }));
  await screen.findByRole('button', { name: 'Tiếp tục với Google' });
  callback({ credential: 'google-id-token' });
  expect(useAuthStore.getState().user).toBeNull();
  expect(received.filter(item => item.url === '/auth/google')).toHaveLength(1);
});

it('orders cookie-writing requests so an abandoned Google response cannot overwrite a newer email login', async () => {
  const adapter = api.defaults.adapter as (config: any) => Promise<any>;
  let releaseGoogle: () => void = () => undefined;
  const pendingGoogle = new Promise<void>(resolve => { releaseGoogle = resolve; });
  let cookieOwner = '';
  let googleStarted = false;
  api.defaults.adapter = async config => {
    if (config.url === '/auth/google') {
      googleStarted = true; await pendingGoogle; cookieOwner = 'google';
    }
    if (config.url === '/auth/login') cookieOwner = 'email';
    return adapter(config);
  };
  const view = mount(); await chooseGoogle();
  await waitFor(() => expect(googleStarted).toBe(true));
  view.unmount();
  const login = useAuthStore.getState().login({ email: 'new@example.test', password: 'NewPassword' });
  await act(async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); });
  const ownerWhileGooglePending = cookieOwner;
  await act(async () => { releaseGoogle(); await login; });
  expect(ownerWhileGooglePending).toBe('');
  expect(cookieOwner).toBe('email');
});
