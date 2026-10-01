import { describe, it, expect } from 'vitest';
import { useChildStore } from '../store/childStore.js';

describe('Child Store Points and Profile Logic', () => {
  it('should update points locally for active child and children list', () => {
    const mockChild: any = {
      _id: 'child_123',
      name: 'Bé An',
      viviPoints: 10,
      ageGroup: '5-6',
      level: 1,
    };

    useChildStore.setState({
      children: [mockChild],
      activeChild: mockChild,
    });

    useChildStore.getState().updatePointsLocally(45);

    expect(useChildStore.getState().activeChild?.viviPoints).toBe(45);
    expect(useChildStore.getState().children[0].viviPoints).toBe(45);
  });
});
