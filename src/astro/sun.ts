import { getTimes } from 'suncalc';

import type { HassEntity } from '../ha-types';
import { progressBetween } from './progress';

const DAY_MS = 24 * 3600 * 1000;

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SunPeriod {
  /** True between sunrise and sunset. */
  isDay: boolean;
  /** Last sunrise (day) or last sunset (night). */
  start: Date;
  /** Next sunset (day) or next sunrise (night). */
  end: Date;
  /** Elapsed fraction of the period, 0 → 1. */
  progress: number;
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Most recent sunrise or sunset at or before `now`, computed with suncalc. */
function previousEvent(
  event: 'sunrise' | 'sunset',
  now: Date,
  { latitude, longitude }: Location,
): Date | undefined {
  // getTimes works on the solar day containing the date: if that day's event
  // is still ahead, the previous one belongs to the day before.
  for (const offset of [0, DAY_MS]) {
    const time = getTimes(new Date(now.getTime() - offset), latitude, longitude)[event];
    if (time && time.getTime() <= now.getTime()) {
      return time;
    }
  }
  return undefined;
}

function isValidLocation(location?: Partial<Location>): location is Location {
  return Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
}

/**
 * Current day or night period from a `sun.sun` entity.
 * Returns undefined when the period cannot be determined (polar day/night,
 * missing attributes).
 */
export function getSunPeriod(
  entity: HassEntity,
  now: Date,
  location?: Partial<Location>,
): SunPeriod | undefined {
  const isDay = entity.state === 'above_horizon';
  const nextRising = parseDate(entity.attributes.next_rising);
  const nextSetting = parseDate(entity.attributes.next_setting);
  const end = isDay ? nextSetting : nextRising;
  if (!end) {
    return undefined;
  }

  let start = isValidLocation(location)
    ? previousEvent(isDay ? 'sunrise' : 'sunset', now, location)
    : undefined;
  if (!start) {
    // Approximation used when coordinates are unknown: the previous event
    // happened about 24 hours before the next one.
    const nextOpposite = isDay ? nextRising : nextSetting;
    start = nextOpposite ? new Date(nextOpposite.getTime() - DAY_MS) : undefined;
  }
  if (!start || start.getTime() >= end.getTime()) {
    return undefined;
  }

  return { isDay, start, end, progress: progressBetween(start, end, now) };
}
