import { describe, expect, it } from 'vitest';

import type { HomeAssistant } from '../src/ha-types';
import { localize } from '../src/localize/localize';
import { formatDuration, formatMoonPhase, moonPhaseName } from '../src/utils/format';

const hassIn = (language: string) =>
  ({ locale: { language }, language, config: {}, states: {} }) as unknown as HomeAssistant;

describe('moonPhaseName', () => {
  it.each([
    [0, 'new_moon'],
    [0.99, 'new_moon'],
    [0.1, 'waxing_crescent'],
    [0.25, 'first_quarter'],
    [0.4, 'waxing_gibbous'],
    [0.5, 'full_moon'],
    [0.6, 'waning_gibbous'],
    [0.75, 'last_quarter'],
    [0.9, 'waning_crescent'],
  ])('phase %d is %s', (phase, name) => {
    expect(moonPhaseName(phase)).toBe(name);
  });
});

describe('localize', () => {
  it('translates into French', () => {
    expect(localize(hassIn('fr'), 'moon_phase.full_moon')).toBe('Pleine lune');
  });

  it('uses the base language of a regional tag', () => {
    expect(localize(hassIn('fr-CA'), 'moon_phase.full_moon')).toBe('Pleine lune');
  });

  it('falls back to English for unknown languages', () => {
    expect(localize(hassIn('xx'), 'moon_phase.full_moon')).toBe('Full moon');
  });

  it('returns the key when it does not exist', () => {
    expect(localize(hassIn('en'), 'nope.missing')).toBe('nope.missing');
  });

  it('replaces placeholders', () => {
    expect(localize(hassIn('en'), 'warning.entity_not_found', { entity: 'sun.x' })).toBe(
      'Entity not found: sun.x',
    );
  });
});

describe('formatDuration', () => {
  it('formats hours and zero-padded minutes', () => {
    const ms = (16 * 60 + 5) * 60000;
    expect(formatDuration(ms, hassIn('fr'))).toBe('16 h 05 min');
    expect(formatDuration(ms, hassIn('en'))).toBe('16h 05m');
  });
});

describe('formatMoonPhase', () => {
  it('combines the phase name and the illuminated percentage', () => {
    const text = formatMoonPhase({ fraction: 0.78, phase: 0.4, waxing: true }, hassIn('fr'));
    expect(text).toMatch(/^Gibbeuse croissante · 78\s?%$/);
  });
});
