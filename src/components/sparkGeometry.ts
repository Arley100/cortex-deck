export interface SparkGeometry {
  path: string;
  area: string;
  last: { x: number; y: number } | null;
  baselineY: number | null;
}

/** Pure layout for the sparkline; exported for tests. */
export function sparkGeometry(
  points: number[],
  baseline: number | null,
  higherIsBetter: boolean,
  width: number,
  height: number,
  pad = 4,
): SparkGeometry {
  if (points.length === 0) return { path: "", area: "", last: null, baselineY: null };
  const values = baseline === null ? points : [...points, baseline];
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const y = (v: number) => {
    const t = (v - min) / (max - min);
    const up = higherIsBetter ? t : 1 - t;
    return pad + (1 - up) * (height - pad * 2);
  };
  const x = (i: number) =>
    points.length === 1 ? width / 2 : pad + (i / (points.length - 1)) * (width - pad * 2);
  const coords = points.map((v, i) => ({ x: x(i), y: y(v) }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const first = coords[0] as { x: number; y: number };
  const last = coords[coords.length - 1] as { x: number; y: number };
  const area = `${path} L${last.x.toFixed(1)} ${height} L${first.x.toFixed(1)} ${height} Z`;
  return { path, area, last, baselineY: baseline === null ? null : y(baseline) };
}
