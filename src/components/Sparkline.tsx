import { useId } from "react";
import { sparkGeometry } from "./sparkGeometry";

interface SparklineProps {
  /** oldest first */
  points: number[];
  baseline: number | null;
  /** when false (Reaction), the y axis flips so up always means better */
  higherIsBetter: boolean;
  color: string;
  width?: number;
  height?: number;
  label: string;
}

/** Tiny inline SVG trend of the last runs; no chart library. */
export function Sparkline({
  points,
  baseline,
  higherIsBetter,
  color,
  width = 112,
  height = 38,
  label,
}: SparklineProps) {
  const id = useId().replace(/:/g, "");
  const g = sparkGeometry(points, baseline, higherIsBetter, width, height);

  if (!g.last) {
    return (
      <div
        className="flex items-center justify-center rounded-sm border border-dashed border-edge font-mono text-[10px] text-muted"
        style={{ width, height }}
      >
        no runs yet
      </div>
    );
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <defs>
        <linearGradient id={`sf-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {g.baselineY !== null && (
        <line
          x1="0"
          x2={width}
          y1={g.baselineY}
          y2={g.baselineY}
          stroke="var(--color-muted)"
          strokeOpacity="0.55"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
      )}
      {points.length > 1 && <path d={g.area} fill={`url(#sf-${id})`} />}
      {points.length > 1 && (
        <path d={g.path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      )}
      <circle cx={g.last.x} cy={g.last.y} r="5" fill={color} opacity="0.25" />
      <circle cx={g.last.x} cy={g.last.y} r="2.4" fill={color} />
    </svg>
  );
}
