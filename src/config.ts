import { DEFAULT_SUN_ENTITY } from './const';
import type { CelestialArcCardConfig, ColorsConfig, NightMode, ResolvedConfig } from './types';

export const NIGHT_MODES: readonly NightMode[] = ['moon', 'none'];
export const COLOR_KEYS: readonly (keyof ColorsConfig)[] = [
  'day_arc',
  'night_arc',
  'sun',
  'moon',
  'label',
];
export const MIN_UPDATE_INTERVAL = 10;
// Also keeps the delay far below the setInterval limit (~24.8 days), above
// which browsers fire the timer immediately and the card re-renders in a loop.
export const MAX_UPDATE_INTERVAL = 3600;

export const DEFAULT_CONFIG: Omit<ResolvedConfig, 'type'> = {
  entity: DEFAULT_SUN_ENTITY,
  night_mode: 'moon',
  show_times: true,
  show_day_length: false,
  show_moon_phase: false,
  background: false,
  update_interval: 60,
  tap_action: { action: 'more-info' },
  hold_action: { action: 'none' },
};

const BOOLEAN_KEYS = ['show_times', 'show_day_length', 'show_moon_phase', 'background'] as const;

/** Validates a user configuration and applies defaults. Throws a readable error. */
export function resolveConfig(config: CelestialArcCardConfig): ResolvedConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid configuration');
  }
  if (config.entity !== undefined && typeof config.entity !== 'string') {
    throw new Error('"entity" must be an entity id, e.g. sun.sun');
  }
  if (config.title !== undefined && typeof config.title !== 'string') {
    throw new Error('"title" must be a text');
  }
  if (config.night_mode !== undefined && !NIGHT_MODES.includes(config.night_mode)) {
    throw new Error(`"night_mode" must be one of: ${NIGHT_MODES.join(', ')}`);
  }
  for (const key of BOOLEAN_KEYS) {
    if (config[key] !== undefined && typeof config[key] !== 'boolean') {
      throw new Error(`"${key}" must be true or false`);
    }
  }
  if (
    config.update_interval !== undefined &&
    !(
      typeof config.update_interval === 'number' &&
      config.update_interval >= MIN_UPDATE_INTERVAL &&
      config.update_interval <= MAX_UPDATE_INTERVAL
    )
  ) {
    throw new Error(
      `"update_interval" must be a number of seconds between ${MIN_UPDATE_INTERVAL} and ${MAX_UPDATE_INTERVAL}`,
    );
  }
  if (config.colors !== undefined) {
    if (typeof config.colors !== 'object' || config.colors === null) {
      throw new Error('"colors" must be a mapping');
    }
    for (const [key, value] of Object.entries(config.colors)) {
      if (!COLOR_KEYS.includes(key as keyof ColorsConfig)) {
        throw new Error(`Unknown color "${key}", expected one of: ${COLOR_KEYS.join(', ')}`);
      }
      if (typeof value !== 'string') {
        throw new Error(`Color "${key}" must be a CSS color`);
      }
    }
  }
  // An option explicitly set to undefined (e.g. cleared in the editor) keeps its default.
  const defined = Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined),
  ) as CelestialArcCardConfig;
  return { ...DEFAULT_CONFIG, ...defined } as ResolvedConfig;
}
