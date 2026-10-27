import { afterEach, describe, expect, it } from 'vitest';

import '../src/celestial-arc-card';
import { CelestialArcCard } from '../src/celestial-arc-card';
import { CARD_TAG, EDITOR_TAG } from '../src/const';
import { CelestialArcCardEditor, cleanConfig } from '../src/editor';
import type { HomeAssistant } from '../src/ha-types';
import type { CelestialArcCardConfig } from '../src/types';

const TYPE = `custom:${CARD_TAG}`;
const hass = {
  states: {},
  config: { latitude: 0, longitude: 0, time_zone: 'UTC' },
  locale: { language: 'fr' },
  language: 'fr',
} as HomeAssistant;

interface FormLike extends HTMLElement {
  data: Record<string, unknown>;
  schema: { name: string; schema?: { name: string }[] }[];
  computeLabel: (item: { name: string }) => string;
  computeHelper: (item: { name: string }) => string | undefined;
}

async function renderEditor(config: Record<string, unknown>) {
  const editor = CelestialArcCard.getConfigElement() as CelestialArcCardEditor;
  editor.hass = hass;
  editor.setConfig({ type: TYPE, ...config });
  document.body.appendChild(editor);
  await editor.updateComplete;
  const form = editor.shadowRoot!.querySelector('ha-form') as FormLike;
  return { editor, form };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('editor', () => {
  it('is returned by getConfigElement', () => {
    expect(CelestialArcCard.getConfigElement().tagName.toLowerCase()).toBe(EDITOR_TAG);
  });

  it('shows the defaults and the user values in the form', async () => {
    const { form } = await renderEditor({ title: 'Ciel' });

    expect(form.data.title).toBe('Ciel');
    expect(form.data.show_times).toBe(true);
    expect(form.data.night_mode).toBe('moon');
  });

  it('labels fields in the user language', async () => {
    const { form } = await renderEditor({});

    expect(form.computeLabel({ name: 'night_mode' })).toBe('La nuit');
    expect(form.computeLabel({ name: 'tap_action' })).toBe('Action au clic');
    expect(form.computeHelper({ name: 'update_interval' })).toMatch(/secondes/);
    expect(form.computeHelper({ name: 'title' })).toBeUndefined();
  });

  it('only exposes options the card knows', async () => {
    const { form } = await renderEditor({});
    const names = form.schema.flatMap((item) =>
      item.schema ? item.schema.map((child) => child.name) : [item.name],
    );

    const card = document.createElement(CARD_TAG) as CelestialArcCard;
    for (const name of names.filter(
      (n) => !['day_arc', 'night_arc', 'sun', 'moon', 'label'].includes(n),
    )) {
      // Every editor field must be accepted by the card validation.
      expect(() => card.setConfig({ type: TYPE, [name]: undefined })).not.toThrow();
    }
    expect(names).toEqual(
      expect.arrayContaining(['entity', 'night_mode', 'show_moon_phase', 'tap_action', 'sun']),
    );
  });

  it('fires config-changed with only the changed values', async () => {
    const { editor, form } = await renderEditor({ entity: 'sun.sun' });
    const events: CustomEvent[] = [];
    editor.addEventListener('config-changed', (event) => events.push(event as CustomEvent));

    form.dispatchEvent(
      new CustomEvent('value-changed', {
        detail: { value: { ...form.data, show_moon_phase: true, title: '' } },
      }),
    );

    expect(events).toHaveLength(1);
    expect(events[0].detail.config).toEqual({
      type: TYPE,
      entity: 'sun.sun',
      show_moon_phase: true,
    });
  });
});

describe('cleanConfig', () => {
  const clean = (config: Record<string, unknown>) =>
    cleanConfig({ type: TYPE, ...config } as CelestialArcCardConfig);

  it('drops empty values and defaults but keeps the entity', () => {
    expect(
      clean({
        entity: 'sun.sun',
        title: '',
        show_times: true,
        update_interval: 60,
        tap_action: { action: 'more-info' },
        background: true,
      }),
    ).toEqual({ type: TYPE, entity: 'sun.sun', background: true });
  });

  it('keeps only the colors that are set', () => {
    expect(clean({ colors: { sun: 'red', moon: '' } })).toEqual({
      type: TYPE,
      colors: { sun: 'red' },
    });
    expect(clean({ colors: { sun: '' } })).toEqual({ type: TYPE });
  });

  it('keeps non-default actions', () => {
    expect(clean({ tap_action: { action: 'none' } })).toEqual({
      type: TYPE,
      tap_action: { action: 'none' },
    });
  });
});
