import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useUiLanguageStore } from '../i18n/index.js';
import { VictoryModal } from '../components/ui/VictoryModal.js';

vi.mock('canvas-confetti', () => ({ default: () => {} }));

beforeEach(() => {
  useUiLanguageStore.setState({ manualLanguage: 'vi' });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderVictory(stars: number) {
  return render(
    <VictoryModal
      isOpen
      stars={stars}
      pointsEarned={3}
      totalPoints={14}
      passed
      onBackToMap={() => {}}
    />,
  );
}

describe('VictoryModal earned stars', () => {
  it('paints earned stars with the bright marigold token, not the dark brown one', () => {
    const { container } = renderVictory(3);

    // New colour: `secondary-container` (#fea619). The old `fill-secondary` (#855300 brown) is gone.
    expect(container.querySelectorAll('.fill-secondary-container')).toHaveLength(3);
    expect(container.querySelectorAll('.fill-secondary')).toHaveLength(0);
  });

  it('only fills the number of stars earned, leaving the rest in the muted colour', () => {
    const { container } = renderVictory(2);

    expect(container.querySelectorAll('.fill-secondary-container')).toHaveLength(2);
    // The remaining star keeps the muted outline colour, so it is not painted bright.
    expect(container.querySelectorAll('[class*="text-outline-variant"]')).toHaveLength(1);
  });
});
