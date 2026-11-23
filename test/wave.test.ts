import { describe, expect, it } from 'vitest';

import {
  horizonLevel,
  isMorning,
  skyPhase,
  twilightLevels,
  waveElevation,
  waveShape,
} from '../src/astro/wave';
import type { HomeAssistant } from '../src/ha-types';
import { twilightBands, WAVE_HEIGHT, waveY } from '../src/render/wave';
import { formatHour, minutesOfDay } from '../src/utils/time-format';

const HOUR = 3600 * 1000;
const PARIS = { latitude: 48.85, longitude: 2.35 };
const minutes = (date: string) => {
  const d = new Date(date);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

// Paris, summer solstice (UTC): sunrise 03:47, sunset 19:58.
const SUNRISE = new Date('2024-06-21T03:47:00Z');
const SUNSET = new Date('2024-06-21T19:58:00Z');
const NEXT_SUNRISE = new Date('2024-06-22T03:47:00Z');

describe('waveShape', () => {
  it('puts solar noon halfway between sunrise and sunset by day', () => {
    const shape = waveShape({ isDay: true, start: SUNRISE, end: SUNSET });

    expect(shape.noon.toISOString()).toBe('2024-06-21T11:52:30.000Z');
    expect(shape.dayLength).toBe(SUNSET.getTime() - SUNRISE.getTime());
  });

  it('deduces the same noon and day length at night', () => {
    const shape = waveShape({ isDay: false, start: SUNSET, end: NEXT_SUNRISE });

    expect(shape.noon.toISOString()).toBe('2024-06-21T11:52:30.000Z');
    expect(shape.dayLength).toBe(16 * HOUR + 11 * 60 * 1000);
  });
});

describe('wave curve', () => {
  const { noon, dayLength } = waveShape({ isDay: true, start: SUNRISE, end: SUNSET });
  const noonMinutes = minutes(noon.toISOString()) + 0.5;
  const horizon = horizonLevel(dayLength);

  it('crosses the horizon exactly at sunrise and sunset', () => {
    expect(waveElevation(minutes('2024-06-21T03:47:00Z'), noonMinutes)).toBeCloseTo(horizon, 6);
    expect(waveElevation(minutes('2024-06-21T19:58:00Z'), noonMinutes)).toBeCloseTo(horizon, 6);
  });

  it('is above the horizon by day and below at night', () => {
    expect(waveElevation(minutes('2024-06-21T14:00:00Z'), noonMinutes)).toBeGreaterThan(horizon);
    expect(waveElevation(minutes('2024-06-21T23:00:00Z'), noonMinutes)).toBeLessThan(horizon);
  });

  it('lowers the horizon when days are long and raises it when they are short', () => {
    expect(horizonLevel(12 * HOUR)).toBeCloseTo(0, 6);
    expect(horizonLevel(16 * HOUR)).toBeLessThan(0);
    expect(horizonLevel(8 * HOUR)).toBeGreaterThan(0);
    expect(horizonLevel(0)).toBe(1);
    expect(horizonLevel(24 * HOUR)).toBe(-1);
  });

  it('keeps the whole curve inside the drawing', () => {
    expect(waveY(1)).toBeGreaterThanOrEqual(0);
    expect(waveY(-1)).toBeLessThanOrEqual(WAVE_HEIGHT);
  });

  it('tells dawn from dusk', () => {
    expect(isMorning(5 * 60, 12 * 60)).toBe(true);
    expect(isMorning(1 * 60, 12 * 60)).toBe(true);
    expect(isMorning(21 * 60, 12 * 60)).toBe(false);
    expect(isMorning(23 * 60 + 59, 12 * 60)).toBe(false);
  });
});

describe('twilights', () => {
  const winter = waveShape({
    isDay: true,
    start: new Date('2024-12-21T07:42:00Z'),
    end: new Date('2024-12-21T15:56:00Z'),
  });
  const summer = waveShape({ isDay: true, start: SUNRISE, end: SUNSET });

  it('orders the twilight levels below the horizon', () => {
    const horizon = horizonLevel(winter.dayLength);
    const { civil, nautical, astronomical } = twilightLevels(winter.noon, PARIS);

    expect(civil).toBeLessThan(horizon);
    expect(nautical).toBeLessThan(civil!);
    expect(astronomical).toBeLessThan(nautical!);
  });

  it('has no astronomical night in Paris at the summer solstice', () => {
    expect(twilightLevels(summer.noon, PARIS).astronomical).toBeNull();
  });

  it('names the phase of the sky', () => {
    const horizon = horizonLevel(winter.dayLength);
    const levels = twilightLevels(winter.noon, PARIS);

    expect(skyPhase(horizon + 0.1, horizon, levels)).toBe('day');
    expect(skyPhase((horizon + levels.civil!) / 2, horizon, levels)).toBe('civil');
    expect(skyPhase((levels.civil! + levels.nautical!) / 2, horizon, levels)).toBe('nautical');
    expect(skyPhase((levels.nautical! + levels.astronomical!) / 2, horizon, levels)).toBe(
      'astronomical',
    );
    expect(skyPhase(-1, horizon, levels)).toBe('night');
    expect(skyPhase(-1, horizon, twilightLevels(summer.noon, PARIS))).toBe('astronomical');
    expect(skyPhase(horizon - 0.1, horizon)).toBe('night');
  });

  it('draws one band per twilight, then the night', () => {
    const horizon = horizonLevel(winter.dayLength);
    const bands = twilightBands(horizon, twilightLevels(winter.noon, PARIS));

    expect(bands.map((band) => band.kind)).toEqual(['civil', 'nautical', 'astronomical', 'night']);
    expect(bands[0].top).toBeCloseTo(waveY(horizon));
    bands.slice(1).forEach((band, i) => expect(band.top).toBe(bands[i].bottom));
  });

  it('draws no night band when the sun never goes below -18°', () => {
    const horizon = horizonLevel(summer.dayLength);
    const kinds = twilightBands(horizon, twilightLevels(summer.noon, PARIS)).map((b) => b.kind);

    expect(kinds).toEqual(['civil', 'nautical', 'astronomical']);
  });
});

describe('time helpers', () => {
  const hass = (language: string, time_format?: '12' | '24') =>
    ({
      config: { latitude: 0, longitude: 0, time_zone: 'Asia/Tokyo' },
      locale: { language, time_zone: 'server', time_format },
    }) as HomeAssistant;

  it('reads the time of day in the server time zone when the profile asks for it', () => {
    expect(minutesOfDay(new Date('2024-06-21T03:30:00Z'), hass('en'))).toBe(12 * 60 + 30);
  });

  it('formats axis hours following the profile', () => {
    expect(formatHour(18, hass('fr', '24'))).toBe('18 h');
    expect(formatHour(18, hass('en', '12'))).toBe('6 PM');
  });
});
