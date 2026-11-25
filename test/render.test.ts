import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '../src/celestial-arc-card';
import type { CelestialArcCard } from '../src/celestial-arc-card';
import { CARD_TAG } from '../src/const';
import type { HomeAssistant } from '../src/ha-types';

const DAY = {
  next_setting: '2024-06-21T19:58:00Z',
  next_rising: '2024-06-22T03:47:00Z',
};
const WINTER_NIGHT = {
  next_rising: '2024-12-22T07:43:00Z',
  next_setting: '2024-12-22T15:56:00Z',
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

  describe('wave layout', () => {
    const WINTER_DAY = {
      next_setting: '2024-12-21T15:56:00Z',
      next_rising: '2024-12-22T07:43:00Z',
    };

    it('shows the sun on the 24-hour curve with the times on the horizon', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'wave' });

      expect(root(card).querySelector('ha-card')?.classList.contains('wave')).toBe(true);
      expect(texts(card, '.wave-phase')[0]).toBe('Jour');
      expect(root(card).querySelector('.wave-curve-day')).not.toBeNull();
      expect(root(card).querySelector('.sun')).not.toBeNull();
      const labels = texts(card, '.label');
      expect(labels[0]).toMatch(/^05:4\d$/);
      expect(labels[1]).toBe('21:58');
      expect(texts(card, '.wave-axis')).toEqual(['06 h', '12 h', '18 h']);
    });

    it('places the marker at the current time of day', async () => {
      // 14:00 in Paris = 7/12 of the default 300 px width.
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'wave' });

      expect(Number(root(card).querySelector('.sun')!.getAttribute('cx'))).toBeCloseTo(175, 0);
    });

    it('shows the moon and the night phase at night', async () => {
      vi.setSystemTime(new Date('2024-12-21T23:00:00Z'));
      const card = await renderCard(mockHass('below_horizon', WINTER_NIGHT), { layout: 'wave' });

      expect(texts(card, '.wave-phase')[0]).toBe('Nuit');
      expect(root(card).querySelector('.moon')).not.toBeNull();
      expect(root(card).querySelector('.sun')).toBeNull();
      expect(texts(card, '.label')).toEqual(['08:43', expect.stringMatching(/^16:5\d$/)]);
    });

    it('names the twilight and draws its bands', async () => {
      vi.setSystemTime(new Date('2024-12-21T17:00:00Z'));
      const card = await renderCard(mockHass('below_horizon', WINTER_NIGHT), { layout: 'wave' });

      expect(texts(card, '.wave-phase')[0]).toBe('Crépuscule nautique');
      expect(root(card).querySelectorAll('.wave-band')).toHaveLength(4);
    });

    it('says dawn in the morning', async () => {
      vi.setSystemTime(new Date('2024-12-22T07:20:00Z'));
      const card = await renderCard(mockHass('below_horizon', WINTER_NIGHT), { layout: 'wave' });

      expect(texts(card, '.wave-phase')[0]).toBe('Aube civile');
    });

    it('draws nothing below the horizon with night_mode: none', async () => {
      vi.setSystemTime(new Date('2024-12-21T23:00:00Z'));
      const card = await renderCard(mockHass('below_horizon', WINTER_NIGHT), {
        layout: 'wave',
        night_mode: 'none',
      });

      expect(root(card).querySelector('.moon')).toBeNull();
      expect(root(card).querySelector('.wave-curve-night')).not.toBeNull();
    });

    it('follows the card options: background, infos, times', async () => {
      vi.setSystemTime(new Date('2024-12-21T12:00:00Z'));
      const card = await renderCard(mockHass('above_horizon', WINTER_DAY), {
        layout: 'wave',
        background: true,
        show_day_length: true,
        show_times: false,
      });

      expect(root(card).querySelector('ha-card')?.classList.contains('with-background')).toBe(true);
      expect(texts(card, '.infos span')[0]).toMatch(/^Durée du jour 8 h \d\d min$/);
      expect(root(card).querySelectorAll('.label')).toHaveLength(0);
    });

    it('still draws the curve during polar day', async () => {
      const card = await renderCard(mockHass('above_horizon', {}), { layout: 'wave' });

      expect(root(card).querySelector('.wave-curve-day')).not.toBeNull();
      expect(root(card).querySelector('.sun')).not.toBeNull();
      expect(root(card).querySelectorAll('.label')).toHaveLength(0);
    });

    it('keeps the screen reader description', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'wave' });

      expect(root(card).querySelector('ha-card')?.getAttribute('aria-label')).toMatch(
        /^Soleil levé à 05:4\d, coucher à 21:58/,
      );
    });

    it('takes half the width in sections views', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'wave' });

      expect(card.getGridOptions().columns).toBe(6);
    });
  });

  describe('sky layout', () => {
    it('draws the sun and moon curves with their times and the current time', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'sky' });

      expect(root(card).querySelector('ha-card')?.classList.contains('sky')).toBe(true);
      expect(root(card).querySelector('svg.sky')).not.toBeNull();
      expect(root(card).querySelector('.sky-sun')).not.toBeNull();
      expect(root(card).querySelector('.sky-moon')).not.toBeNull();
      expect(root(card).querySelector('.sun')).not.toBeNull();
      expect(root(card).querySelector('.moon')).not.toBeNull();
      const times = texts(card, '.sky-time');
      expect(times).toContainEqual(expect.stringMatching(/^↑ 05:4\d$/));
      expect(times).toContainEqual(expect.stringMatching(/^↓ 21:5\d$/));
      expect(root(card).querySelectorAll('.sky-event-moon').length).toBeGreaterThan(0);
      expect(texts(card, '.sky-now-label')).toEqual(['14:00']);
      expect(root(card).querySelector('.sky-axis')).toBeNull();
    });

    it('places the markers at the current time of day', async () => {
      // 14:00 in Paris = 7/12 of the default 300 px width.
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'sky' });

      expect(Number(root(card).querySelector('.sun')!.getAttribute('cx'))).toBeCloseTo(175, 0);
      expect(Number(root(card).querySelector('.moon-halo')!.getAttribute('cx'))).toBeCloseTo(
        175,
        0,
      );
    });

    it('keeps it simple by default: no summary, no infos', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'sky' });

      expect(root(card).querySelector('.sky-summary')).toBeNull();
      expect(root(card).querySelector('.infos')).toBeNull();
    });

    it('shows the summary sentence and the legend when enabled', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), {
        layout: 'sky',
        show_summary: true,
      });

      expect(texts(card, '.sky-summary')[0]?.replace(/\s+/g, ' ')).toMatch(
        /^Le soleil est là pour encore 7 h 5\d min\. La lune se (lève|couche) (demain )?à \d\d:\d\d\.$/,
      );
      expect(texts(card, '.sky-legend span')).toEqual(['Soleil', 'Lune']);
    });

    it('hides the moon with night_mode: none', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), {
        layout: 'sky',
        night_mode: 'none',
      });

      expect(root(card).querySelector('.sky-moon')).toBeNull();
      expect(root(card).querySelector('.moon')).toBeNull();
      expect(root(card).querySelector('.sky-event-moon')).toBeNull();
    });

    it('hides the times with show_times: false', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), {
        layout: 'sky',
        show_times: false,
      });

      expect(root(card).querySelectorAll('.sky-time')).toHaveLength(0);
    });

    it('asks for the home location when it is missing', async () => {
      const hass = mockHass('above_horizon', DAY);
      hass.config = { ...hass.config, latitude: undefined as unknown as number };
      const card = await renderCard(hass, { layout: 'sky' });

      expect(texts(card, '.warning')[0]).toMatch(/position de votre domicile/);
    });

    it('takes half the width in sections views', async () => {
      const card = await renderCard(mockHass('above_horizon', DAY), { layout: 'sky' });

      expect(card.getGridOptions().columns).toBe(6);
    });
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

  it('fires the tap action once when Enter is held down', async () => {
    const card = await renderCard(mockHass('above_horizon', DAY));
    const events: Event[] = [];
    card.addEventListener('hass-action', (event) => events.push(event));

    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true }));

    expect(events).toHaveLength(1);
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
