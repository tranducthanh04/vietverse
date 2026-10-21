import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ListenChooseActivity } from '../features/lesson-player/activities/ListenChooseActivity.js';
import { useChildStore } from '../store/childStore.js';

// The speaker on a listen-and-choose question must read the audio clip (targetWord) — the sentence the
// child has to identify — not the question text. Only when there is no targetWord does it fall back to
// reading the prompt. This guards the production bug where "Con nghe thấy ai?" was spoken instead of the
// "Đây là mẹ." clip, leaving the child nothing to listen to.

let spoken: string[];
function stubSpeech() {
  spoken = [];
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string;
      lang = '';
      voice: unknown = null;
      rate = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    getVoices: () => [{ lang: 'vi-VN', name: 'Vietnamese', voiceURI: 'vi', default: false, localService: true }],
    speak: vi.fn((utterance: { text: string }) => {
      spoken.push(utterance.text);
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

beforeEach(() => {
  stubSpeech();
  useChildStore.setState({ activeChild: null, children: [] });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useChildStore.setState({ activeChild: null, children: [] });
});

const base = {
  id: 'l1',
  prompt: 'Con nghe thấy ai?',
  correctAnswer: 'opt-0',
  options: [
    { id: 'opt-0', text: 'mẹ' },
    { id: 'opt-1', text: 'bố' },
    { id: 'opt-2', text: 'bà' },
  ],
};

// The speaker is the first button in the component (rendered above the answer options).
const clickSpeaker = () => fireEvent.click(screen.getAllByRole('button')[0]);

describe('ListenChooseActivity speaker source', () => {
  it('reads the targetWord clip, not the question, when there is no audioUrl', () => {
    render(<ListenChooseActivity activity={{ ...base, targetWord: 'Đây là mẹ.' }} onComplete={vi.fn()} />);
    clickSpeaker();
    expect(spoken).toContain('Đây là mẹ.');
    expect(spoken).not.toContain('Con nghe thấy ai?');
  });

  it('falls back to the prompt when the activity has no targetWord', () => {
    render(<ListenChooseActivity activity={base} onComplete={vi.fn()} />);
    clickSpeaker();
    expect(spoken).toContain('Con nghe thấy ai?');
  });

  it('ignores an empty targetWord and reads the prompt', () => {
    render(<ListenChooseActivity activity={{ ...base, targetWord: '' }} onComplete={vi.fn()} />);
    clickSpeaker();
    expect(spoken).toContain('Con nghe thấy ai?');
  });
});
