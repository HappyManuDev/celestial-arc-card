import type { ActionConfig, LovelaceCardConfig } from './ha-types';

export type NightMode = 'moon' | 'none';

export interface ColorsConfig {
  day_arc?: string;
  night_arc?: string;
  sun?: string;
  moon?: string;
  label?: string;
}

export interface CelestialArcCardConfig extends LovelaceCardConfig {
  type: string;
  entity?: string;
  title?: string;
  night_mode?: NightMode;
  show_times?: boolean;
  show_day_length?: boolean;
  show_moon_phase?: boolean;
  background?: boolean;
  update_interval?: number;
  colors?: ColorsConfig;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
}

/** Configuration once defaults are applied. */
export type ResolvedConfig = CelestialArcCardConfig &
  Required<
    Pick<
      CelestialArcCardConfig,
      | 'entity'
      | 'night_mode'
      | 'show_times'
      | 'show_day_length'
      | 'show_moon_phase'
      | 'background'
      | 'update_interval'
      | 'tap_action'
      | 'hold_action'
    >
  >;
