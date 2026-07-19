import { accentVar } from "../../components/accent";
import { SparklinePlaceholder } from "../../components/SparklinePlaceholder";
import { useAppStore } from "../store";
import { useDrillStatuses } from "../useDrillStatuses";
import type { ScoreUnit } from "../../engine/types";

function fmt(value: number | null, unit: ScoreUnit | null): string {
  if (value === null) return "·";
  if (unit === "%") return `${value}%`;
  if (unit === "ms") return `${value} ms`;
  return `${value}`;
}

export function Faculties() {
  const navigate = useAppStore((s) => s.navigate);
  const rows = useDrillStatuses();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ name: "home" })}
          className="font-mono text-sm text-muted transition active:scale-95"
        >
          ← exit
        </button>
        <div className="text-lg font-extrabold tracking-tight">FACULTIES</div>
      </div>
      <div className="flex flex-col gap-2">
        {(rows ?? []).map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-edge bg-panel px-4 py-3"
          >
            <div className="min-w-0">
              <div className="text-sm font-bold" style={{ color: accentVar[row.accent] }}>
                {row.faculty.toUpperCase()}
              </div>
              <div className="font-mono text-xs text-muted">
                {row.name}
                {row.variant !== "default" ? ` · ${row.variant}` : ""}
              </div>
              <div className="mt-1 font-mono text-xs">
                <span className="text-muted">baseline </span>
                <span>
                  {row.status.kind === "ready" ? fmt(row.status.baseline, row.unit) : "·"}
                </span>
                <span className="text-muted"> · today </span>
                <span>{fmt(row.todayValue, row.unit)}</span>
              </div>
              {row.status.kind === "calibrating" && (
                <div className="font-mono text-[10px] text-muted">
                  calibrating: {row.status.runs}/{row.status.needed} runs
                </div>
              )}
            </div>
            <SparklinePlaceholder points={row.last10} />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        Baselines are rolling medians of your own last 10 runs per drill and variant.
      </p>
    </div>
  );
}
