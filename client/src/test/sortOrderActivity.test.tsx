import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SortOrderActivity } from '../features/lesson-player/activities/SortOrderActivity.js';

afterEach(cleanup);

const order = ['Bé', 'thương', 'mẹ'];

it('places each tapped word into a slot and completes correctly when the order matches', () => {
  const onComplete = vi.fn();
  render(<SortOrderActivity activity={{ id: 'sort', prompt: 'Xếp để đọc: Bé thương mẹ.', correctAnswer: order }} onComplete={onComplete} />);

  // The choice tiles start shuffled (reversed); every word is tappable.
  for (const word of order) expect(screen.getByRole('button', { name: word })).toBeInTheDocument();

  // Tapping a word moves it out of the choices and into the next empty slot.
  fireEvent.click(screen.getByRole('button', { name: 'Bé' }));
  expect(screen.queryByRole('button', { name: 'Bé' })).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('button', { name: 'thương' }));
  fireEvent.click(screen.getByRole('button', { name: 'mẹ' }));

  // All three placed in the right order -> graded as correct with the assembled answer.
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledWith(true, ['Bé', 'thương', 'mẹ']);
});

it('reports an incorrect answer when the words are placed out of order', () => {
  const onComplete = vi.fn();
  render(<SortOrderActivity activity={{ id: 'sort', prompt: 'Xếp để đọc', correctAnswer: order }} onComplete={onComplete} />);
  // Shuffled choices render as ['mẹ','thương','Bé']; tapping them left to right is the wrong order.
  fireEvent.click(screen.getByRole('button', { name: 'mẹ' }));
  fireEvent.click(screen.getByRole('button', { name: 'thương' }));
  fireEvent.click(screen.getByRole('button', { name: 'Bé' }));
  expect(onComplete).toHaveBeenCalledWith(false, ['mẹ', 'thương', 'Bé']);
});

it('lets the child clear a partial attempt and try again before it is graded', () => {
  const onComplete = vi.fn();
  render(<SortOrderActivity activity={{ id: 'sort', prompt: 'Xếp để đọc', correctAnswer: order }} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: 'Bé' }));
  fireEvent.click(screen.getByRole('button', { name: 'Xếp lại' }));
  // Every word is available again and nothing has been graded yet.
  for (const word of order) expect(screen.getByRole('button', { name: word })).toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();
});
