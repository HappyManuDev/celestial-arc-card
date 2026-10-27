import { describe, expect, it } from 'vitest';

import { getSunPeriod } from '../src/astro/sun';
import type { HassEntity } from '../src/ha-types';

const PARIS = { latitude: 48.85, longitude: 2.35 };
const MINUTE = 60 * 1000;

function sunEntity(state: string, attributes: Record<string, unknown>): HassEntity {
  return {
    entity_id: 'sun.sun',
    state,
    attributes,
    last_changed: '',
    last_updated: '',
  };
}

// Summer solstice in Paris: sunrise ≈ 03:47 UTC, sunset ≈ 19:58 UTC.
const SUNRISE = new Date('2024-06-21T03:47:00Z');
const SUNSET = new Date('2024-06-21T19:58:00Z');
const NEXT_SUNRISE = new Date('2024-06-22T03:47:00Z');

const expectClose = (actual: Date | undefined, expected: Date) =>
  expect(Math.abs(actual!.getTime() - expected.getTime())).toBeLessThan(5 * MINUTE);

describe('getSunPeriod', () => {
  it('spans sunrise to sunset during the day', () => {
    const now = new Date('2024-06-21T12:00:00Z');
    const period = getSunPeriod(
      sunEntity('above_horizon', {
        next_setting: SUNSET.toISOString(),
        next_rising: NEXT_SUNRISE.toISOString(),
      }),
      now,
      PARIS,
    );
    expect(period?.isDay).toBe(true);
    expectClose(period?.start, SUNRISE);
    expect(period?.end).toEqual(SUNSET);
    expect(period?.progress).toBeGreaterThan(0.45);
    expect(period?.progress).toBeLessThan(0.55);
  });

  it('spans sunset to sunrise in the evening', () => {
    const now = new Date('2024-06-21T21:00:00Z');
    const period = getSunPeriod(
      sunEntity('below_horizon', {
        next_rising: NEXT_SUNRISE.toISOString(),
        next_setting: '2024-06-22T19:58:00Z',
      }),
      now,
      PARIS,
    );
    expect(period?.isDay).toBe(false);
    expectClose(period?.start, SUNSET);
    expect(period?.end).toEqual(NEXT_SUNRISE);
  });

  it('finds the previous evening sunset after midnight', () => {
    const now = new Date('2024-06-22T00:30:00Z');
    const period = getSunPeriod(
      sunEntity('below_horizon', {
        next_rising: NEXT_SUNRISE.toISOString(),
        next_setting: '2024-06-22T19:58:00Z',
      }),
      now,
      PARIS,
    );
    expectClose(period?.start, SUNSET);
  });

  it('falls back to "next event minus 24h" without coordinates', () => {
    const now = new Date('2024-06-21T12:00:00Z');
    const period = getSunPeriod(
      sunEntity('above_horizon', {
        next_setting: SUNSET.toISOString(),
        next_rising: NEXT_SUNRISE.toISOString(),
      }),
      now,
    );
    expect(period?.start).toEqual(new Date('2024-06-21T03:47:00Z'));
  });

  it('returns undefined when the next event is unknown (polar day)', () => {
    const now = new Date('2024-06-21T12:00:00Z');
    const period = getSunPeriod(sunEntity('above_horizon', { next_setting: null }), now, {
      latitude: 78.2,
      longitude: 15.6,
    });
    expect(period).toBeUndefined();
  });
});
