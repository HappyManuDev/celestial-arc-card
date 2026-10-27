import { svg } from 'lit';

import type { Point } from '../astro/progress';

export const HALO_RADIUS = 13;
export const BODY_RADIUS = 7;

export function renderSun({ x, y }: Point) {
  return svg`
    <circle class="sun-halo" cx=${x} cy=${y} r=${HALO_RADIUS}></circle>
    <circle class="sun" cx=${x} cy=${y} r=${BODY_RADIUS}></circle>
  `;
}
