import { svg } from 'lit';

import type { MoonPhase } from '../astro/moon';
import type { SkySample } from '../astro/sky';
import { renderMoon } from './moon-marker';
import { renderSun } from './sun-marker';

/**
 * The sky is drawn in a viewBox as wide as the card in pixels, like the wave,
 * so texts and markers keep their size. x: time of day (midnight → midnight).
 * y: altitude in degrees, the horizon at HORIZON_Y. Below the horizon only a
 * short, fading start of each curve is shown.
 */
const TOP = 20;
export const HORIZON_Y = 104;
const BOTTOM = 140;
export const SKY_HEIGHT = BOTTOM;
const MIN_TOP_ALTITUDE = 12;
const TOP_MARGIN = 6;
const LABEL_FIRST_ROW = 15;
const LABEL_ROW_GAP = 14;
const LABEL_EDGE = 18;
const MINUTES_PER_DAY = 24 * 60;

export interface SkyTimeLabel {
  minutes: number;
  rising: boolean;
  label: string;
}

export interface SkyView {
  width: number;
  sun: SkySample[];
  /** Undefined when the moon is hidden (night_mode: none). */
  moon?: SkySample[];
  nowMinutes: number;
  nowLabel: string;
  sunAltitude: number;
  sunUp: boolean;
  moonAltitude: number;
  moonUp: boolean;
  phase: MoonPhase;
  southern: boolean;
  /** Rise and set times of today, when shown. */
  sunTimes?: SkyTimeLabel[];
  moonTimes?: SkyTimeLabel[];
}

/** Unlabelled dotted lines every 3 hours: the times on the chart are enough. */
const SKY_GRID_HOURS = [3, 6, 9, 12, 15, 18, 21];

/** Vertical scale: from the horizon up to just above the highest point of the day. */
export function skyScale(curves: SkySample[][]): (altitude: number) => number {
  const highest = Math.max(MIN_TOP_ALTITUDE, ...curves.flat().map((s) => s.altitude));
  const pixelsPerDegree = (HORIZON_Y - TOP) / (highest + TOP_MARGIN);
  return (altitude) => HORIZON_Y - altitude * pixelsPerDegree;
}

export function renderSky(view: SkyView) {
  const { width } = view;
  const xOf = (minutes: number) => (minutes / MINUTES_PER_DAY) * width;
  const yOf = skyScale(view.moon ? [view.sun, view.moon] : [view.sun]);
  const line = (samples: SkySample[]) =>
    `M${samples.map((s) => `${xOf(s.minutes).toFixed(1)},${yOf(s.altitude).toFixed(2)}`).join(' L')}`;
  const area = (samples: SkySample[]) =>
    `${line(samples)} L${width},${HORIZON_Y} L0,${HORIZON_Y} Z`;
  const sunLine = line(view.sun);
  const moonLine = view.moon ? line(view.moon) : undefined;
  // The brighter the moon, the stronger its curve.
  const moonOpacity = (0.55 + 0.45 * view.phase.fraction).toFixed(2);

  const sunrise = view.sunTimes?.find((t) => t.rising);
  const sunset = view.sunTimes?.find((t) => !t.rising);

  const x = xOf(view.nowMinutes);
  const markerY = (altitude: number) => Math.min(BOTTOM - 6, yOf(altitude));
  const sunMarker = svg`<g class="sky-marker" opacity=${view.sunUp ? 1 : 0.45}>
    ${renderSun({ x, y: markerY(view.sunAltitude) })}</g>`;
  const moonMarker = view.moon
    ? svg`<g class="sky-marker" opacity=${view.moonUp ? 1 : 0.5}>
        ${renderMoon({ x, y: markerY(view.moonAltitude) }, view.phase, view.southern)}</g>`
    : null;

  return svg`
    <defs>
      <linearGradient id="sky-sun-area" x1="0" y1=${TOP} x2="0" y2=${HORIZON_Y} gradientUnits="userSpaceOnUse">
        <stop class="sky-sun-stop" offset="0" stop-opacity="0.22"></stop>
        <stop class="sky-sun-stop" offset="1" stop-opacity="0.04"></stop>
      </linearGradient>
      <linearGradient id="sky-moon-area" x1="0" y1=${TOP} x2="0" y2=${HORIZON_Y} gradientUnits="userSpaceOnUse">
        <stop class="sky-moon-stop" offset="0" stop-opacity="0.16"></stop>
        <stop class="sky-moon-stop" offset="1" stop-opacity="0.03"></stop>
      </linearGradient>
      <radialGradient id="sky-glow">
        <stop class="sky-sun-stop" offset="0" stop-opacity="0.45"></stop>
        <stop class="sky-sun-stop" offset="1" stop-opacity="0"></stop>
      </radialGradient>
      <linearGradient id="sky-fade" x1="0" y1=${HORIZON_Y} x2="0" y2=${BOTTOM} gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#fff"></stop>
        <stop offset="1" stop-color="#fff" stop-opacity="0"></stop>
      </linearGradient>
      <mask id="sky-below" maskUnits="userSpaceOnUse" x="-10" y=${HORIZON_Y} width=${width + 20}
        height=${BOTTOM - HORIZON_Y}>
        <rect x="-10" y=${HORIZON_Y} width=${width + 20} height=${BOTTOM - HORIZON_Y}
          fill="url(#sky-fade)"></rect>
      </mask>
      <clipPath id="sky-above">
        <rect x="0" y="-20" width=${width} height=${HORIZON_Y + 20}></rect>
      </clipPath>
    </defs>
    ${SKY_GRID_HOURS.map((hour) => {
      const gx = xOf(hour * 60);
      return svg`<line class="sky-grid" x1=${gx} y1=${TOP} x2=${gx} y2=${BOTTOM}></line>`;
    })}
    ${[sunrise, sunset].map((event) =>
      event
        ? svg`<ellipse cx=${xOf(event.minutes)} cy=${HORIZON_Y} rx="34" ry="30"
            fill="url(#sky-glow)"></ellipse>`
        : null,
    )}
    <g clip-path="url(#sky-above)">
      ${
        moonLine
          ? svg`<path d=${area(view.moon!)} fill="url(#sky-moon-area)" opacity=${moonOpacity}></path>`
          : null
      }
      <path d=${area(view.sun)} fill="url(#sky-sun-area)"></path>
      ${moonLine ? svg`<path class="sky-curve sky-moon" d=${moonLine} opacity=${moonOpacity}></path>` : null}
      <path class="sky-curve sky-sun" d=${sunLine}></path>
    </g>
    <g mask="url(#sky-below)">
      ${
        moonLine
          ? svg`<path class="sky-curve sky-moon sky-below" d=${moonLine} opacity=${moonOpacity}></path>`
          : null
      }
      <path class="sky-curve sky-sun sky-below" d=${sunLine}></path>
    </g>
    <line class="sky-horizon" x1="0" y1=${HORIZON_Y} x2=${width} y2=${HORIZON_Y}></line>
    ${
      sunrise && sunset && sunrise.minutes < sunset.minutes
        ? svg`<line class="sky-daylight" x1=${xOf(sunrise.minutes)} y1=${HORIZON_Y}
            x2=${xOf(sunset.minutes)} y2=${HORIZON_Y}></line>`
        : null
    }
    <line class="sky-now" x1=${x} y1=${TOP - 2} x2=${x} y2=${BOTTOM}></line>
    <text class="sky-now-label" x=${clampLabel(x, width)} y=${TOP - 7}
      text-anchor="middle">${view.nowLabel}</text>
    ${renderTimes('sun', view.sunTimes, 0, xOf, width)}
    ${renderTimes('moon', view.moonTimes, 1, xOf, width)}
    ${view.sunUp ? [moonMarker, sunMarker] : [sunMarker, moonMarker]}
  `;
}

