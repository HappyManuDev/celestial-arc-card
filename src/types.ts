import type { LovelaceCardConfig } from './ha-types';

export interface CelestialArcCardConfig extends LovelaceCardConfig {
  type: string;
  entity?: string;
}
