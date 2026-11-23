import { getTimes } from 'suncalc';

import { clamp01 } from './progress';
import type { SunPeriod } from './sun';

const DAY_MS = 24 * 3600 * 1000;
export const MINUTES_PER_DAY = 24 * 60;

export interface WaveShape {
  /** Solar noon of the current day/night cycle. */
  noon: Date;
  /** Day length (sunrise → sunset) of that cycle, in milliseconds. */
  dayLength: number;
}

/**
 * Solar noon and day length deduced from the current period.
 * By day, noon is halfway between sunrise and sunset. By night, solar
 * midnight is halfway between sunset and sunrise, and noon 12 hours away.
 */
export function waveShape({
  isDay,
  start,
  end,
}: Pick<SunPeriod, 'isDay' | 'start' | 'end'>): WaveShape {
  const duration = end.getTime() - start.getTime();
  const middle = start.getTime() + duration / 2;
  return isDay
    ? { noon: new Date(middle), dayLength: duration }
    : { noon: new Date(middle - DAY_MS / 2), dayLength: Math.max(0, DAY_MS - duration) };
}

/**
 * Normalized elevation (-1 → 1) of the sun `minutes` after midnight, for a
 * solar noon at `noonMinutes`: a cosine peaking at noon.
 */
export function waveElevation(minutes: number, noonMinutes: number): number {
  return Math.cos((2 * Math.PI * (minutes - noonMinutes)) / MINUTES_PER_DAY);
}

/**
 * Level of the horizon on the normalized curve: the curve crosses it exactly
 * `dayLength / 2` before and after noon, i.e. at sunrise and sunset.
 * 0 for a 12-hour day, negative when days are longer, positive when shorter.
 */
export function horizonLevel(dayLength: number): number {
  return Math.cos(Math.PI * clamp01(dayLength / DAY_MS));
}

export const TWILIGHTS = ['civil', 'nautical', 'astronomical'] as const;
export type Twilight = (typeof TWILIGHTS)[number];
export type SkyPhase = 'day' | Twilight | 'night';

/**
 * Lowest level of each twilight on the normalized curve (sun at -6°, -12°,
 * -18°), read from the time it ends in the evening: the curve reaches that
 * level at that time. null when the sun never goes that low (e.g. no
 * astronomical night around the summer solstice at mid latitudes).
 */
export type TwilightLevels = Record<Twilight, number | null>;

const DUSK_EVENTS = { civil: 'dusk', nautical: 'nauticalDusk', astronomical: 'night' } as const;

export function twilightLevels(
  noon: Date,
  { latitude, longitude }: { latitude: number; longitude: number },
): TwilightLevels {
  const times = getTimes(noon, latitude, longitude);
  const level = (time?: Date | null): number | null =>
    time && Number.isFinite(time.getTime())
      ? Math.cos((2 * Math.PI * (time.getTime() - noon.getTime())) / DAY_MS)
      : null;
  return {
    civil: level(times[DUSK_EVENTS.civil]),
    nautical: level(times[DUSK_EVENTS.nautical]),
    astronomical: level(times[DUSK_EVENTS.astronomical]),
  };
}

/** Day, one of the twilights, or night, for a point of the curve. */
export function skyPhase(elevation: number, horizon: number, levels?: TwilightLevels): SkyPhase {
  if (elevation >= horizon) return 'day';
  if (!levels) return 'night';
  return (
    TWILIGHTS.find((twilight) => levels[twilight] === null || elevation >= levels[twilight]!) ??
    'night'
  );
}

/** True between solar midnight and solar noon (dawn rather than dusk). */
export function isMorning(minutes: number, noonMinutes: number): boolean {
  const delta = (((minutes - noonMinutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return delta >= MINUTES_PER_DAY / 2;
}