const clampLabel = (x: number, width: number) =>
  Math.min(width - LABEL_EDGE, Math.max(LABEL_EDGE, x));

/** Approximate width of "↑ 10:43" at 11 px: arrow, space, then the time. */
const labelWidth = (label: string) => 12 + label.length * 6.2;
const LABEL_GAP = 6;

/**
 * Centers of the labels of one row: under their event, but pushed apart when
 * two events are too close to be read (a short polar day, a moonrise just
 * after a moonset), and kept inside the card. `xs` is in time order.
 */
export function spreadLabels(xs: number[], widths: number[], width: number): number[] {
  const min = (i: number) => Math.max(LABEL_EDGE, widths[i] / 2);
  const max = (i: number) => width - min(i);
  const out = xs.map((x, i) => Math.min(max(i), Math.max(min(i), x)));
  const need = (i: number) => (widths[i - 1] + widths[i]) / 2 + LABEL_GAP;
  for (let i = 1; i < out.length; i++) {
    const missing = need(i) - (out[i] - out[i - 1]);
    if (missing > 0) {
      out[i - 1] -= missing / 2;
      out[i] += missing / 2;
    }
  }
  // Against the edges, pass the push on to the neighbours.
  for (let i = out.length - 1; i >= 0; i--) {
    out[i] = Math.min(out[i], max(i), i < out.length - 1 ? out[i + 1] - need(i + 1) : Infinity);
  }
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.max(out[i], min(i), i > 0 ? out[i - 1] + need(i) : -Infinity);
  }
  return out;
}

/** Rise and set times under the horizon, one row per body. */
function renderTimes(
  body: 'sun' | 'moon',
  times: SkyTimeLabel[] | undefined,
  row: number,
  xOf: (minutes: number) => number,
  width: number,
) {
  const list = times ?? [];
  const positions = spreadLabels(
    list.map((time) => xOf(time.minutes)),
    list.map((time) => labelWidth(time.label)),
    width,
  );
  return list.map((time, i) => {
    const x = xOf(time.minutes);
    return svg`
      <circle class="sky-event sky-event-${body}" cx=${x} cy=${HORIZON_Y} r="3"></circle>
      <text class="label sky-time" x=${positions[i]}
        y=${HORIZON_Y + LABEL_FIRST_ROW + row * LABEL_ROW_GAP} text-anchor="middle"><tspan
        class="sky-arrow-${body}">${time.rising ? '↑' : '↓'}</tspan> ${time.label}</text>
    `;
  });
}
