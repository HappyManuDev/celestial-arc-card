import { svg } from 'lit';

import { ARC, VIEWBOX_HEIGHT } from './arc';

const BASELINE = VIEWBOX_HEIGHT - 2;

export function renderLabels(startLabel: string, endLabel: string) {
  const { cx, r } = ARC;
  return svg`
    <text class="label" x=${cx - r} y=${BASELINE} text-anchor="start">${startLabel}</text>
    <text class="label" x=${cx + r} y=${BASELINE} text-anchor="end">${endLabel}</text>
  `;
}
