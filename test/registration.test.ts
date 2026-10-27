import { describe, expect, it } from 'vitest';

import '../src/celestial-arc-card';
import { CARD_TAG } from '../src/const';

describe('registration', () => {
  it('defines the custom element', () => {
    expect(customElements.get(CARD_TAG)).toBeDefined();
  });

  it('registers itself in the card picker', () => {
    expect(window.customCards?.some((card) => card.type === CARD_TAG)).toBe(true);
  });

  it('uses sun.sun as default entity', () => {
    const card = document.createElement(CARD_TAG) as HTMLElement & {
      setConfig(config: object): void;
      _config: { entity: string };
    };
    card.setConfig({ type: `custom:${CARD_TAG}` });
    expect(card._config.entity).toBe('sun.sun');
  });
});
