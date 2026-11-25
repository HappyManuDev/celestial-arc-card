import { getMoonTimes, getTimes } from 'suncalc';
import { describe, expect, it } from 'vitest';

import { altitude, altitudeCurve, crossings, isUp, SKY_STEP_MINUTES } from '../src/astro/sky';
import { HORIZON_Y, skyScale, spreadLabels } from '../src/render/sky';

const PARIS = { latitude: 48.85, longitude: 2.35 };
const TROMSO = { latitude: 69.65, longitude: 18.96 };
const MINUTE = 60 * 1000;

describe('altitudeCurve', () => {
  it('samples a whole day every 10 minutes', () => {
    const curve = altitudeCurve('sun', new Date('2024-06-20T22:00:00Z'), PARIS);

    expect(curve).toHaveLength((24 * 60) / SKY_STEP_MINUTES + 1);
    expect(curve[0].minutes).toBe(0);
    expect(curve.at(-1)!.minutes).toBe(24 * 60);
  });

  it('peaks around 64° at noon on the summer solstice in Paris', () => {
    const curve = altitudeCurve('sun', new Date('2024-06-20T22:00:00Z'), PARIS);
    const highest = Math.max(...curve.map((s) => s.altitude));

    expect(highest).toBeGreaterThan(63);
    expect(highest).toBeLessThan(66);
  });
});

describe('crossings', () => {
  it('finds sunrise and sunset close to suncalc', () => {
    const start = new Date('2024-06-20T22:00:00Z');
    const events = crossings('sun', start, new Date(start.getTime() + 24 * 60 * MINUTE), PARIS);
    const times = getTimes(new Date('2024-06-21T12:00:00Z'), PARIS.latitude, PARIS.longitude);

    expect(events.map((e) => e.rising)).toEqual([true, false]);
    expect(Math.abs(events[0].time.getTime() - times.sunrise!.getTime())).toBeLessThan(MINUTE);
    expect(Math.abs(events[1].time.getTime() - times.sunset!.getTime())).toBeLessThan(MINUTE);
  });

  it('finds moonrise and moonset close to suncalc', () => {
    const start = new Date('2026-11-24T23:00:00Z');
    const end = new Date(start.getTime() + 24 * 60 * MINUTE);
    const events = crossings('moon', start, end, PARIS);
    const times = getMoonTimes(start, PARIS.latitude, PARIS.longitude, 60);

    for (const event of events) {
      const reference = event.rising ? times.rise : times.set;
      if (reference && reference >= start && reference <= end) {
        expect(Math.abs(event.time.getTime() - reference.getTime())).toBeLessThan(MINUTE);
      }
    }
    expect(events.length).toBeGreaterThan(0);
  });

  it('finds nothing during the polar night', () => {
    const start = new Date('2024-12-20T23:00:00Z');
    const end = new Date(start.getTime() + 24 * 60 * MINUTE);

    expect(crossings('sun', start, end, TROMSO)).toEqual([]);
    expect(isUp('sun', new Date('2024-12-21T11:00:00Z'), TROMSO)).toBe(false);
  });
});

describe('isUp', () => {
  it('matches the sign of the altitude away from the horizon', () => {
    const noon = new Date('2024-06-21T12:00:00Z');
    const midnight = new Date('2024-06-21T23:00:00Z');

    expect(isUp('sun', noon, PARIS)).toBe(true);
    expect(altitude('sun', noon, PARIS)).toBeGreaterThan(0);
    expect(isUp('sun', midnight, PARIS)).toBe(false);
  });
});

describe('sky drawing', () => {
  it('keeps the horizon fixed and the highest point inside the drawing', () => {
    const y = skyScale([[{ minutes: 0, altitude: 64 }]]);

    expect(y(0)).toBe(HORIZON_Y);
    expect(y(64)).toBeGreaterThan(0);
    expect(y(64)).toBeLessThan(HORIZON_Y);
  });

  it('keeps labels under their events when there is room', () => {
    expect(spreadLabels([100, 250], [43, 43], 400)).toEqual([100, 250]);
  });

  it('pushes apart the labels of close events, around their middle', () => {
    const [a, b] = spreadLabels([179, 205], [43, 43], 400);

    expect(b - a).toBeGreaterThanOrEqual(43 + 6);
    expect((a + b) / 2).toBeCloseTo(192);
  });

  it('keeps pushed labels inside the card', () => {
    const [a, b] = spreadLabels([385, 395], [43, 43], 400);

    expect(b).toBeLessThanOrEqual(400 - 43 / 2);
    expect(b - a).toBeGreaterThanOrEqual(43 + 6);
  });
});
