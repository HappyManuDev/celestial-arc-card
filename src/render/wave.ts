import { svg } from 'lit';

import type { MoonPhase } from '../astro/moon';
import {
  MINUTES_PER_DAY,
  type Twilight,
  TWILIGHTS,
  type TwilightLevels,
  waveElevation,
} from '../astro/wave';
import { renderMoon } from './moon-marker';
import { renderSun } from './sun-marker';

/**
 * The wave is drawn in a viewBox as wide as the card in pixels, so that
 * texts, dashes and markers keep the same size whatever the card width.
 * x: time of day (midnight → midnight). y: normalized elevation.
 */
export const DEFAULT_WAVE_WIDTH = 300;
const CENTER = 58;
const AMPLITUDE = 46;
const BOTTOM = CENTER + AMPLITUDE + 4;
const TICK = 4;
const AXIS_BASELINE = BOTTOM + TICK + 14;
export const WAVE_HEIGHT = AXIS_BASELINE + 2;
const LABEL_OFFSET = 6;
const LABEL_MIN_GAP = 84;
export const AXIS_HOURS = [6, 12, 18];

/** Vertical position of a normalized elevation. */
export const waveY = (elevation: number): number => CENTER - elevation * AMPLITUDE;

/** SVG path of the 24-hour elevation curve, midnight to midnight. */
export function wavePath(noonMinutes: number, width: number): string {
  const points: string[] = [];
  for (let minutes = 0; minutes <= MINUTES_PER_DAY; minutes += 10) {
    const x = (minutes / MINUTES_PER_DAY) * width;
    points.push(`${x.toFixed(1)},${waveY(waveElevation(minutes, noonMinutes)).toFixed(2)}`);
  }
  return `M${points.join(' L')}`;
}

/** A band below the horizon, between two y positions. */
export interface WaveBand {
  kind: Twilight | 'night';
  top: number;
  bottom: number;
}

/**
 * Horizontal bands below the horizon: civil, nautical and astronomical
 * twilight, then night. A band ends where the curve reaches its level.
 */
export function twilightBands(horizon: number, levels?: TwilightLevels): WaveBand[] {
  const horizonY = waveY(horizon);
  if (!levels) {
    return horizonY < BOTTOM ? [{ kind: 'night', top: horizonY, bottom: BOTTOM }] : [];
  }
  const bands: WaveBand[] = [];
  let top = horizonY;
  for (const kind of TWILIGHTS) {
    const level = levels[kind];
    const bottom = level === null ? BOTTOM : Math.min(BOTTOM, waveY(level));
    if (bottom > top) {
      bands.push({ kind, top, bottom });
      top = bottom;
    }
  }
  if (top < BOTTOM) {
    bands.push({ kind: 'night', top, bottom: BOTTOM });
  }
  return bands;
}

export interface WaveView {
  width: number;
  noonMinutes: number;
  nowMinutes: number;
  /** Normalized level of the horizon (see horizonLevel). */
  horizon: number;
  levels?: TwilightLevels;
  /** Sunrise and sunset labels, in minutes of day, when known and shown. */
  times?: { sunrise: number; sunset: number; sunriseLabel: string; sunsetLabel: string };
  axisLabels: string[];
  /** Whether to draw the moon below the horizon. */
  showMoon: boolean;
  moon: MoonPhase;
  southern: boolean;
}

export function renderWave(view: WaveView) {
  const { width } = view;
  const xOf = (minutes: number) => (minutes / MINUTES_PER_DAY) * width;
  const horizonY = waveY(view.horizon);
  const path = wavePath(view.noonMinutes, width);
  const elevation = waveElevation(view.nowMinutes, view.noonMinutes);
  const position = { x: xOf(view.nowMinutes), y: waveY(elevation) };
  const marker =
    elevation >= view.horizon
      ? renderSun(position)
      : view.showMoon
        ? renderMoon(position, view.moon, view.southern)
        : null;

  return svg`
    <defs>
      <linearGradient id="wave-day-tint" x1="0" y1="0" x2="0" y2="1">
        <stop class="wave-day-stop" offset="0" stop-opacity="0"></stop>
        <stop class="wave-day-stop" offset="1"></stop>
      </linearGradient>
      <clipPath id="wave-above">
        <rect x="-20" y="-40" width=${width + 40} height=${horizonY + 40}></rect>
      </clipPath>
      <clipPath id="wave-below">
        <rect x="-20" y=${horizonY} width=${width + 40} height=${WAVE_HEIGHT}></rect>
      </clipPath>
    </defs>
    <rect class="wave-day" x="0" y="0" width=${width} height=${Math.max(0, horizonY)}
      fill="url(#wave-day-tint)"></rect>
    ${twilightBands(view.horizon, view.levels).map(
      (band) => svg`<rect class="wave-band wave-${band.kind}" x="0" y=${band.top} width=${width}
        height=${band.bottom - band.top}></rect>`,
    )}
    <path class="wave-curve wave-curve-night" d=${path} clip-path="url(#wave-below)"></path>
    <path class="wave-curve wave-curve-day" d=${path} clip-path="url(#wave-above)"></path>
    <line class="horizon" x1="0" y1=${horizonY} x2=${width} y2=${horizonY}></line>
    ${view.times ? renderTimes(view.times, xOf, horizonY) : null}
    ${AXIS_HOURS.map((hour, i) => {
      const x = xOf(hour * 60);
      return svg`
        <line class="wave-tick" x1=${x} y1=${BOTTOM} x2=${x} y2=${BOTTOM + TICK}></line>
        <text class="wave-axis" x=${x} y=${AXIS_BASELINE} text-anchor="middle">${view.axisLabels[i]}</text>
      `;
    })}
    ${marker}
  `;
}

/**
 * Sunrise and sunset times under the horizon, next to the points where the
 * curve crosses it: inside the hump, or outside when the day is too short.
 */
function renderTimes(
  times: NonNullable<WaveView['times']>,
  xOf: (minutes: number) => number,
  horizonY: number,
) {
  const start = xOf(times.sunrise);
  const end = xOf(times.sunset);
  const inside = end - start >= LABEL_MIN_GAP;
  const y = horizonY + 14 <= BOTTOM ? horizonY + 14 : horizonY - LABEL_OFFSET;
  return svg`
    <circle class="wave-event" cx=${start} cy=${horizonY} r="2.5"></circle>
    <circle class="wave-event" cx=${end} cy=${horizonY} r="2.5"></circle>
    <text class="label" x=${inside ? start + LABEL_OFFSET : start - LABEL_OFFSET} y=${y}
      text-anchor=${inside ? 'start' : 'end'}>${times.sunriseLabel}</text>
    <text class="label" x=${inside ? end - LABEL_OFFSET : end + LABEL_OFFSET} y=${y}
      text-anchor=${inside ? 'end' : 'start'}>${times.sunsetLabel}</text>
  `;
}
