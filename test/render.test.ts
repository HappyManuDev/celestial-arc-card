import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '../src/celestial-arc-card';
import type { CelestialArcCard } from '../src/celestial-arc-card';
import { CARD_TAG } from '../src/const';
import type { HomeAssistant } from '../src/ha-types';

const DAY = {
  next_setting: '2024-06-21T19:58:00Z',
  next_rising: '2024-06-22T03:47:00Z',
};
const NIGHT = {
  next_rising: '2024-06-22T03:47:00Z',
  next_setting: '2024-06-22T19:58:00Z',
};

function mockHass(state: string, attributes: Record<string, unknown>): HomeAssistant {
  return {
    states: {
      'sun.sun': {
        entity_id: 'sun.sun',
        state,
        attributes,
        last_changed: '',
        last_updated: '',
      },
    },
    config: { latitude: 48.85, longitude: 2.35, time_zone: 'Europe/Paris' },
    locale: { language: 'fr', time_format: '24', time_zone: 'server' },
    language: 'fr',
  };
}

async function renderCard(
  hass: HomeAssistant,
  config: Record<string, unknown> = {},
): Promise<CelestialArcCard> {
  const card = document.createElement(CARD_TAG) as CelestialArcCard;
  card.setConfig({ type: `custom:${CARD_TAG}`, ...config });
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  return card;
}

const root = (card: CelestialArcCard) => card.shadowRoot!;
const texts = (card: CelestialArcCard, selector: string) =>
  [...root(card).querySelectorAll(selector)].map((el) => el.textContent?.trim());

describe('rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout'] });
    vi.setSystemTime(new Date('2024-06-21T12:00:00Z'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  it('shows the sun and the sunrise/sunset times during the day', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY));

    expect(root(card).querySelector('svg')?.classList.contains('day')).toBe(true);
    expect(root(card).querySelector('.sun')).not.toBeNull();
    expect(root(card).querySelector('.moon')).toBeNull();
    const labels = texts(card, '.label');
    expect(labels[0]).toMatch(/^05:4\d$/);
    expect(labels[1]).toBe('21:58');
  });

  it('shows the moon at night', async () => {
    vi.setSystemTime(new Date('2024-06-21T23:00:00Z'));
    const card = await renderCard(mockHass('below_horizon', NIGHT));

    expect(root(card).querySelector('svg')?.classList.contains('night')).toBe(true);
    expect(root(card).querySelector('.moon')).not.toBeNull();
    expect(root(card).querySelector('.sun')).toBeNull();
  });

  it('hides the moon with night_mode: none', async () => {
    vi.setSystemTime(new Date('2024-06-21T23:00:00Z'));
    const card = await renderCard(mockHass('below_horizon', NIGHT), { night_mode: 'none' });

    expect(root(card).querySelector('.moon')).toBeNull();
    expect(root(card).querySelector('.arc')).not.toBeNull();
  });

  it('shows the arc without marker when the period is unknown', async () => {
    const card = await renderCard(mockHass('above_horizon', {}));

    expect(root(card).querySelector('.arc')).not.toBeNull();
    expect(root(card).querySelector('.sun')).toBeNull();
    expect(root(card).querySelectorAll('.label')).toHaveLength(0);
  });

  it('warns in the user language when the entity does not exist', async () => {
    const card = await renderCard(mockHass('above_horizon', {}), { entity: 'sun.missing' });

    expect(root(card).querySelector('.warning')?.textContent?.trim()).toBe(
      'Entité introuvable : sun.missing',
    );
  });

  it('hides the times with show_times: false', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY), { show_times: false });

    expect(root(card).querySelectorAll('.label')).toHaveLength(0);
  });

  it('shows the day length and the moon phase when enabled', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY), {
      show_day_length: true,
      show_moon_phase: true,
    });

    const infos = texts(card, '.infos span');
    expect(infos[0]).toMatch(/^Durée du jour 16 h \d\d min$/);
    // 2024-06-21 is one day before the full moon.
    expect(infos[1]).toMatch(/^(Pleine lune|Gibbeuse croissante) · 9\d\s?%$/);
  });

  it('shows a title', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY), { title: 'Ciel' });

    expect(root(card).querySelector('.title')?.textContent).toBe('Ciel');
  });

  it('applies custom colors as CSS variables', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY), {
      colors: { sun: 'red', label: '#123456' },
    });

    const style = root(card).querySelector<HTMLElement>('ha-card')!.style;
    expect(style.getPropertyValue('--cac-sun-color')).toBe('red');
    expect(style.getPropertyValue('--cac-label-color')).toBe('#123456');
  });

  it('describes the arc for screen readers', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY));

    expect(root(card).querySelector('ha-card')?.getAttribute('aria-label')).toMatch(
      /^Soleil levé à 05:4\d, coucher à 21:58, 5\d\s?% de la journée écoulée$/,
    );
  });

  it('moves the marker over time without any sun.sun update', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY), { update_interval: 60 });
    const before = root(card).querySelector('.sun')!.getAttribute('cx');

    vi.advanceTimersByTime(3600 * 1000);
    await card.updateComplete;

    expect(root(card).querySelector('.sun')!.getAttribute('cx')).not.toBe(before);
  });

  it('ignores hass updates that do not concern the sun entity', async () => {
    const hass = mockHass('above_horizon', DAY);
    const card = await renderCard(hass);
    const render = vi.spyOn(card as unknown as { render: () => unknown }, 'render');

    card.hass = { ...hass, states: { ...hass.states, 'light.kitchen': hass.states['sun.sun'] } };
    await card.updateComplete;
    expect(render).not.toHaveBeenCalled();

    card.hass = mockHass('above_horizon', DAY);
    await card.updateComplete;
    expect(render).toHaveBeenCalledTimes(1);
  });
});

describe('actions', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval', 'setTimeout'] });
    vi.setSystemTime(new Date('2024-06-21T12:00:00Z'));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  const press = (card: CelestialArcCard, holdMs: number) => {
    card.dispatchEvent(new MouseEvent('pointerdown', { button: 0 }));
    vi.advanceTimersByTime(holdMs);
    card.dispatchEvent(new MouseEvent('pointerup', { button: 0 }));
  };

  it('fires a more-info tap action by default', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY));
    const events: CustomEvent[] = [];
    card.addEventListener('hass-action', (event) => events.push(event as CustomEvent));

    press(card, 100);

    expect(events).toHaveLength(1);
    expect(events[0].detail.action).toBe('tap');
    expect(events[0].detail.config.tap_action).toEqual({ action: 'more-info' });
    expect(events[0].detail.config.entity).toBe('sun.sun');
  });

  it('fires the hold action after a long press, not the tap action', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY), {
      hold_action: { action: 'navigate', navigation_path: '/lovelace/weather' },
    });
    const events: CustomEvent[] = [];
    card.addEventListener('hass-action', (event) => events.push(event as CustomEvent));

    press(card, 700);

    expect(events.map((event) => event.detail.action)).toEqual(['hold']);
  });

  it('does nothing when actions are disabled', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY), {
      tap_action: { action: 'none' },
    });
    const events: Event[] = [];
    card.addEventListener('hass-action', (event) => events.push(event));

    press(card, 100);

    expect(events).toHaveLength(0);
    expect(root(card).querySelector('ha-card')?.getAttribute('role')).toBe('img');
  });
});
