import { css } from 'lit';

// Every color can be overridden with a CSS variable (theme, card-mod, `colors` option).
// Text defaults to the Home Assistant theme colors, so the card works in light and dark mode.
export const cardStyles = css`
  ha-card {
    display: block;
    border-radius: var(--ha-card-border-radius, 12px);
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

  /* Wave layout: same palette as the arc, twilight bands below the horizon. */
  .wave-phase {
    padding: 0 8px 4px;
    color: var(--cac-label-color, var(--primary-text-color, #212121));
    font-size: 16px;
    font-weight: 500;
  }

  .wave-day {
    opacity: 0.12;
  }

  .wave-day-stop {
    stop-color: var(--cac-day-arc-color, #c9a35a);
  }

  .wave-band {
    fill: var(--cac-night-arc-color, #7c8ba1);
  }

  .wave-civil {
    opacity: 0.1;
  }

  .wave-nautical {
    opacity: 0.19;
  }

  .wave-astronomical {
    opacity: 0.28;
  }

  .wave-night {
    opacity: 0.38;
  }

  .wave-curve {
    fill: none;
    stroke-width: 2;
    stroke-dasharray: 4 4;
  }

  .wave-curve-day {
    stroke: var(--cac-day-arc-color, #c9a35a);
    opacity: 0.85;
  }

  .wave-curve-night {
    stroke: var(--cac-night-arc-color, #7c8ba1);
    opacity: 0.8;
  }

  svg.wave .horizon {
    opacity: 0.45;
  }

  .wave-event {
    fill: var(--cac-day-arc-color, #c9a35a);
  }

  .wave-tick {
    stroke: var(--secondary-text-color, #727272);
    stroke-width: 1;
    opacity: 0.5;
  }

  .wave-axis {
    fill: var(--secondary-text-color, #727272);
    font-size: 10px;
  }

  ha-card.wave .infos {
    justify-content: flex-start;
    padding: 4px 8px 0;
  }

  /* Sky layout: real altitude of the sun and the moon over 24 hours. */
  .sky-head {
    padding: 0 8px 4px;
  }

  .sky-summary {
    margin: 0;
    color: var(--cac-label-color, var(--primary-text-color, #212121));
    font-size: 16px;
    font-weight: 500;
    line-height: 1.35;
  }

  .sky-hl-sun {
    color: color-mix(
      in srgb,
      var(--cac-day-arc-color, #c9a35a) 75%,
      var(--primary-text-color, #212121)
    );
  }

  .sky-hl-moon {
    color: color-mix(
      in srgb,
      var(--cac-night-arc-color, #7c8ba1) 75%,
      var(--primary-text-color, #212121)
    );
  }

  .sky-legend {
    display: flex;
    gap: 14px;
    margin-top: 6px;
    color: var(--secondary-text-color, #727272);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .sky-legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .sky-legend i {
    width: 14px;
    height: 2px;
    border-radius: 1px;
  }

  .sky-legend-sun {
    background: var(--cac-day-arc-color, #c9a35a);
  }

  .sky-legend-moon {
    background: var(--cac-night-arc-color, #7c8ba1);
  }

  .sky-grid {
    stroke: var(--secondary-text-color, #727272);
    stroke-width: 1;
    stroke-dasharray: 1 3;
    opacity: 0.35;
  }

  .sky-sun-stop {
    stop-color: var(--cac-day-arc-color, #c9a35a);
  }

  .sky-moon-stop {
    stop-color: var(--cac-night-arc-color, #7c8ba1);
  }

  .sky-curve {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
  }

  .sky-sun {
    stroke: var(--cac-day-arc-color, #c9a35a);
  }

  .sky-moon {
    stroke: var(--cac-night-arc-color, #7c8ba1);
  }

  .sky-below {
    stroke-width: 1.5;
    stroke-dasharray: 1 4;
  }

  .sky-horizon {
    stroke: var(--primary-text-color, #212121);
    stroke-width: 1.5;
    stroke-linecap: round;
    opacity: 0.45;
  }

  .sky-daylight {
    stroke: var(--cac-day-arc-color, #c9a35a);
    stroke-width: 2.5;
    stroke-linecap: round;
    opacity: 0.55;
  }

  .sky-now {
    stroke: var(--primary-text-color, #212121);
    stroke-width: 1;
    opacity: 0.6;
  }

  .sky-now-label {
    fill: var(--cac-label-color, var(--primary-text-color, #212121));
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  .sky-event {
    stroke: var(--ha-card-background, var(--card-background-color, #fff));
    stroke-width: 1.5;
  }

  .sky-event-sun,
  .sky-arrow-sun {
    fill: var(--cac-day-arc-color, #c9a35a);
  }

  .sky-event-moon,
  .sky-arrow-moon {
    fill: var(--cac-night-arc-color, #7c8ba1);
  }

  svg.sky .label {
    font-size: 11px;
    font-weight: 500;
  }

  ha-card.sky .infos {
    justify-content: flex-start;
    padding: 4px 8px 0;
  }

  .warning {
    padding: 16px;
    color: var(--error-color, #db4437);
  }
`;
