import { describe, expect, it } from 'vitest';

import { arcPoint, progressBetween } from '../src/astro/progress';

const start = new Date('2024-06-21T04:00:00Z');
const end = new Date('2024-06-21T20:00:00Z');
const at = (iso: string) => new Date(iso);

describe('progressBetween', () => {
  it('is 0 at start, 0.5 in the middle and 1 at the end', () => {
    expect(progressBetween(start, end, start)).toBe(0);
    expect(progressBetween(start, end, at('2024-06-21T12:00:00Z'))).toBe(0.5);
    expect(progressBetween(start, end, end)).toBe(1);
  });

  it('is clamped outside the interval', () => {
    expect(progressBetween(start, end, at('2024-06-21T01:00:00Z'))).toBe(0);
    expect(progressBetween(start, end, at('2024-06-21T23:00:00Z'))).toBe(1);
  });

  it('returns 0 for an empty or reversed interval', () => {
    expect(progressBetween(end, start, at('2024-06-21T12:00:00Z'))).toBe(0);
    expect(progressBetween(start, start, start)).toBe(0);
  });
});

describe('arcPoint', () => {
  const arc = { cx: 100, cy: 100, r: 80 };

  it('starts on the left, peaks at the top and ends on the right', () => {
    const left = arcPoint(0, arc);
    const top = arcPoint(0.5, arc);
    const right = arcPoint(1, arc);
    expect(left.x).toBeCloseTo(20);
    expect(left.y).toBeCloseTo(100);
    expect(top.x).toBeCloseTo(100);
    expect(top.y).toBeCloseTo(20);
    expect(right.x).toBeCloseTo(180);
    expect(right.y).toBeCloseTo(100);
  });
});
