import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ListenChooseActivity } from '../features/lesson-player/activities/ListenChooseActivity.js';
import { useChildStore } from '../store/childStore.js';

let spoken: SpeechSynthesisUtterance[];
let cancel: ReturnType<typeof vi.fn>;
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

function stubSpeech() {
  spoken = [];
  cancel = vi.fn();
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
    cancel,
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
  cancel = vi.fn();
  play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useChildStore.setState({ activeChild: null, children: [] });
});

const baseActivity = {
  id: 'q1',
  prompt: 'Con vật nào bơi dưới ao?',
  audioUrl: '/audio/q1.mp3',
  options: [
    { id: 'cá', text: 'Cá' },
    { id: 'gà', text: 'Gà' },
  ],
  correctAnswer: 'cá',
};

it('replays the source audio once and shows a friendly hint when the child answers wrong', () => {
  stubSpeech();
  const onComplete = vi.fn();
  render(<ListenChooseActivity activity={baseActivity} onComplete={onComplete} />);

  // Opening the question autoplays its audio once; no feedback appears before answering.
  expect(play).toHaveBeenCalledTimes(1);
  play.mockClear();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Gà' }));

  expect(onComplete).toHaveBeenCalledWith(false, 'gà');
  // The wrong-answer replay plays the question audio exactly once.
  expect(play).toHaveBeenCalledTimes(1);
  // A friendly generic hint appears in a polite live region, plus a "Nghe lại" button.
  const status = screen.getByRole('status');
  expect(status).toHaveTextContent(/nghe lại thật kỹ/i);
  expect(screen.getByRole('button', { name: /nghe lại/i })).toBeEnabled();
});

it('does not replay or show a hint when the child answers correctly', () => {
  stubSpeech();
  const onComplete = vi.fn();
  render(<ListenChooseActivity activity={baseActivity} onComplete={onComplete} />);

  // Opening the question autoplays its audio once; a correct answer must not replay it.
  expect(play).toHaveBeenCalledTimes(1);
  play.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Cá' }));

  expect(onComplete).toHaveBeenCalledWith(true, 'cá');
  expect(play).not.toHaveBeenCalled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('replays again on each wrong answer, cancelling the previous play so nothing overlaps or loops', () => {
  stubSpeech();
  render(<ListenChooseActivity activity={baseActivity} onComplete={() => {}} />);

  // Opening the question autoplays its audio once; discount that before counting the replays.
  expect(play).toHaveBeenCalledTimes(1);
  play.mockClear();

  // The same option button persists across renders (stable key); selecting it adds an sr-only
  // "Chưa đúng" label, so capture it once and tap it twice.
  const wrongOption = screen.getByRole('button', { name: 'Gà' });
  fireEvent.click(wrongOption);
  fireEvent.click(wrongOption);

  // Two wrong taps → two single plays; each restart pauses the in-flight asset first.
  expect(play).toHaveBeenCalledTimes(2);
  expect(pause).toHaveBeenCalled();
});

it('shows the content hint with the child’s companion-language translation', () => {
  stubSpeech();
  useChildStore.setState({
    activeChild: { _id: 'c1', companionLanguage: 'ko', companionLanguages: ['ko'] } as never,
  });
  render(
    <ListenChooseActivity
      activity={{
        ...baseActivity,
        wrongHint: 'cá',
        wrongHintTranslations: { en: { wrongHint: 'fish' }, ko: { wrongHint: '물고기' } },
      }}
      onComplete={() => {}}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Gà' }));

  const status = screen.getByRole('status');
  expect(status).toHaveTextContent('cá');
  const translated = screen.getByText('물고기');
  expect(translated).toHaveAttribute('lang', 'ko');
  // The child's language is Korean, so the English translation is not shown.
  expect(screen.queryByText('fish')).not.toBeInTheDocument();
});

it('shows a friendly message and disables replay when the device cannot read and has no audio asset', () => {
  // No speechSynthesis stub → the device has no voice; strip the audio asset too.
  const onComplete = vi.fn();
  render(
    <ListenChooseActivity
      activity={{ ...baseActivity, audioUrl: undefined }}
      onComplete={onComplete}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: 'Gà' }));

  expect(onComplete).toHaveBeenCalledWith(false, 'gà');
  // The feedback still appears, with a friendly read-along message and no crash.
  expect(screen.getByRole('button', { name: /nghe lại/i })).toBeDisabled();
  expect(screen.getByText(/cùng đọc trên màn hình/i)).toBeInTheDocument();
});
