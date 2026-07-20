import { accentVar } from "../../components/accent";
import { StatusChip } from "../../components/StatusChip";
import { useAppStore } from "../store";
import { useDrillStatuses } from "../useDrillStatuses";

function Pulse() {
  return (
    <div className="flex items-center gap-1 font-mono">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: "var(--color-cyan)", boxShadow: "0 0 8px var(--color-cyan)" }}
      />
      <span className="text-xs tracking-widest text-muted">LOCAL</span>
    </div>
  );
}

export function Home() {
  const navigate = useAppStore((s) => s.navigate);
  const rows = useDrillStatuses();

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">
          CORTEX<span className="text-cyan">·</span>DECK
        </h1>
        <Pulse />
      </div>
      <p className="mb-6 text-sm text-muted">
        Six drills, six faculties. Honest scores against your own baseline.
      </p>
      <div className="flex flex-col gap-3">
        {(rows ?? []).map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => navigate({ name: "drill", id: row.id })}
            className="flex items-center gap-4 rounded-2xl border border-edge bg-panel p-4 text-left transition active:scale-[0.98]"
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-panel-hi text-xl"
              style={{
                color: accentVar[row.accent],
                borderColor: `color-mix(in srgb, ${accentVar[row.accent]} 27%, transparent)`,
              }}
            >
              {row.glyph}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold">{row.name}</div>
              <div className="font-mono text-xs tracking-wide text-muted">
                {row.faculty.toUpperCase()}
              </div>
              <div className="mt-1">
                <StatusChip status={row.status} />
              </div>
            </div>
            <span style={{ color: accentVar[row.accent] }}>→</span>
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => navigate({ name: "faculties" })}
          className="flex-1 rounded-2xl border border-dashed border-edge p-3 font-mono text-xs tracking-widest text-muted transition active:scale-[0.98]"
        >
          FACULTIES
        </button>
        <button
          type="button"
          onClick={() => navigate({ name: "prepost" })}
          className="flex-1 rounded-2xl border border-dashed border-edge p-3 font-mono text-xs tracking-widest text-muted transition active:scale-[0.98]"
        >
          PRE / POST
        </button>
        <button
          type="button"
          onClick={() => navigate({ name: "settings" })}
          className="flex-1 rounded-2xl border border-dashed border-edge p-3 font-mono text-xs tracking-widest text-muted transition active:scale-[0.98]"
        >
          SETTINGS
        </button>
      </div>
      <p className="mt-auto pt-6 text-center text-xs leading-relaxed text-muted">
        These drills train the practiced task; transfer to anything else is limited. You
        get better at what you practice. Enjoy the reps.
      </p>
    </>
  );
}
