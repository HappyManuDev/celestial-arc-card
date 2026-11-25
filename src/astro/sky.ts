import { getMoonPosition, getPosition } from 'suncalc';

import type { Location } from './sun';

const MINUTE_MS = 60 * 1000;
export const SKY_STEP_MINUTES = 10;

export type Body = 'sun' | 'moon';

/** Apparent altitude of the body's center, in degrees. */
export function altitude(body: Body, date: Date, { latitude, longitude }: Location): number {
  return body === 'sun'
    ? getPosition(date, latitude, longitude).altitude
    : getMoonPosition(date, latitude, longitude).altitude;
}

const EARTH_RADIUS_KM = 6378.14;
const DEG = 180 / Math.PI;
/**
 * Apparent altitude of the sun's center at sunrise and sunset. suncalc's
 * times use a true altitude of -0.833°, and getPosition adds a constant
 * 0.484° of refraction below the horizon.
 */
const SUN_RISE_APPARENT_ALTITUDE = -0.833 + 0.484;

/**
 * Height above the rise threshold (positive when risen), with the same
 * conventions as suncalc's rise and set times: for the sun see above, for
 * the moon its upper limb (semi-diameter from its distance) plus a small
 * refraction margin.
 */
function riseAltitude(body: Body, date: Date, { latitude, longitude }: Location): number {
  if (body === 'sun') {
    return getPosition(date, latitude, longitude).altitude - SUN_RISE_APPARENT_ALTITUDE;
  }
  const moon = getMoonPosition(date, latitude, longitude);
  return moon.altitude + 0.2725 * Math.asin(EARTH_RADIUS_KM / moon.distance) * DEG + 0.09;
}

/** True when the body is above the horizon. */
export function isUp(body: Body, date: Date, location: Location): boolean {
  return riseAltitude(body, date, location) >= 0;
}

export interface SkySample {
  /** Minutes after the start of the sampled window. */
  minutes: number;
  /** Altitude in degrees. */
  altitude: number;
}

/** Altitude of the body every SKY_STEP_MINUTES over `spanMinutes` from `start`. */
export function altitudeCurve(
  body: Body,
  start: Date,
  location: Location,
  spanMinutes = 24 * 60,
): SkySample[] {
  const samples: SkySample[] = [];
  for (let minutes = 0; minutes <= spanMinutes; minutes += SKY_STEP_MINUTES) {
    const date = new Date(start.getTime() + minutes * MINUTE_MS);
    samples.push({ minutes, altitude: altitude(body, date, location) });
  }
  return samples;
}

export interface SkyEvent {
  time: Date;
  rising: boolean;
}

/**
 * Rises and sets of the body between `start` and `end`: sign changes of its
 * rise altitude, found on a 10-minute grid then refined to the second.
 */
export function crossings(body: Body, start: Date, end: Date, location: Location): SkyEvent[] {
  const height = (ms: number) => riseAltitude(body, new Date(ms), location);
  const step = SKY_STEP_MINUTES * MINUTE_MS;
  const events: SkyEvent[] = [];
  let t0 = start.getTime();
  let h0 = height(t0);
  while (t0 < end.getTime()) {
    const t1 = Math.min(t0 + step, end.getTime());
    const h1 = height(t1);
    if (h0 < 0 !== h1 < 0) {
      let [lo, hi, hLo] = [t0, t1, h0];
      while (hi - lo > 1000) {
        const mid = (lo + hi) / 2;
        const hMid = height(mid);
        if (hMid < 0 === hLo < 0) {
          [lo, hLo] = [mid, hMid];
        } else {
          hi = mid;
        }
      }
      events.push({ time: new Date(Math.round((lo + hi) / 2)), rising: h0 < 0 });
    }
    [t0, h0] = [t1, h1];
  }
  return events;
}
