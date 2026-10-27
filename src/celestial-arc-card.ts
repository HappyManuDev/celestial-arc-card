import { html, LitElement, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { getMoonPhase } from './astro/moon';
import { arcPoint } from './astro/progress';
import { getSunPeriod, type SunPeriod } from './astro/sun';
import { resolveConfig } from './config';
import {
  CARD_DESCRIPTION,
  CARD_NAME,
  CARD_TAG,
  CARD_VERSION,
  DEFAULT_SUN_ENTITY,
  DOCUMENTATION_URL,
  EDITOR_TAG,
} from './const';
import './editor';
import type { HomeAssistant, LovelaceGridOptions } from './ha-types';
import { localize } from './localize/localize';
import { ARC, renderArc, VIEWBOX_HEIGHT, VIEWBOX_WIDTH } from './render/arc';
import { renderLabels } from './render/labels';
import { renderMoon } from './render/moon-marker';
import { renderSun } from './render/sun-marker';
import { cardStyles } from './styles';
import type { CelestialArcCardConfig, ColorsConfig, ResolvedConfig } from './types';
import { type ActionKind, bindActions, hasAction } from './utils/actions';
import { formatDuration, formatMoonPhase, formatPercent } from './utils/format';
import { formatTime } from './utils/time-format';

const COLOR_VARIABLES: Record<keyof ColorsConfig, string> = {
  day_arc: '--cac-day-arc-color',
  night_arc: '--cac-night-arc-color',
  sun: '--cac-sun-color',
  moon: '--cac-moon-color',
  label: '--cac-label-color',
};

export class CelestialArcCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: ResolvedConfig;

  private _timer?: ReturnType<typeof setInterval>;
  private _unbindActions?: () => void;

  public static getStubConfig(): Partial<CelestialArcCardConfig> {
    return { entity: DEFAULT_SUN_ENTITY };
  }

  public static getConfigElement(): HTMLElement {
    return document.createElement(EDITOR_TAG);
  }

  public setConfig(config: CelestialArcCardConfig): void {
    this._config = resolveConfig(config);
    if (this.isConnected) {
      this._startTimer();
    }
  }

  public getCardSize(): number {
    return 2 + (this._config?.title ? 1 : 0);
  }

  public getGridOptions(): LovelaceGridOptions {
    return { columns: 12, rows: 'auto', min_columns: 4 };
  }

  public connectedCallback(): void {
    super.connectedCallback();
    this._startTimer();
    this._unbindActions = bindActions(this, (kind) => this._handleAction(kind));
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._timer);
    this._timer = undefined;
    this._unbindActions?.();
    this._unbindActions = undefined;
  }

  /** Re-renders periodically so the marker keeps moving between sun.sun updates. */
  private _startTimer(): void {
    clearInterval(this._timer);
    const seconds = this._config?.update_interval ?? 60;
    this._timer = setInterval(() => this.requestUpdate(), seconds * 1000);
  }

  private _handleAction(kind: ActionKind): void {
    if (!this._config) return;
    const action = kind === 'tap' ? this._config.tap_action : this._config.hold_action;
    if (!hasAction(action)) return;
    this.dispatchEvent(
      new CustomEvent('hass-action', {
        bubbles: true,
        composed: true,
        detail: {
          config: {
            entity: this._config.entity,
            tap_action: this._config.tap_action,
            hold_action: this._config.hold_action,
          },
          action: kind,
        },
      }),
    );
  }

  /** `hass` changes on every state change in the house: only re-render when relevant. */
  protected shouldUpdate(changed: PropertyValues<this>): boolean {
    if (!changed.has('hass') || changed.size > 1) {
      return true;
    }
    const previous = changed.get('hass') as HomeAssistant | undefined;
    if (!previous || !this.hass || !this._config) {
      return true;
    }
    const entityId = this._config.entity;
    return (
      previous.states[entityId] !== this.hass.states[entityId] ||
      previous.locale !== this.hass.locale ||
      previous.language !== this.hass.language ||
      previous.config !== this.hass.config
    );
  }

  private _colorStyles(): Record<string, string> {
    const styles: Record<string, string> = {};
    for (const [key, value] of Object.entries(this._config?.colors ?? {})) {
      styles[COLOR_VARIABLES[key as keyof ColorsConfig]] = value;
    }
    return styles;
  }

  private _ariaLabel(period: SunPeriod | undefined): string {
    if (!period || !this.hass) {
      return localize(this.hass, 'aria.unknown');
    }
    return localize(this.hass, period.isDay ? 'aria.day' : 'aria.night', {
      start: formatTime(period.start, this.hass),
      end: formatTime(period.end, this.hass),
      percent: formatPercent(period.progress, this.hass),
    });
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }
    const config = this._config;
    const hass = this.hass;
    const sun = hass.states[config.entity];
    if (!sun) {
      return html`
        <ha-card>
          <div class="warning">
            ${localize(hass, 'warning.entity_not_found', { entity: config.entity })}
          </div>
        </ha-card>
      `;
    }

    const now = new Date();
    const { latitude, longitude } = hass.config ?? {};
    const period = getSunPeriod(sun, now, { latitude, longitude });
    const isDay = period?.isDay ?? sun.state === 'above_horizon';
    const moon = getMoonPhase(now);

    let marker: unknown = nothing;
    let labels: unknown = nothing;
    if (period) {
      const position = arcPoint(period.progress, ARC);
      if (period.isDay) {
        marker = renderSun(position);
      } else if (config.night_mode === 'moon') {
        marker = renderMoon(position, moon, (latitude ?? 0) < 0);
      }
      if (config.show_times) {
        labels = renderLabels(formatTime(period.start, hass), formatTime(period.end, hass));
      }
    }

    const infos: string[] = [];
    if (config.show_day_length && period) {
      const duration = formatDuration(period.end.getTime() - period.start.getTime(), hass);
      infos.push(localize(hass, isDay ? 'info.day_length' : 'info.night_length', { duration }));
    }
    if (config.show_moon_phase) {
      infos.push(formatMoonPhase(moon, hass));
    }

    const interactive = hasAction(config.tap_action) || hasAction(config.hold_action);

    return html`
      <ha-card
        class=${config.background ? 'with-background' : ''}
        style=${styleMap(this._colorStyles())}
        tabindex=${interactive ? '0' : '-1'}
        role=${interactive ? 'button' : 'img'}
        aria-label=${this._ariaLabel(period)}
      >
        ${config.title ? html`<div class="title">${config.title}</div>` : nothing}
        <svg
          class=${isDay ? 'day' : 'night'}
          viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          ${renderArc()} ${marker} ${labels}
        </svg>
        ${
          infos.length
            ? html`<div class="infos">${infos.map((info) => html`<span>${info}</span>`)}</div>`
            : nothing
        }
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
