import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LandingPage } from '../features/public/LandingPage.js';
import { ProtectedRoute } from '../components/ui/ProtectedRoute.js';
import { useAuthStore, type User } from '../store/authStore.js';
import { useUiLanguageStore } from '../i18n/index.js';

const parent: User = { id: 'cta-parent', email: 'cta@example.test', displayName: 'QA Parent', role: 'parent' };
const initialAuth = useAuthStore.getState();
const buttons = [
  { vi: 'BẮT ĐẦU KHÁM PHÁ', en: 'START EXPLORING', path: '/bat-dau' },
  { vi: 'KHÁM PHÁ BÁU VẬT NƯỚC NAM', en: 'EXPLORE THE TREASURE OF VIETNAM', path: '/kham-pha' },
  { vi: 'BẮT ĐẦU KHÁM PHÁ NGAY', en: 'START EXPLORING NOW', path: '/bat-dau' },
] as const;

function Location() {
  const location = useLocation();
  return <output aria-label="Destination">{location.pathname}{location.search}</output>;
}

function renderLanding() {
  return render(
    <MemoryRouter>
      <Location />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dang-ky" element={<h1>Registration</h1>} />
        <Route path="/dang-nhap" element={<h1>Login</h1>} />
        <Route path="/bat-dau" element={<ProtectedRoute><h1>Onboarding</h1></ProtectedRoute>} />
        <Route path="/kham-pha" element={<ProtectedRoute><h1>Discovery</h1></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => useAuthStore.setState({ user: null, isLoading: false }));
afterEach(() => {
  cleanup();
  useAuthStore.setState(initialAuth, true);
});

describe.each(['vi', 'en'] as const)('Landing CTA navigation (%s)', (language) => {
  beforeEach(() => useUiLanguageStore.setState({ manualLanguage: language }));

  it.each(buttons)('sends guests directly to registration from $en', (button) => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: button[language] }));
    expect(screen.getByRole('heading', { name: 'Registration' })).toBeInTheDocument();
    expect(screen.getByLabelText('Destination')).toHaveTextContent(/^\/dang-ky$/);
  });

  it.each(buttons)('preserves the authenticated destination for $en', (button) => {
    useAuthStore.setState({ user: parent });
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: button[language] }));
    expect(screen.getByLabelText('Destination').textContent).toBe(button.path);
    expect(screen.queryByRole('heading', { name: 'Registration' })).not.toBeInTheDocument();
  });

  it.each([null, parent])('waits for bootstrap then uses the resolved session (%j)', (user) => {
    useAuthStore.setState({ isLoading: true });
    renderLanding();
    for (const button of buttons) {
      const cta = screen.getByRole('button', { name: button[language] });
      expect(cta).toBeDisabled();
      fireEvent.click(cta);
      expect(screen.getByLabelText('Destination').textContent).toBe('/');
    }
    act(() => useAuthStore.setState({ user, isLoading: false }));
    const cta = screen.getByRole('button', { name: buttons[1][language] });
    expect(cta).toBeEnabled();
    fireEvent.click(cta);
    expect(screen.getByLabelText('Destination').textContent).toBe(user ? '/kham-pha' : '/dang-ky');
  });
});

it.each(buttons)('uses current auth after logout for $en', (button) => {
  useAuthStore.setState({ user: parent });
  renderLanding();
  act(() => useAuthStore.setState({ user: null }));
  fireEvent.click(screen.getByRole('button', { name: button.vi }));
  expect(screen.getByRole('heading', { name: 'Registration' })).toBeInTheDocument();
});

it.each(buttons)('keeps the authenticated route guarded during a session recheck for $en', (button) => {
  useAuthStore.setState({ user: parent, isLoading: true });
  renderLanding();
  const cta = screen.getByRole('button', { name: button.vi });
  expect(cta).toBeEnabled();
  fireEvent.click(cta);
  expect(screen.getByLabelText('Destination').textContent).toBe(button.path);
  expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  act(() => useAuthStore.setState({ isLoading: false }));
  expect(screen.getByRole('heading', { name: button.path === '/bat-dau' ? 'Onboarding' : 'Discovery' })).toBeInTheDocument();
});

it('keeps discovery cards and contact links unchanged for guests', () => {
  renderLanding();
  expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
    '/kho-truyen', '/kham-pha', '/van-hoa',
    'mailto:vietverseallsatar@gmail.com', 'tel:+84868261075',
  ]);
});
