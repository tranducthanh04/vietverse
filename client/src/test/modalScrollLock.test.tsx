import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Modal } from '../components/ui/Modal.js';

const noop = () => {};

// The screen-time break and the Parent Gate open together; extending the session closes both in one commit.
const Nested: React.FC<{ outer: boolean; inner: boolean }> = ({ outer, inner }) => (
  <>
    <Modal isOpen={outer} onClose={noop} ariaLabel="Nghỉ mắt">
      <p>outer</p>
    </Modal>
    <Modal isOpen={inner} onClose={noop} ariaLabel="Cổng phụ huynh">
      <p>inner</p>
    </Modal>
  </>
);

describe('Modal body scroll lock', () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = '';
  });

  it('unlocks scrolling when nested modals close in the same commit', () => {
    const view = render(<Nested outer inner={false} />);
    view.rerender(<Nested outer inner />);
    expect(document.body.style.overflow).toBe('hidden');

    view.rerender(<Nested outer={false} inner={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps the page locked while an outer modal stays open', () => {
    const view = render(<Nested outer inner />);
    view.rerender(<Nested outer inner={false} />);
    expect(document.body.style.overflow).toBe('hidden');

    view.rerender(<Nested outer={false} inner={false} />);
    expect(document.body.style.overflow).toBe('');
  });
});
