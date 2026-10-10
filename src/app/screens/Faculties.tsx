import { accentVar } from "../../components/accent";
import { formatValue } from "../../components/format";
import { GlitchText } from "../../components/GlitchText";
import { Sparkline } from "../../components/Sparkline";
import { StatusChip } from "../../components/StatusChip";
import { sound } from "../../audio/engine";
import { useAppStore } from "../store";
import { useDrillStatuses } from "../useDrillStatuses";

export function Faculties() {
  const navigate = useAppStore((s) => s.navigate);
  const rows = useDrillStatuses();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            sound.play("tap");
            navigate({ name: "home" });
          }}
          className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-muted transition hover:text-fg active:scale-95"
        >
          <span aria-hidden="true">←</span> EXIT
        </button>
        <h1 className="font-mono text-lg font-extrabold tracking-[0.12em] text-cyan">
          <GlitchText text="FACULTIES" />
        </h1>
      </div>
      <div className="hud-rule mb-6" />

      <div className="grid gap-3 md:grid-cols-2">
        {(rows ?? []).map((row, i) => {
          const color = accentVar[row.accent];
          return (
            <article
              key={row.id}
              className="glass rise relative flex items-center justify-between gap-3 overflow-hidden rounded-xl py-3 pr-3 pl-4"
              style={{ ["--d" as string]: `${i * 60}ms` }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: color, boxShadow: `0 0 12px ${color}` }}
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-semibold" style={{ color }}>
                  {row.faculty.replace(" · ", ", ")}
                </h2>
                <div className="font-mono text-[10px] tracking-wider text-muted">
                  {row.name.toUpperCase()}
                  {row.variant !== "default" ? ` · ${row.variant.toUpperCase()}` : ""}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 font-mono text-[11px]">
                  <div>
                    <dt className="text-[9px] tracking-[0.2em] text-muted">BASELINE</dt>
                    <dd className="font-bold tabular-nums">
                      {row.status.kind === "ready" ? formatValue(row.status.baseline, row.unit) : "·"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[9px] tracking-[0.2em] text-muted">TODAY</dt>
                    <dd className="font-bold tabular-nums">{formatValue(row.todayValue, row.unit)}</dd>
                  </div>
                </dl>
                <div className="mt-2">
                  {row.status.kind === "calibrating" ? (
                    <span className="font-mono text-[10px] text-muted">
                      calibrating: {row.status.runs}/{row.status.needed} runs
                    </span>
                  ) : (
                    <StatusChip status={row.status} />
                  )}
                </div>
              </div>
              <Sparkline
                points={row.last10}
                baseline={row.status.kind === "ready" ? row.status.baseline : null}
                higherIsBetter={row.higherIsBetter}
                color={color}
                label={`${row.name}: last ${row.last10.length} runs${
                  row.status.kind === "ready" ? `, baseline ${formatValue(row.status.baseline, row.unit)}` : ""
                }`}
              />
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        Baselines are rolling medians of your own last 10 runs per drill and variant. In
        each trend line, up means better (for Reaction, faster); the dashed line is your
        baseline.
      </p>
    </div>
  );
}
