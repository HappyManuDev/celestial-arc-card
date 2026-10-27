import { svg } from 'lit';

import { type MoonPhase, moonLitPath } from '../astro/moon';
import type { Point } from '../astro/progress';
import { BODY_RADIUS, HALO_RADIUS } from './sun-marker';

export function renderMoon({ x, y }: Point, phase: MoonPhase, southern: boolean) {
  return svg`
    <circle class="moon-halo" cx=${x} cy=${y} r=${HALO_RADIUS}></circle>
    <circle class="moon-shadow" cx=${x} cy=${y} r=${BODY_RADIUS}></circle>
    <path class="moon" d=${moonLitPath(x, y, BODY_RADIUS, phase, southern)}></path>
  `;
}
