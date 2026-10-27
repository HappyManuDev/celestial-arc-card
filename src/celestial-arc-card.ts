import { html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import { getMoonPhase } from './astro/moon';
import { arcPoint } from './astro/progress';
import { getSunPeriod } from './astro/sun';
import {
  CARD_DESCRIPTION,
  CARD_NAME,
  CARD_TAG,
  CARD_VERSION,
  DEFAULT_SUN_ENTITY,
  DOCUMENTATION_URL,
} from './const';
import type { HomeAssistant, LovelaceGridOptions } from './ha-types';
import { ARC, renderArc, VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from './render/arc';
import { renderLabels } from './render/labels';
import { renderMoon } from './render/moon-marker';
import { renderSun } from './render/sun-marker';
import { cardStyles } from './styles';
import type { CelestialArcCardConfig } from './types';
import { formatTime } from './utils/time-format';

export class CelestialArcCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: CelestialArcCardConfig;

  public static getStubConfig(): Partial<CelestialArcCardConfig> {
    return { entity: DEFAULT_SUN_ENTITY };
  }

  public setConfig(config: CelestialArcCardConfig): void {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    this._config = { entity: DEFAULT_SUN_ENTITY, ...config };
  }

  public getCardSize(): number {
    return 2;
  }

  public getGridOptions(): LovelaceGridOptions {
    return { columns: 12, rows: 2, min_columns: 4 };
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }
    const entityId = this._config.entity ?? DEFAULT_SUN_ENTITY;
    const sun = this.hass.states[entityId];
    if (!sun) {
      return html`<ha-card><div class="warning">Entity not found: ${entityId}</div></ha-card>`;
    }

    const now = new Date();
    const { latitude, longitude } = this.hass.config ?? {};
    const period = getSunPeriod(sun, now, { latitude, longitude });
    const isDay = period?.isDay ?? sun.state === 'above_horizon';

    let marker: unknown = nothing;
    let labels: unknown = nothing;
    if (period) {
      const position = arcPoint(period.progress, ARC);
      marker = period.isDay
        ? renderSun(position)
        : renderMoon(position, getMoonPhase(now), (latitude ?? 0) < 0);
      labels = renderLabels(formatTime(period.start, this.hass), formatTime(period.end, this.hass));
    }

    return html`
      <ha-card>
        <svg
          class=${isDay ? 'day' : 'night'}
          viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}"
          xmlns="http://www.w3.org/2000/svg"
        >
          ${renderArc()} ${marker} ${labels}
        </svg>
      </ha-card>
    `;
  }

  static styles = cardStyles;
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, CelestialArcCard);
}

window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: CARD_NAME,
    description: CARD_DESCRIPTION,
    preview: true,
    documentationURL: DOCUMENTATION_URL,
  });
}

console.info(
  `%c ${CARD_NAME.toUpperCase()} %c v${CARD_VERSION} `,
  'color: white; background: #c9a35a; font-weight: 700;',
  'color: #c9a35a; background: white; font-weight: 700;',
);
