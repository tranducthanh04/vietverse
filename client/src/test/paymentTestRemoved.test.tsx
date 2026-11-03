import type { ReactNode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { router } from '../app/router.js';
import { pageTitleFor } from '../app/pageTitles.js';
import { ParentLayout } from '../app/layouts/ParentLayout.js';
import { AdminLayout } from '../app/layouts/AdminLayout.js';
import { useAuthStore, type User } from '../store/authStore.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';

const initialAuth = useAuthStore.getState();
const initialChildren = useChildStore.getState();

const adminUser: User = { id: 'admin-1', email: 'admin@vietverse.edu.vn', displayName: 'Admin', role: 'admin' };
const parentUser: User = { id: 'parent-1', email: 'parent@vietverse.edu.vn', displayName: 'Phụ huynh', role: 'parent' };
const child: ChildProfile = { _id: 'c1', parentId: 'parent-1', name: 'An', ageGroup: '5-6', companionLanguage: 'vi', avatarId: 'star', viviPoints: 0, level: 1, badges: [], screenTimeLimit: 0 };

/** Collects every `path` declared across the real router tree. */
function allRoutePaths(routes: RouteObject[], out: string[] = []): string[] {
  for (const route of routes) {
    if (route.path !== undefined) out.push(route.path);
    if (route.children) allRoutePaths(route.children, out);
  }
  return out;
}

function renderAt(path: string, element: ReactNode) {
  const memory = createMemoryRouter(
    [{ path, element, children: [{ index: true, element: <div data-testid="outlet" /> }] }],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={memory} />);
}

afterEach(() => {
  cleanup();
  useAuthStore.setState(initialAuth, true);
  useChildStore.setState(initialChildren, true);
  sessionStorage.clear();
});

describe('PayOS test payment is fully removed (decision 2026-11-03)', () => {
  it('declares no payment-test route anywhere in the router', () => {
    const paths = allRoutePaths(router.routes as RouteObject[]);
    expect(paths).not.toContain('thanh-toan-thu');
    expect(paths).not.toContain('/thanh-toan-thu');
    expect(paths).not.toContain('test-thanh-toan');
  });

  it('drops the dedicated payment-test tab titles', () => {
    const notFound = pageTitleFor('/khong-ton-tai');
    // The standalone parent routes are gone entirely, so their paths get the not-found title.
    expect(pageTitleFor('/thanh-toan-thu')).toBe(notFound);
    expect(pageTitleFor('/phu-huynh/thanh-toan-thu')).toBe(notFound);
    // `/admin/test-thanh-toan` no longer has its own title entry; it falls back to the generic
    // admin overview prefix (the route itself is gone, so the page renders NotFound).
    expect(pageTitleFor('/admin/test-thanh-toan')).not.toContain('Test thanh toán');
  });

  describe('ParentLayout tabs', () => {
    beforeEach(() => {
      // A valid parent-gate token keeps the layout mounted instead of redirecting to /kham-pha.
      sessionStorage.setItem('vietverse_parent_gate_token', 'token');
      sessionStorage.setItem('vietverse_parent_gate_unlocked', String(Date.now() + 60_000));
      useAuthStore.setState({ user: parentUser, isLoading: false });
      useChildStore.setState({ children: [child], activeChild: child, isLoading: false });
    });

    it('shows the three parent tabs and no payment-test tab', () => {
      renderAt('/phu-huynh', <ParentLayout />);
      expect(screen.getByRole('link', { name: /Tiến độ/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Bản thu âm/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Cài đặt/ })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /thanh toán/i })).not.toBeInTheDocument();
    });
  });

  describe('AdminLayout nav', () => {
    beforeEach(() => {
      useAuthStore.setState({ user: adminUser, isLoading: false });
    });

    it('no longer offers any test-payment destination', () => {
      renderAt('/admin', <AdminLayout />);
      expect(screen.queryByRole('link', { name: /thanh toán/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /test-thanh-toan/i })).not.toBeInTheDocument();
    });
  });
});
