/**
 * Placeholder for the last-10-runs sparkline. The real version is a tiny
 * inline SVG (no chart library); it lands in a follow-up polish pass.
 */
export function SparklinePlaceholder({ points }: { points: number[] }) {
  return (
    <div
      className="flex h-8 w-24 items-center justify-center rounded border border-dashed border-edge font-mono text-[10px] text-muted"
      title="trend chart coming soon"
    >
      {points.length > 0 ? `${points.length} runs` : "no runs"}
    </div>
  );
}
