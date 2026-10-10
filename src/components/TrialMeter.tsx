interface TrialMeterProps {
  /** 0-based index of the current trial */
  current: number;
  total: number;
  color: string;
}

/** Segmented progress bar: one tick per trial. */
export function TrialMeter({ current, total, color }: TrialMeterProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex justify-between font-mono text-[10px] tracking-[0.25em] text-muted">
        <span>TRIAL</span>
        <span className="tabular-nums">
          {String(current + 1).padStart(2, "0")} / {total}
        </span>
      </div>
      <div
        className="flex w-full gap-[3px]"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current + 1}
        aria-label="trial progress"
      >
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-1 flex-1 transition-colors duration-300"
            style={{
              background:
                i < current
                  ? `color-mix(in srgb, ${color} 55%, transparent)`
                  : i === current
                    ? color
                    : "var(--color-edge)",
              boxShadow: i === current ? `0 0 8px ${color}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** Thin bar that drains as a timed drill runs. */
export function TimeBar({ left, total, color }: { left: number; total: number; color: string }) {
  const urgent = left <= 10;
  const c = urgent ? "var(--color-rose)" : color;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex justify-between font-mono text-[10px] tracking-[0.25em] text-muted">
        <span>TIME</span>
        <span className="tabular-nums" style={{ color: urgent ? "var(--color-rose)" : undefined }}>
          {left}s
        </span>
      </div>
      <div className="h-1 w-full bg-edge">
        <div
          className="h-full transition-[width] duration-1000 ease-linear"
          style={{ width: `${(left / total) * 100}%`, background: c, boxShadow: `0 0 10px ${c}` }}
        />
      </div>
    </div>
  );
}
