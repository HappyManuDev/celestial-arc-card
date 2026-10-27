import { getMoonIllumination } from 'suncalc';

export interface MoonPhase {
  /** Illuminated fraction, 0 (new) → 1 (full). */
  fraction: number;
  /** Phase, 0 → 1: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
  phase: number;
  /** True from new moon to full moon. */
  waxing: boolean;
}

export function getMoonPhase(now: Date): MoonPhase {
  const { fraction, phase, waxing } = getMoonIllumination(now);
  return { fraction, phase, waxing };
}

/**
 * SVG path of the lit part of a moon disk.
 *
 * The outline follows the limb on the lit side, then comes back along the
 * terminator, an ellipse whose half-width shrinks to 0 at quarter moon.
 * Seen from the northern hemisphere, a waxing moon is lit on the right;
 * the image is mirrored in the southern hemisphere.
 */
export function moonLitPath(
  cx: number,
  cy: number,
  r: number,
  { fraction, waxing }: MoonPhase,
  southern = false,
): string {
  const litOnRight = waxing !== southern;
  const terminatorRx = r * Math.abs(1 - 2 * fraction);
  const crescent = fraction < 0.5;

  // Sweep flags: 1 = clockwise on screen (y axis pointing down).
  const limbSweep = litOnRight ? 1 : 0;
  // A crescent's terminator bulges towards the lit side, a gibbous one away from it.
  const terminatorSweep = litOnRight === crescent ? 0 : 1;

  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  return [
    `M ${top}`,
    `A ${r} ${r} 0 0 ${limbSweep} ${bottom}`,
    `A ${terminatorRx} ${r} 0 0 ${terminatorSweep} ${top}`,
    'Z',
  ].join(' ');
}
