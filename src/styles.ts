import { css } from 'lit';

// Every color can be overridden with a CSS variable (theme, card-mod, `colors` option).
// Text defaults to the Home Assistant theme colors, so the card works in light and dark mode.
export const cardStyles = css`
  ha-card {
    background: none;
    box-shadow: none;
    border: none;
    padding: 8px 4px;
    font-family: var(--cac-font-family, inherit);
    outline: none;
  }

  ha-card.with-background {
    background: var(--ha-card-background, var(--card-background-color));
    box-shadow: var(--ha-card-box-shadow);
    border: var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color));
    padding: 12px 8px;
  }

  ha-card[role='button'] {
    cursor: pointer;
  }

  ha-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .title {
    padding: 0 8px 8px;
    color: var(--primary-text-color);
    font-size: 16px;
    font-weight: 500;
  }

  svg {
    display: block;
    width: 100%;
    overflow: visible;
  }

  .arc {
    fill: none;
    stroke: var(--cac-day-arc-color, #c9a35a);
    stroke-width: 2;
    stroke-dasharray: 4 4;
    opacity: 0.55;
  }

  .horizon {
    stroke: var(--cac-day-arc-color, #c9a35a);
    stroke-width: 1;
    opacity: 0.35;
  }

  .night .arc,
  .night .horizon {
    stroke: var(--cac-night-arc-color, #7c8ba1);
  }

  .sun-halo {
    fill: var(--cac-sun-color, #f2b544);
    opacity: 0.25;
  }

  .sun {
    fill: var(--cac-sun-color, #f2b544);
  }

  .moon-halo {
    fill: var(--cac-moon-halo-color, #8fa3c9);
    opacity: 0.22;
  }

  .moon-shadow {
    fill: var(--cac-moon-halo-color, #8fa3c9);
    opacity: 0.35;
  }

  .moon {
    fill: var(--cac-moon-color, #d7deed);
  }

  .label {
    fill: var(--cac-label-color, var(--primary-text-color, #212121));
    font-size: 12px;
    font-weight: 600;
  }

  .infos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 16px;
    padding-top: 8px;
    color: var(--cac-label-color, var(--secondary-text-color, #727272));
    font-size: 13px;
  }

  .warning {
    padding: 16px;
    color: var(--error-color, #db4437);
  }
`;
