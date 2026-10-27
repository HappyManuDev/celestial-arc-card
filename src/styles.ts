import { css } from 'lit';

// Every color can be overridden with a CSS variable (theme, card-mod...).
export const cardStyles = css`
  ha-card {
    background: none;
    box-shadow: none;
    border: none;
    padding: 8px 4px;
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
    fill: var(--cac-label-color, #5c4a33);
    font-family: var(--cac-font-family, inherit);
    font-size: 12px;
    font-weight: 600;
  }

  .warning {
    padding: 16px;
    color: var(--error-color, #db4437);
  }
`;
