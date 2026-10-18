import React, { lazy, Suspense } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../app/layouts/PublicLayout.js';
import { resetMainFocusTracking } from '../app/useFocusMainOnRouteChange.js';
import { LandingPage } from '../features/public/LandingPage.js';
import { PricingPage } from '../features/public/PricingPage.js';
import { useAuthStore } from '../store/authStore.js';
import { useUiLanguageStore } from '../i18n/index.js';

const initialAuth = useAuthStore.getState();
const scrollIntoView = vi.fn();
const footer = () => within(screen.getByRole('contentinfo'));
const roadmap = () => document.getElementById('lo-trinh-hoc-tap');

function renderPage(path = '/', landing: React.ReactNode = <LandingPage />) {
  const router = createMemoryRouter([{
    element: <PublicLayout />,
    children: [
      { path: '/', element: landing },
      { path: '/gia', element: <PricingPage /> },
    ],
  }], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  resetMainFocusTracking();
  useAuthStore.setState({ user: null, isLoading: false });
  // jsdom has no layout/scroll implementation; focus and routing remain real.
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
  scrollIntoView.mockClear();
});

afterEach(() => {
  cleanup();
  useAuthStore.setState(initialAuth, true);
  delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
});

describe.each([
  { language: 'vi' as const, courses: 'Khóa học', roadmap: 'Lộ trình học tập', unavailable: 'Chưa khả dụng' },
  { language: 'en' as const, courses: 'Courses', roadmap: 'Learning roadmap', unavailable: 'Coming soon' },
])('public footer ($language)', (copy) => {
  beforeEach(() => useUiLanguageStore.setState({ manualLanguage: copy.language }));

  it('exposes six navigation destinations without removing contact or enabling unavailable legal links', () => {
    renderPage();
    const links = footer().getAllByRole('link');
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/', '/kham-pha', '/#lo-trinh-hoc-tap', '/gia', '/kho-truyen', '/van-hoa',
      'mailto:vietverseallsatar@gmail.com', 'tel:+84868261075',
    ]);
    expect(footer().getAllByText(copy.unavailable)).toHaveLength(4);
  });

  it('takes a guest to the existing public pricing page', () => {
    const router = renderPage();
    fireEvent.click(footer().getByRole('link', { name: copy.courses }));
    expect(router.state.location.pathname).toBe('/gia');
    expect(screen.getByText('250.000đ')).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it.each(['/', '/gia'])('focuses the public five-stage heading from %s', (path) => {
    const router = renderPage(path);
    fireEvent.click(footer().getByRole('link', { name: copy.roadmap }));
    expect(router.state.location.pathname + router.state.location.hash).toBe('/#lo-trinh-hoc-tap');
    expect(roadmap()).toHaveFocus();
    expect(roadmap()?.tagName).toBe('H2');
    expect(roadmap()?.closest('section')?.querySelectorAll('h3')).toHaveLength(5);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
  });

  it('restores heading focus when the same hash link is clicked again', () => {
    renderPage('/#lo-trinh-hoc-tap');
    const link = footer().getByRole('link', { name: copy.roadmap });
    link.focus();
    fireEvent.click(link);
    expect(roadmap()).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it.each(['/', '/#lo-trinh-hoc-tap'])('closes the expanded mobile menu when opening roadmap from %s', (path) => {
    renderPage(path);
    const menu = screen.getByRole('button', { name: copy.language === 'vi' ? 'Mở menu điều hướng' : 'Open navigation menu' });
    fireEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(footer().getByRole('link', { name: copy.roadmap }));
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    expect(roadmap()).toHaveFocus();
  });

  it('supports direct hash entry and back/forward without the layout taking focus', async () => {
    const router = renderPage('/#lo-trinh-hoc-tap');
    expect(roadmap()).toHaveFocus();
    fireEvent.click(footer().getByRole('link', { name: copy.courses }));
    await act(() => router.navigate(-1));
    expect(roadmap()).toHaveFocus();
    await act(() => router.navigate(1));
    expect(router.state.location.pathname).toBe('/gia');
    expect(document.getElementById('main-content')).toHaveFocus();
  });

  it('waits for a delayed Landing mount before focusing the heading', async () => {
    let finish!: (module: { default: typeof LandingPage }) => void;
    const DelayedLanding = lazy(() => new Promise<{ default: typeof LandingPage }>(resolve => { finish = resolve; }));
    renderPage('/#lo-trinh-hoc-tap', <Suspense fallback={<p>Loading fixture</p>}><DelayedLanding /></Suspense>);
    expect(roadmap()).toBeNull();
    expect(scrollIntoView).not.toHaveBeenCalled();
    await act(async () => finish({ default: LandingPage }));
    expect(roadmap()).toHaveFocus();
  });

  it.each(['/', '/#unknown'])('does not hijack focus or scroll on %s', async (path) => {
    const router = renderPage(path);
    expect(roadmap()).not.toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();
    const link = footer().getByRole('link', { name: copy.roadmap });
    link.focus();
    await act(() => router.navigate('/#another-unknown'));
    expect(link).toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
