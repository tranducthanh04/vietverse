import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RegisterPage } from '../features/auth/RegisterPage.js';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { VI_LOCALES } from '../locales/vi.js';

const originalAdapter = api.defaults.adapter;
let submissions: unknown[];
beforeEach(() => {
  submissions = [];
  useAuthStore.setState({ user: null, accessToken: null, isLoading: false });
  api.defaults.adapter = async config => {
    submissions.push(JSON.parse(config.data));
    return {
      data: { data: { user: { id: 'parent', email: 'parent@example.test', displayName: 'Parent', role: 'parent' }, accessToken: 'test-only' } },
      status: 201, statusText: 'Created', headers: {}, config,
    };
  };
});
afterEach(() => { cleanup(); api.defaults.adapter = originalAdapter; });

it('rejects a mismatched password before registration and lets matching passwords reach onboarding', async () => {
  render(<MemoryRouter initialEntries={['/register']}><Routes>
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/bat-dau" element={<h1>Onboarding</h1>} />
  </Routes></MemoryRouter>);
  fireEvent.change(screen.getByPlaceholderText(VI_LOCALES.auth.displayNamePlaceholder), { target: { value: 'Parent' } });
  fireEvent.change(screen.getByPlaceholderText(VI_LOCALES.auth.emailPlaceholder), { target: { value: 'parent@example.test' } });
  fireEvent.change(screen.getByPlaceholderText(VI_LOCALES.auth.passwordPlaceholder), { target: { value: 'Secret123!' } });
  const confirmation = screen.getByLabelText('Xác nhận mật khẩu');
  fireEvent.change(confirmation, { target: { value: 'different' } });
  fireEvent.click(screen.getByRole('button', { name: VI_LOCALES.auth.registerBtn }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Mật khẩu xác nhận chưa khớp');
  expect(submissions).toHaveLength(0);
  fireEvent.change(confirmation, { target: { value: 'Secret123!' } });
  fireEvent.click(screen.getByRole('button', { name: VI_LOCALES.auth.registerBtn }));
  expect(await screen.findByRole('heading', { name: 'Onboarding' })).toBeInTheDocument();
  expect(submissions).toEqual([{ displayName: 'Parent', email: 'parent@example.test', password: 'Secret123!' }]);
});
