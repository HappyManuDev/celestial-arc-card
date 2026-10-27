import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import { COLOR_KEYS, DEFAULT_CONFIG, MIN_UPDATE_INTERVAL } from './config';
import { EDITOR_TAG } from './const';
import type { HomeAssistant } from './ha-types';
import { localize } from './localize/localize';
import type { CelestialArcCardConfig } from './types';

interface SchemaItem {
  name: string;
  type?: 'grid' | 'expandable';
  flatten?: boolean;
  icon?: string;
  selector?: Record<string, unknown>;
  schema?: SchemaItem[];
}

function buildSchema(hass?: HomeAssistant): SchemaItem[] {
  return [
    { name: 'entity', selector: { entity: { filter: { domain: 'sun' } } } },
    { name: 'title', selector: { text: {} } },
    {
      name: 'night_mode',
      selector: {
        select: {
          mode: 'dropdown',
          options: [
            { value: 'moon', label: localize(hass, 'editor.night_mode_options.moon') },
            { value: 'none', label: localize(hass, 'editor.night_mode_options.none') },
          ],
        },
      },
    },
    {
      name: '',
      type: 'grid',
      schema: [
        { name: 'show_times', selector: { boolean: {} } },
        { name: 'show_day_length', selector: { boolean: {} } },
        { name: 'show_moon_phase', selector: { boolean: {} } },
        { name: 'background', selector: { boolean: {} } },
      ],
    },
    {
      name: 'update_interval',
      selector: {
        number: {
          min: MIN_UPDATE_INTERVAL,
          max: 3600,
          step: 10,
          mode: 'box',
          unit_of_measurement: 's',
        },
      },
    },
    {
      // Not flattened: values are stored under `colors:`.
      name: 'colors',
      type: 'expandable',
      icon: 'mdi:palette',
      schema: COLOR_KEYS.map((key) => ({ name: key, selector: { text: {} } })),
    },
    {
      name: 'interactions',
      type: 'expandable',
      flatten: true,
      icon: 'mdi:gesture-tap',
      schema: [
        { name: 'tap_action', selector: { ui_action: {} } },
        { name: 'hold_action', selector: { ui_action: {} } },
      ],
    },
  ];
}

const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === '' ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0);

const KEPT_WHEN_DEFAULT = new Set(['type', 'entity']);

const isDefault = (key: string, value: unknown): boolean =>
  !KEPT_WHEN_DEFAULT.has(key) &&
  key in DEFAULT_CONFIG &&
  JSON.stringify(DEFAULT_CONFIG[key as keyof typeof DEFAULT_CONFIG]) === JSON.stringify(value);

/**
 * Removes empty values and values equal to their default, so that the saved
 * YAML only contains what the user actually changed.
 */
export function cleanConfig(config: CelestialArcCardConfig): CelestialArcCardConfig {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (isDefault(key, value)) {
      continue;
    }
    if (key === 'colors' && value && typeof value === 'object') {
      const colors = Object.fromEntries(
        Object.entries(value).filter(([, color]) => !isEmpty(color)),
      );
      if (!isEmpty(colors)) cleaned.colors = colors;
    } else if (!isEmpty(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned as CelestialArcCardConfig;
}

export class CelestialArcCardEditor extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: CelestialArcCardConfig;

  public setConfig(config: CelestialArcCardConfig): void {
    this._config = config;
  }

  private _computeLabel = (item: SchemaItem): string =>
    localize(this.hass, `editor.${item.name}.label`);

  private _computeHelper = (item: SchemaItem): string | undefined => {
    const key = `editor.${item.name}.helper`;
    const helper = localize(this.hass, key);
    return helper === key ? undefined : helper;
  };

  private _valueChanged(event: CustomEvent<{ value: CelestialArcCardConfig }>): void {
    event.stopPropagation();
    const config = cleanConfig({ ...event.detail.value, type: this._config?.type ?? '' });
    this._config = config;
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }),
    );
  }

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }
    // Defaults are shown in the form, but only changed values are saved.
    const data = { ...DEFAULT_CONFIG, ...this._config };
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${buildSchema(this.hass)}
        .computeLabel=${this._computeLabel}
        .computeHelper=${this._computeHelper}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  static styles = css`
    ha-form {
      display: block;
    }
  `;
}

if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, CelestialArcCardEditor);
}
