import { describe, expect, it } from 'vitest';

import { getMoonPhase, moonLitPath } from '../src/astro/moon';

describe('getMoonPhase', () => {
  it('is new on 2024-01-11', () => {
    expect(getMoonPhase(new Date('2024-01-11T11:57:00Z')).fraction).toBeLessThan(0.01);
  });

  it('is a waxing half moon at first quarter (2024-01-18)', () => {
    const phase = getMoonPhase(new Date('2024-01-18T03:53:00Z'));
    expect(phase.waxing).toBe(true);
    expect(phase.fraction).toBeCloseTo(0.5, 1);
  });

  it('is full on 2024-01-25', () => {
    expect(getMoonPhase(new Date('2024-01-25T17:54:00Z')).fraction).toBeGreaterThan(0.99);
  });

  it('is a waning half moon at last quarter (2024-02-02)', () => {
    const phase = getMoonPhase(new Date('2024-02-02T23:18:00Z'));
    expect(phase.waxing).toBe(false);
    expect(phase.fraction).toBeCloseTo(0.5, 1);
  });
});

describe('moonLitPath', () => {
  const crescent = { fraction: 0.25, phase: 0.17, waxing: true };

  it('draws a waxing crescent lit on the right (northern hemisphere)', () => {
    expect(moonLitPath(50, 50, 7, crescent)).toBe(
      'M 50 43 A 7 7 0 0 1 50 57 A 3.5 7 0 0 0 50 43 Z',
    );
  });

  it('mirrors the moon in the southern hemisphere', () => {
    expect(moonLitPath(50, 50, 7, crescent, true)).toBe(
      'M 50 43 A 7 7 0 0 0 50 57 A 3.5 7 0 0 1 50 43 Z',
    );
  });

  it('bulges the terminator towards the dark side when gibbous', () => {
    const gibbous = { fraction: 0.75, phase: 0.33, waxing: true };
    expect(moonLitPath(50, 50, 7, gibbous)).toBe('M 50 43 A 7 7 0 0 1 50 57 A 3.5 7 0 0 1 50 43 Z');
  });

  it('draws a full disk at full moon', () => {
    const full = { fraction: 1, phase: 0.5, waxing: false };
    expect(moonLitPath(50, 50, 7, full)).toBe('M 50 43 A 7 7 0 0 0 50 57 A 7 7 0 0 0 50 43 Z');
  });
});
