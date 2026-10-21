import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useChildStore } from '../store/childStore.js';
import { useUiLanguageStore } from '../i18n/index.js';
import { ScreenTimeGuard } from '../components/ScreenTimeGuard.js';

// The real Parent Gate loads a signed math challenge over the network; swap it for a stub that
// resolves instantly so the "parent unlocks early" path can be driven without async/timer juggling.
vi.mock('../features/parent/ParentGateModal.js', () => ({
  ParentGateModal: ({ isOpen, onSuccess }: { isOpen: boolean; onSuccess: () => void }) =>
    isOpen ? (
      <button type="button" onClick={onSuccess}>stub-parent-gate-success</button>
    ) : null,
}));

const CHILD_ID = 'child-1';
const LIMIT = 20;
const REST_KEY = `vietverse_rest_until_${CHILD_ID}`;
const SESSION_KEY = `vietverse_session_start_${CHILD_ID}`;

function setChild(overrides: Record<string, unknown> = {}) {
  useChildStore.setState({
    activeChild: {
      _id: CHILD_ID,
      parentId: 'p',
      name: 'Bé Na',
      ageGroup: '5-6',
      companionLanguage: 'en',
      avatarId: '',
      viviPoints: 0,
      level: 1,
      badges: [],
      ownedItemIds: [],
      screenTimeLimit: LIMIT,
      ...overrides,
    } as never,
  });
}

/** Pretend the continuous session has already exceeded the limit so the rest prompt shows on mount. */
function exceedSession() {
  sessionStorage.setItem(SESSION_KEY, String(Date.now() - (LIMIT + 1) * 60000));
}

function renderGuard() {
  return render(
    <ScreenTimeGuard>
      <div>Learning content</div>
    </ScreenTimeGuard>,
  );
}

function clickTakeBreak() {
  fireEvent.click(screen.getByRole('button', { name: "Let's take a break" }));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T08:00:00Z'));
  localStorage.clear();
  sessionStorage.clear();
  useUiLanguageStore.setState({ manualLanguage: 'en' });
  setChild();
});

afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  useChildStore.setState({ activeChild: null } as never);
});

describe('ScreenTimeGuard rest countdown', () => {
  it('shows 5:00 on break start and 4:00 after one minute', () => {
    exceedSession();
    renderGuard();
    clickTakeBreak();

    expect(screen.getByText('5:00')).toBeTruthy();
    expect(screen.queryByText('Learning content')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText('4:00')).toBeTruthy();
  });

  it('unlocks after 5 minutes and resets the session start to now', () => {
    exceedSession();
    renderGuard();
    const baseline = Date.now();
    clickTakeBreak();

    act(() => {
      vi.advanceTimersByTime(5 * 60000);
    });

    expect(screen.getByText('Learning content')).toBeTruthy();
    expect(screen.queryByText('5:00')).toBeNull();
    expect(localStorage.getItem(REST_KEY)).toBeNull();
    expect(Number(sessionStorage.getItem(SESSION_KEY))).toBe(baseline + 5 * 60000);
  });

  it('stays on the break with the right time left after a remount while the break is active', () => {
    exceedSession();
    const first = renderGuard();
    clickTakeBreak();
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText('4:00')).toBeTruthy();

    first.unmount();
    renderGuard();

    expect(screen.getByText('4:00')).toBeTruthy();
    expect(screen.queryByText('Learning content')).toBeNull();
  });

  it('lets the child learn normally when the stored break deadline has already passed', () => {
    setChild({ screenTimeLimit: 0 });
    localStorage.setItem(REST_KEY, String(Date.now() - 1000));
    renderGuard();

    expect(screen.getByText('Learning content')).toBeTruthy();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('keeps counting in memory when localStorage throws', () => {
    exceedSession();
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    renderGuard();
    clickTakeBreak();

    expect(screen.getByText('5:00')).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(screen.getByText('4:00')).toBeTruthy();
  });

  it('clears the break when a parent unlocks early through the Parent Gate', () => {
    exceedSession();
    renderGuard();
    clickTakeBreak();
    expect(localStorage.getItem(REST_KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Parents add more time' }));
    fireEvent.click(screen.getByRole('button', { name: 'stub-parent-gate-success' }));

    expect(screen.getByText('Learning content')).toBeTruthy();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(localStorage.getItem(REST_KEY)).toBeNull();
  });
});
