import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FillBlankActivity } from '../features/lesson-player/activities/FillBlankActivity.js';

afterEach(cleanup);

it.each(['__', '___', '______'])('preserves both sentence parts around a %s blank', marker => {
  const onComplete = vi.fn();
  render(<FillBlankActivity activity={{
    id: 'blank', prompt: 'Choose a word',
    blanks: [{ sentence: `The ${marker} is swimming.`, missing: 'duck' }],
    options: [{ id: 'duck', text: 'duck' }, { id: 'cat', text: 'cat' }],
    correctAnswer: 'duck',
  }} onComplete={onComplete} />);
  expect(screen.getByText('The')).toBeInTheDocument();
  expect(screen.getByText('is swimming.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'duck' }));
  expect(onComplete).toHaveBeenCalledWith(true, 'duck');
  expect(screen.getByText('is swimming.')).toBeInTheDocument();
});
