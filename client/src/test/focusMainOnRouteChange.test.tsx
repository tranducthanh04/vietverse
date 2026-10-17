import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  resetMainFocusTracking,
  useFocusMainOnRouteChange,
} from '../app/useFocusMainOnRouteChange.js';

// A minimal layout that mirrors how the real layouts use the hook: it renders a
// persistent <main id="main-content"> around the routed content and (optionally)
// an open modal dialog.
const Shell: React.FC<{ withModal?: boolean }> = ({ withModal = false }) => {
  useFocusMainOnRouteChange();
  return (
    <>
      <Link to="/a">Tới A</Link>
      <Link to="/a?tab=2">Cùng trang, khác query</Link>
      <Link to="/b">Tới B</Link>
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Routes>
          <Route path="/a" element={<h1>Trang A</h1>} />
          <Route path="/b" element={<h1>Trang B</h1>} />
        </Routes>
      </main>
      {withModal && (
        <div role="dialog" aria-modal="true" aria-label="Hộp thoại">
          <button type="button">Nút trong hộp thoại</button>
        </div>
      )}
    </>
  );
};

function renderAt(path: string, withModal = false) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Shell withModal={withModal} />
    </MemoryRouter>,
  );
}

const mainEl = () => document.getElementById('main-content');

describe('useFocusMainOnRouteChange', () => {
  beforeEach(() => resetMainFocusTracking());
  afterEach(() => cleanup());

  it('leaves focus alone on the first page load', async () => {
    renderAt('/a');
    await screen.findByText('Trang A');
    expect(document.activeElement).not.toBe(mainEl());
  });

  it('moves focus to <main> after a client-side navigation', async () => {
    renderAt('/a');
    await screen.findByText('Trang A');
    expect(document.activeElement).not.toBe(mainEl());

    fireEvent.click(screen.getByText('Tới B'));
    await screen.findByText('Trang B');
    expect(document.activeElement).toBe(mainEl());
  });

  it('does not steal focus from an open modal dialog', async () => {
    renderAt('/a', true);
    await screen.findByText('Trang A');
    const dialogButton = screen.getByText('Nút trong hộp thoại');
    dialogButton.focus();
    expect(document.activeElement).toBe(dialogButton);

    fireEvent.click(screen.getByText('Tới B'));
    await screen.findByText('Trang B');
    // A modal is still open, so focus must stay inside it, not jump to <main>.
    expect(document.activeElement).toBe(dialogButton);
    expect(document.activeElement).not.toBe(mainEl());
  });

  it('ignores query-string changes within the same page', async () => {
    renderAt('/a');
    await screen.findByText('Trang A');
    expect(document.activeElement).not.toBe(mainEl());

    // The pathname does not change, so focus must not move.
    fireEvent.click(screen.getByText('Cùng trang, khác query'));
    await screen.findByText('Trang A');
    expect(document.activeElement).not.toBe(mainEl());
  });
});
