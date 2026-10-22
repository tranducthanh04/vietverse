import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WordCardActivity } from '../features/lesson-player/activities/WordCardActivity.js';
import { ListenChooseActivity } from '../features/lesson-player/activities/ListenChooseActivity.js';
import { ReviewActivity } from '../features/lesson-player/activities/ReviewActivity.js';
import { NewActivityFrame } from '../features/lesson-player/activities/NewActivityFrame.js';
import type { NewLearnerActivity } from '../features/lesson-player/activities/newActivity.types.js';
import { useChildStore } from '../store/childStore.js';

// The reviewed question translation shows under the Vietnamese prompt, in the child's first chosen
// support language that has one, for every activity type with a question; audio still reads Vietnamese.

function stubSpeech() {
  vi.stubGlobal('SpeechSynthesisUtterance', class { text: string; constructor(text: string) { this.text = text; } });
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    getVoices: () => [{ lang: 'vi-VN', name: 'Vietnamese', voiceURI: 'vi', default: false, localService: true }],
    speak: vi.fn(),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

function setChild(companionLanguages: string[] | null) {
  if (companionLanguages === null) {
    useChildStore.setState({ activeChild: null, children: [] });
  } else {
    useChildStore.setState({
      activeChild: { _id: 'c1', companionLanguage: companionLanguages[0], companionLanguages } as never,
      children: [],
    });
  }
}

const vi_prompt = 'Con vật nào bơi dưới ao?';
const en_prompt = 'Which animal swims in the pond?';
const ja_prompt = '池で泳ぐ動物は？';
const promptTranslations = { en: en_prompt, ja: ja_prompt };

beforeEach(() => {
  stubSpeech();
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  useChildStore.setState({ activeChild: null, children: [] });
});

const wordCard = { id: 'w1', prompt: vi_prompt, targetWord: 'cá', promptTranslations };
const listenChoose = {
  id: 'l1', prompt: vi_prompt, correctAnswer: 'ca',
  options: [{ id: 'ca', text: 'Cá' }, { id: 'ga', text: 'Gà' }], promptTranslations,
};
const review = {
  id: 'r1', prompt: vi_prompt, correctAnswer: 'ca',
  options: [{ id: 'ca', text: 'Cá' }, { id: 'ga', text: 'Gà' }], promptTranslations,
};
const newActivity: NewLearnerActivity = { id: 'm1', type: 'multi_select', prompt: vi_prompt, promptTranslations, options: [] };

const renderers: Array<[string, () => void]> = [
  ['word_card', () => render(<WordCardActivity activity={wordCard} onComplete={vi.fn()} />)],
  ['listen_choose', () => render(<ListenChooseActivity activity={listenChoose} onComplete={vi.fn()} />)],
  ['review', () => render(<ReviewActivity activity={review} onComplete={vi.fn()} />)],
  ['new-activity frame', () => render(<NewActivityFrame activity={newActivity}><div /></NewActivityFrame>)],
];

describe('Prompt translation under the question', () => {
  it.each(renderers)('%s: shows the chosen language translation under the Vietnamese question', (_name, renderIt) => {
    setChild(['en']);
    renderIt();
    expect(screen.getByText(vi_prompt)).toBeInTheDocument();
    const translation = screen.getByText(en_prompt);
    expect(translation).toHaveAttribute('lang', 'en');
    expect(screen.queryByText(ja_prompt)).not.toBeInTheDocument();
  });

  it.each(renderers)('%s: shows nothing extra when no child is selected', (_name, renderIt) => {
    setChild(null);
    renderIt();
    expect(screen.getByText(vi_prompt)).toBeInTheDocument();
    expect(screen.queryByText(en_prompt)).not.toBeInTheDocument();
    expect(screen.queryByText(ja_prompt)).not.toBeInTheDocument();
  });

  it('shows nothing when the chosen language has no translation', () => {
    setChild(['ko']); // promptTranslations has only en/ja
    render(<WordCardActivity activity={wordCard} onComplete={vi.fn()} />);
    expect(screen.getByText(vi_prompt)).toBeInTheDocument();
    expect(screen.queryByText(en_prompt)).not.toBeInTheDocument();
    expect(screen.queryByText(ja_prompt)).not.toBeInTheDocument();
  });

  it('shows nothing when the activity has no translations at all', () => {
    setChild(['en']);
    render(<WordCardActivity activity={{ id: 'w2', prompt: vi_prompt, targetWord: 'cá' }} onComplete={vi.fn()} />);
    expect(screen.getByText(vi_prompt)).toBeInTheDocument();
    expect(screen.queryByText(en_prompt)).not.toBeInTheDocument();
  });

  it('picks the first chosen language that has a translation, skipping ones without and "other"', () => {
    setChild(['other', 'ko', 'ja', 'en']); // ko has none; ja is the first with a translation
    render(<WordCardActivity activity={wordCard} onComplete={vi.fn()} />);
    const translation = screen.getByText(ja_prompt);
    expect(translation).toHaveAttribute('lang', 'ja');
    expect(screen.queryByText(en_prompt)).not.toBeInTheDocument();
  });
});
