import type { BaselineStatus } from "../baseline/baseline";

/**
 * Neutral wording only: "below your baseline" is a state, not a verdict.
 */
export function StatusChip({ status }: { status: BaselineStatus }) {
  let text: string;
  let color: string;
  if (status.kind === "calibrating") {
    text = `calibrating: ${status.runs}/${status.needed}`;
    color = "var(--color-muted)";
  } else if (status.today === null) {
    text = "no run today";
    color = "var(--color-muted)";
  } else if (status.today === "above") {
    text = "above baseline";
    color = "var(--color-green)";
  } else if (status.today === "below") {
    text = "below baseline";
    color = "var(--color-amber)";
  } else {
    text = "at baseline";
    color = "var(--color-cyan)";
  }
  return (
    <span
      className="rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-wide"
      style={{ color, borderColor: color }}
    >
      {text}
    </span>
  );
}
