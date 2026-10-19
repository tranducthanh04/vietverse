import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReviewActivity } from '../features/lesson-player/activities/ReviewActivity.js';
import { FillBlankActivity } from '../features/lesson-player/activities/FillBlankActivity.js';
import { SortOrderActivity } from '../features/lesson-player/activities/SortOrderActivity.js';
import { useChildStore } from '../store/childStore.js';

// Covers the wrong-answer feedback on the three non-listen activities. Unlike ListenChooseActivity
// (which always replays via device voice), these use `canReplay = Boolean(audioUrl)`: a "Nghe lại"
// button and audio replay appear only when the content carries a source audioUrl; otherwise only
// the hint shows. See ListenChooseActivity coverage in wrongAnswerReplay.test.tsx.

let spoken: SpeechSynthesisUtterance[];
let play: ReturnType<typeof vi.spyOn>;

function stubSpeech() {
  spoken = [];
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    getVoices: () => [
      { lang: 'vi-VN', name: 'Vietnamese', voiceURI: 'vi', default: false, localService: true },
    ],
    speak: (utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance);
      utterance.onstart?.(new Event('start') as SpeechSynthesisEvent);
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

beforeEach(() => {
  spoken = [];
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useChildStore.setState({ activeChild: null, children: [] });
});

const hintTranslations = { en: { wrongHint: 'fish' }, ko: { wrongHint: '물고기' } };

// ---------------- ReviewActivity ----------------
const reviewBase = {
  id: 'r1',
  prompt: 'Con vật nào bơi dưới ao?',
  options: [
    { id: 'option-0', text: 'Cá' },
    { id: 'option-1', text: 'Gà' },
  ],
  correctAnswer: 'option-0',
  wrongHint: 'cá',
  wrongHintTranslations: hintTranslations,
};

it('review: shows content hint + companion translation on a wrong answer, no replay without audio', () => {
  stubSpeech();
  useChildStore.setState({ activeChild: { _id: 'c1', companionLanguage: 'en', companionLanguages: ['en'] } as never });
  const onComplete = vi.fn();
  render(<ReviewActivity activity={reviewBase} onComplete={onComplete} />);

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Gà' }));

  expect(onComplete).toHaveBeenCalledWith(false, 'option-1');
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('cá');
  expect(screen.getByText('fish')).toHaveAttribute('lang', 'en');
  // No source audio => no replay and no "Nghe lại" button.
  expect(play).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /nghe lại/i })).not.toBeInTheDocument();
  expect(spoken).toHaveLength(0);
});

it('review: no hint and no replay when answered correctly', () => {
  stubSpeech();
  const onComplete = vi.fn();
  render(<ReviewActivity activity={reviewBase} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: 'Cá' }));
  expect(onComplete).toHaveBeenCalledWith(true, 'option-0');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(play).not.toHaveBeenCalled();
});

it('review: replays the source audio once and offers "Nghe lại" when the content has audioUrl', () => {
  stubSpeech();
  const onComplete = vi.fn();
  render(<ReviewActivity activity={{ ...reviewBase, audioUrl: '/audio/r1.mp3' }} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: 'Gà' }));
  expect(play).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: /nghe lại/i })).toBeInTheDocument();
});

// ---------------- FillBlankActivity ----------------
const fillBase = {
  id: 'f1',
  prompt: 'Chọn phần còn thiếu.',
  blanks: [{ sentence: 'Con __ kêu meo meo.', missing: 'mèo' }],
  options: [
    { id: 'part-0', text: 'mèo' },
    { id: 'part-1', text: 'trâu' },
  ],
  correctAnswer: 'mèo',
  wrongHint: 'mèo',
  wrongHintTranslations: { en: { wrongHint: 'cat' } },
};

it('fill_blank: shows content hint + translation on a wrong answer, no replay without audio', () => {
  stubSpeech();
  useChildStore.setState({ activeChild: { _id: 'c1', companionLanguage: 'en', companionLanguages: ['en'] } as never });
  const onComplete = vi.fn();
  render(<FillBlankActivity activity={fillBase} onComplete={onComplete} />);

  fireEvent.click(screen.getByRole('button', { name: 'trâu' }));

  expect(onComplete).toHaveBeenCalledWith(false, 'trâu');
  expect(screen.getByRole('status')).toHaveTextContent('mèo');
  expect(screen.getByText('cat')).toHaveAttribute('lang', 'en');
  expect(play).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: /nghe lại/i })).not.toBeInTheDocument();
});

it('fill_blank: no hint when answered correctly', () => {
  stubSpeech();
  const onComplete = vi.fn();
  render(<FillBlankActivity activity={fillBase} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: 'mèo' }));
  expect(onComplete).toHaveBeenCalledWith(true, 'mèo');
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

// ---------------- SortOrderActivity ----------------
// No wrongHint on this activity => the generic encouragement should show, with no translation.
const sortBase = {
  id: 's1',
  prompt: 'Xếp để đọc: Con cá.',
  orderedItems: ['Con', 'cá'],
  correctAnswer: ['Con', 'cá'],
};

it('sort_order: shows the generic hint (no content hint) on a wrong order, no replay without audio', () => {
  stubSpeech();
  const onComplete = vi.fn();
  render(<SortOrderActivity activity={sortBase} onComplete={onComplete} />);

  // Tiles render reversed (['cá','Con']); picking them in that order is wrong.
  fireEvent.click(screen.getByRole('button', { name: 'cá' }));
  fireEvent.click(screen.getByRole('button', { name: 'Con' }));

  expect(onComplete).toHaveBeenCalledWith(false, ['cá', 'Con']);
  expect(screen.getByRole('status')).toHaveTextContent(/nghe lại thật kỹ/i);
  // No content translation and no replay button for a plain sort activity without audio.
  expect(screen.queryByText('fish')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /nghe lại/i })).not.toBeInTheDocument();
  expect(play).not.toHaveBeenCalled();
});

it('sort_order: no hint when ordered correctly', () => {
  stubSpeech();
  const onComplete = vi.fn();
  render(<SortOrderActivity activity={sortBase} onComplete={onComplete} />);
  fireEvent.click(screen.getByRole('button', { name: 'Con' }));
  fireEvent.click(screen.getByRole('button', { name: 'cá' }));
  expect(onComplete).toHaveBeenCalledWith(true, ['Con', 'cá']);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
