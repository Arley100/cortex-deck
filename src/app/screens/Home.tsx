import type { PointerEvent } from "react";
import { sound } from "../../audio/engine";
import { accentVar } from "../../components/accent";
import { Btn } from "../../components/Btn";
import { GlitchText } from "../../components/GlitchText";
import { StatusChip } from "../../components/StatusChip";
import { PipSays } from "../../mascot/PipSays";
import { homeGreeting } from "../../mascot/mood";
import { useAppStore } from "../store";
import { useDrillStatuses, type DrillStatusRow } from "../useDrillStatuses";

/** feeds the card's spotlight gradient with the pointer position */
function trackSpotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function DrillCard({ row, index, onOpen }: { row: DrillStatusRow; index: number; onOpen: () => void }) {
  const color = accentVar[row.accent];
  return (
    <button
      type="button"
      onClick={() => {
        sound.play("tap");
        onOpen();
      }}
      onPointerMove={trackSpotlight}
      className="glass spotlight rise group flex flex-col gap-3 rounded-xl p-3.5 text-left transition duration-300 hover:-translate-y-0.5 active:scale-[0.98] sm:p-4"
      style={{
        ["--c" as string]: color,
        ["--d" as string]: `${120 + index * 60}ms`,
      }}
    >
      <div className="flex w-full items-start justify-between">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg transition duration-300 group-hover:scale-110"
          style={{
            color,
            background: `radial-gradient(circle, color-mix(in srgb, ${color} 20%, transparent), transparent 72%)`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 38%, transparent)`,
          }}
        >
          {row.glyph}
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] text-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[17px] leading-tight font-semibold">
          {row.name}
          <span
            aria-hidden="true"
            className="text-sm opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
            style={{ color }}
          >
            →
          </span>
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] tracking-wider text-muted">
          {row.faculty.toUpperCase()}
        </div>
      </div>
      <StatusChip status={row.status} />
    </button>
  );
}

function Tally({ rows }: { rows: DrillStatusRow[] }) {
  const today = (k: "above" | "at" | "below") =>
    rows.filter((r) => r.status.kind === "ready" && r.status.today === k).length;
  const cells = [
    { label: "ABOVE", value: today("above"), color: "var(--color-green)" },
    { label: "AT", value: today("at"), color: "var(--color-cyan)" },
    { label: "BELOW", value: today("below"), color: "var(--color-amber)" },
    {
      label: "CALIBRATING",
      value: rows.filter((r) => r.status.kind === "calibrating").length,
      color: "var(--color-muted)",
    },
  ];
  return (
    <dl className="grid grid-cols-4 divide-x divide-edge border-t border-edge pt-3">
      {cells.map((c) => (
        <div key={c.label} className="flex flex-col-reverse items-center gap-0.5 px-1">
          <dt className="font-mono text-[8.5px] tracking-[0.18em] text-muted">{c.label}</dt>
          <dd className="font-mono text-lg font-bold tabular-nums" style={{ color: c.color }}>
            {c.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Home() {
  const navigate = useAppStore((s) => s.navigate);
  const rows = useDrillStatuses();
  const greeting = rows ? homeGreeting(rows) : null;

  return (
    <>
      <section className="mb-6 text-center sm:text-left">
        <div className="rise mb-4 inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-violet">
          <span aria-hidden="true">✦</span> FOCUS RECOVERY CONSOLE
        </div>
        <h1
          className="rise text-[2.6rem] leading-none font-bold tracking-tight sm:text-6xl"
          style={{ ["--d" as string]: "60ms" }}
        >
          <GlitchText text="CORTEX·DECK">
            CORTEX<span className="text-cyan">·</span>DECK
          </GlitchText>
        </h1>
        <p
          className="rise thin-wide mt-3 text-[10.5px] tracking-[0.2em] text-muted sm:text-xs sm:tracking-[0.32em]"
          style={{ ["--d" as string]: "100ms" }}
        >
          Six drills · honest scores · your own baseline
        </p>
      </section>

      <section
        aria-label="Today"
        className="glass hud-corners rise mb-6 flex flex-col gap-3 rounded-2xl p-4"
        style={{ ["--d" as string]: "140ms" }}
      >
        {greeting ? (
          <PipSays mood={greeting.mood} line={greeting.line} size={84} />
        ) : (
          <div className="h-[105px]" />
        )}
        {rows && <Tally rows={rows} />}
      </section>

      <h2 className="mb-3 font-mono text-[10px] tracking-[0.3em] text-muted">DRILLS</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {(rows ?? []).map((row, i) => (
          <DrillCard
            key={row.id}
            row={row}
            index={i}
            onOpen={() => navigate({ name: "drill", id: row.id })}
          />
        ))}
      </div>

      <nav aria-label="More" className="mt-6 grid grid-cols-3 gap-3">
        <Btn onClick={() => navigate({ name: "faculties" })} accent="cyan" className="w-full px-2 text-[11px]">
          FACULTIES
        </Btn>
        <Btn onClick={() => navigate({ name: "prepost" })} accent="violet" className="w-full px-2 text-[11px]">
          PRE / POST
        </Btn>
        <Btn onClick={() => navigate({ name: "settings" })} accent="muted" className="w-full px-2 text-[11px]">
          SETTINGS
        </Btn>
      </nav>

      <p className="mt-auto pt-8 text-center text-xs leading-relaxed text-muted">
        These drills train the practiced task; transfer to anything else is limited. You
        get better at what you practice. Enjoy the reps.
      </p>
    </>
  );
}
