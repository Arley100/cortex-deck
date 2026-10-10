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
      className="inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-wide whitespace-nowrap"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 45%, transparent)`,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
      }}
    >
      {status.kind === "calibrating" ? (
        <span aria-hidden="true" className="flex gap-[2px]">
          {Array.from({ length: status.needed }, (_, i) => (
            <span
              key={i}
              className="h-[7px] w-[3px]"
              style={{
                background: i < status.runs ? "var(--color-cyan)" : "var(--color-edge)",
              }}
            />
          ))}
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}` }}
        />
      )}
      {text}
    </span>
  );
}
