import type { MoonPhase } from '../astro/moon';
import type { HomeAssistant } from '../ha-types';
import { languageOf, localize } from '../localize/localize';

// Half a day expressed as a fraction of the synodic month (29.53 days):
// a named instant phase (new, quarter, full) is shown for about one day.
const INSTANT_PHASE_HALF_WIDTH = 0.5 / 29.53;

export type MoonPhaseName =
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export function moonPhaseName(phase: number): MoonPhaseName {
  const near = (target: number) =>
    Math.abs(phase - target) <= INSTANT_PHASE_HALF_WIDTH ||
    Math.abs(phase - target - 1) <= INSTANT_PHASE_HALF_WIDTH;
  if (near(0)) return 'new_moon';
  if (near(0.25)) return 'first_quarter';
  if (near(0.5)) return 'full_moon';
  if (near(0.75)) return 'last_quarter';
  if (phase < 0.25) return 'waxing_crescent';
  if (phase < 0.5) return 'waxing_gibbous';
  if (phase < 0.75) return 'waning_gibbous';
  return 'waning_crescent';
}

export function formatPercent(fraction: number, hass: HomeAssistant): string {
  return new Intl.NumberFormat(languageOf(hass), {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(fraction);
}

export function formatDuration(milliseconds: number, hass: HomeAssistant): string {
  const totalMinutes = Math.round(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return localize(hass, 'info.duration', { hours, minutes });
}

export function formatMoonPhase(moon: MoonPhase, hass: HomeAssistant): string {
  const name = localize(hass, `moon_phase.${moonPhaseName(moon.phase)}`);
  return `${name} · ${formatPercent(moon.fraction, hass)}`;
}
