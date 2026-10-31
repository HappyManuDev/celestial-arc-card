import { describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG, resolveConfig } from '../src/config';
import type { CelestialArcCardConfig } from '../src/types';

const TYPE = 'custom:celestial-arc-card';
const resolve = (config: Record<string, unknown>) =>
  resolveConfig({ type: TYPE, ...config } as CelestialArcCardConfig);

describe('resolveConfig', () => {
  it('applies defaults', () => {
    expect(resolve({})).toEqual({ type: TYPE, ...DEFAULT_CONFIG });
  });

  it('keeps user values over defaults', () => {
    const config = resolve({ entity: 'sun.other', show_times: false, update_interval: 30 });
    expect(config.entity).toBe('sun.other');
    expect(config.show_times).toBe(false);
    expect(config.update_interval).toBe(30);
    expect(config.show_moon_phase).toBe(false);
  });

  it('keeps defaults for options explicitly set to undefined', () => {
    const config = resolve({ entity: undefined, show_times: undefined });
    expect(config.entity).toBe('sun.sun');
    expect(config.show_times).toBe(true);
  });

  it.each([
    [{ entity: 42 }, /entity/],
    [{ title: true }, /title/],
    [{ night_mode: 'stars' }, /night_mode/],
    [{ show_times: 'yes' }, /show_times/],
    [{ update_interval: 2 }, /update_interval/],
    [{ update_interval: '60' }, /update_interval/],
    [{ update_interval: 3601 }, /update_interval/],
    [{ update_interval: Infinity }, /update_interval/],
    [{ update_interval: NaN }, /update_interval/],
    [{ colors: 'red' }, /colors/],
    [{ colors: { stars: '#fff' } }, /Unknown color "stars"/],
    [{ colors: { sun: 12 } }, /Color "sun"/],
  ])('rejects %j', (config, message) => {
    expect(() => resolve(config)).toThrow(message);
  });

  it('rejects a missing configuration', () => {
    expect(() => resolveConfig(undefined as unknown as CelestialArcCardConfig)).toThrow();
  });
});
