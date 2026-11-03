import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ReviewActivity } from '../features/lesson-player/activities/ReviewActivity.js';
import { FillBlankActivity } from '../features/lesson-player/activities/FillBlankActivity.js';
import { SortOrderActivity } from '../features/lesson-player/activities/SortOrderActivity.js';
import { WrongAnswerFeedback } from '../features/lesson-player/activities/WrongAnswerFeedback.js';
import { useChildStore, type ChildProfile } from '../store/childStore.js';
import { useUiLanguageStore } from '../i18n/uiLanguageStore.js';

// Geometry regression lives in verify-wrong-hint-browser.mjs; JSDOM cannot prove wrapping.
// These characterize the content/state contracts the CSS repair must preserve.
const source = '\u1ebf'.repeat(5000);
const translation = 'W'.repeat(5000);
const child: ChildProfile = {
  _id: 'child', parentId: 'parent', name: 'QA', ageGroup: '5-6',
  companionLanguage: 'en', companionLanguages: ['en'], avatarId: 'star',
  viviPoints: 0, level: 1, badges: [], screenTimeLimit: 0,
};
const hint = { wrongHint: source, wrongHintTranslations: { en: { wrongHint: translation } } };
const types = ['review', 'fill_blank', 'sort_order'] as const;
type Kind = typeof types[number];
function activity(kind: Kind, key = 'first') {
  const common = { id: key, prompt: 'QA text question', ...hint };
  const onComplete = vi.fn();
  if (kind === 'sort_order') return <SortOrderActivity key={key} activity={{ ...common, correctAnswer: ['A', 'B'] }} onComplete={onComplete} />;
  const options = [{ id: 'yes', text: 'YES' }, { id: 'no', text: 'NO' }];
  if (kind === 'fill_blank') return <FillBlankActivity key={key} activity={{ ...common, options, correctAnswer: 'yes', blanks: [{ sentence: 'QA __.', missing: 'YES' }] }} onComplete={onComplete} />;
  return <ReviewActivity key={key} activity={{ ...common, options, correctAnswer: 'yes' }} onComplete={onComplete} />;
}
function answerWrong(kind: Kind) {
  for (const name of kind === 'sort_order' ? ['B', 'A'] : ['NO']) fireEvent.click(screen.getByRole('button', { name }));
}
beforeEach(() => {
  useChildStore.setState({ activeChild: child, children: [child] });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => { throw new Error('Audio outside text-only test scope'); });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); useChildStore.setState({ activeChild: null, children: [] }); });

describe.each(types)('%s long text feedback contracts', kind => {
  it('keeps all 5000 characters of source and selected translation in a polite status', () => {
    useUiLanguageStore.setState({ manualLanguage: 'en' });
    render(activity(kind));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    answerWrong(kind);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(source).textContent).toBe(source);
    expect(screen.getByText(translation).textContent).toBe(translation);
    expect(screen.getByText(translation)).toHaveAttribute('lang', 'en');
    expect(document.querySelector('audio,video')).toBeNull();
    expect(screen.getByRole('status').querySelector('button')).toBeNull();
  });
  it('clears old feedback when the player mounts the next activity key', () => {
    const view = render(activity(kind)); answerWrong(kind);
    expect(screen.getByRole('status')).toBeInTheDocument();
    view.rerender(activity(kind, 'next'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

it.each(['review', 'fill_blank'] as const)('%s removes long feedback after correction', kind => {
  render(activity(kind)); answerWrong(kind);
  fireEvent.click(screen.getByRole('button', { name: 'YES' }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it.each(['en', 'ja', 'ko', 'zh', 'fr'] as const)('preserves selected %s language and full fixture text', lang => {
  useChildStore.setState({ activeChild: { ...child, companionLanguages: [lang] } });
  const text = (`SYNTHETIC-${lang}-` + translation).slice(0, 5000);
  render(<WrongAnswerFeedback show activity={{ id: 'locale', wrongHint: source, wrongHintTranslations: { [lang]: { wrongHint: text } } }} />);
  expect(screen.getByText(text)).toHaveAttribute('lang', lang);
  expect(screen.getByText(source).textContent).toBe(source);
});

it('skips other, missing and blank preferences, rendering only the first available translation', () => {
  useChildStore.setState({ activeChild: { ...child, companionLanguages: ['other', 'ko', 'ja', 'fr', 'en'] } });
  render(<WrongAnswerFeedback show activity={{ id: 'priority', wrongHint: source, wrongHintTranslations: {
    ja: { wrongHint: '  ' }, fr: { wrongHint: 'Synthetic French fixture' }, en: { wrongHint: translation },
  } }} />);
  expect(screen.getByText('Synthetic French fixture')).toHaveAttribute('lang', 'fr');
  expect(screen.queryByText(translation)).not.toBeInTheDocument();
});

it('supports the legacy singular companion language', () => {
  useChildStore.setState({ activeChild: { ...child, companionLanguages: undefined } });
  render(<WrongAnswerFeedback show activity={{ id: 'legacy', ...hint }} />);
  expect(screen.getByText(translation)).toHaveAttribute('lang', 'en');
});

it.each(['no-child', 'missing', 'other'] as const)('keeps source without translation for %s', reason => {
  useChildStore.setState({ activeChild: reason === 'no-child' ? null : { ...child, companionLanguages: [reason === 'other' ? 'other' : 'ja'] } });
  render(<WrongAnswerFeedback show activity={{ id: 'absent', ...hint }} />);
  expect(screen.getByText(source).textContent).toBe(source);
  expect(screen.getByRole('status').querySelector('[lang]')).toBeNull();
});

it.each([
  ['vi', undefined, 'Ch\u01b0a \u0111\u00fang r\u1ed3i, b\u00e9 nghe l\u1ea1i th\u1eadt k\u1ef9 nh\u00e9!'],
  ['en', '   ', 'Not quite yet \u2014 listen again carefully!'],
] as const)('preserves %s generic fallback and suppresses orphan translation', (lang, wrongHint, expected) => {
  useUiLanguageStore.setState({ manualLanguage: lang });
  render(<WrongAnswerFeedback show activity={{ id: 'generic', wrongHint, wrongHintTranslations: hint.wrongHintTranslations }} />);
  expect(screen.getByRole('status')).toHaveTextContent(expected);
  expect(screen.getByRole('status').querySelector('[lang]')).toBeNull();
});
