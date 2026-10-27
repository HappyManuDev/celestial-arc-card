export interface Point {
  x: number;
  y: number;
}

export interface ArcGeometry {
  cx: number;
  cy: number;
  r: number;
}

export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/** Elapsed fraction of the [start, end] interval at `now`, clamped to [0, 1]. */
export function progressBetween(start: Date, end: Date, now: Date): number {
  const duration = end.getTime() - start.getTime();
  if (!(duration > 0)) {
    return 0;
  }
  return clamp01((now.getTime() - start.getTime()) / duration);
}

/** Point on the upper half circle: t = 0 is the left end, t = 1 the right end. */
export function arcPoint(t: number, { cx, cy, r }: ArcGeometry): Point {
  const angle = Math.PI * (1 - clamp01(t));
  return {
    x: cx + r * Math.cos(angle),
    y: cy - r * Math.sin(angle),
  };
}
