import { svg } from 'lit';

import type { ArcGeometry } from '../astro/progress';

export const VIEWBOX_WIDTH = 200;
export const VIEWBOX_HEIGHT = 118;
export const ARC: ArcGeometry = { cx: 100, cy: 100, r: 80 };

const HORIZON_MARGIN = 8;

export function renderArc() {
  const { cx, cy, r } = ARC;
  return svg`
    <path class="arc" d="M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}"></path>
    <line
      class="horizon"
      x1=${HORIZON_MARGIN}
      y1=${cy}
      x2=${VIEWBOX_WIDTH - HORIZON_MARGIN}
      y2=${cy}
    ></line>
  `;
}
