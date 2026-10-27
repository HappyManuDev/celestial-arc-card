import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '../src/celestial-arc-card';
import type { CelestialArcCard } from '../src/celestial-arc-card';
import { CARD_TAG } from '../src/const';
import type { HomeAssistant } from '../src/ha-types';

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

async function renderCard(hass: HomeAssistant): Promise<ShadowRoot> {
  const card = document.createElement(CARD_TAG) as CelestialArcCard;
  card.setConfig({ type: `custom:${CARD_TAG}` });
  card.hass = hass;
  document.body.appendChild(card);
  await card.updateComplete;
  return card.shadowRoot!;
}

describe('rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('shows the sun and the sunrise/sunset times during the day', async () => {
    vi.setSystemTime(new Date('2024-06-21T12:00:00Z'));
    const root = await renderCard(
      mockHass('above_horizon', {
        next_setting: '2024-06-21T19:58:00Z',
        next_rising: '2024-06-22T03:47:00Z',
      }),
    );

    expect(root.querySelector('svg')?.classList.contains('day')).toBe(true);
    expect(root.querySelector('.sun')).not.toBeNull();
    expect(root.querySelector('.moon')).toBeNull();
    const labels = [...root.querySelectorAll('.label')].map((el) => el.textContent?.trim());
    expect(labels[0]).toMatch(/^05:4\d$/);
    expect(labels[1]).toBe('21:58');
  });

  it('shows the moon at night', async () => {
    vi.setSystemTime(new Date('2024-06-21T23:00:00Z'));
    const root = await renderCard(
      mockHass('below_horizon', {
        next_rising: '2024-06-22T03:47:00Z',
        next_setting: '2024-06-22T19:58:00Z',
      }),
    );

    expect(root.querySelector('svg')?.classList.contains('night')).toBe(true);
    expect(root.querySelector('.moon')).not.toBeNull();
    expect(root.querySelector('.sun')).toBeNull();
  });

  it('shows the arc without marker when the period is unknown', async () => {
    vi.setSystemTime(new Date('2024-06-21T12:00:00Z'));
    const root = await renderCard(mockHass('above_horizon', {}));

    expect(root.querySelector('.arc')).not.toBeNull();
    expect(root.querySelector('.sun')).toBeNull();
    expect(root.querySelectorAll('.label')).toHaveLength(0);
  });

  it('warns when the entity does not exist', async () => {
    const card = document.createElement(CARD_TAG) as CelestialArcCard;
    card.setConfig({ type: `custom:${CARD_TAG}`, entity: 'sun.missing' });
    card.hass = mockHass('above_horizon', {});
    document.body.appendChild(card);
    await card.updateComplete;

    expect(card.shadowRoot!.querySelector('.warning')?.textContent).toContain('sun.missing');
  });
});
