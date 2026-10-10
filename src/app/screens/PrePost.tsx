import { useCallback, useEffect, useMemo, useState } from "react";
import { sound } from "../../audio/engine";
import { Btn } from "../../components/Btn";
import { DrillHost } from "../../components/DrillHost";
import { formatValue } from "../../components/format";
import { GlitchText } from "../../components/GlitchText";
import { drillEntry } from "../../drills/registry";
import type { DrillId, TrialEvent } from "../../engine/types";
import { PipSays } from "../../mascot/PipSays";
import { renderShareCard } from "../../share/shareCard";
import { runsRepo } from "../../storage/runsRepo";
import { settingsRepo } from "../../storage/settingsRepo";
import {
  BATTERY_FACTORIES,
  BATTERY_VARIANT,
  computeDeltas,
  formatDelta,
  newSessionTag,
  type DrillDelta,
} from "../prepost";
import { useAppStore } from "../store";

type Stage =
  | { name: "loading" }
  | { name: "idle"; resumeTag: string | null }
  | { name: "battery"; phase: "pre" | "post"; tag: string; index: number }
  | { name: "await"; tag: string }
  | { name: "results"; deltas: DrillDelta[] };

const VIOLET = { ["--c" as string]: "var(--color-violet)" };

export function PrePost() {
  const navigate = useAppStore((s) => s.navigate);
  const recordRun = useAppStore((s) => s.recordRun);
  const [stage, setStage] = useState<Stage>({ name: "loading" });
  const [batteryIds, setBatteryIds] = useState<DrillId[]>([]);

  useEffect(() => {
    let alive = true;
    void settingsRepo.get().then((s) => {
      if (!alive) return;
      setBatteryIds(s.batteryDrills as DrillId[]);
      setStage({ name: "idle", resumeTag: s.activePrePost?.tag ?? null });
    });
    return () => {
      alive = false;
    };
  }, []);

  const names = useMemo(
    () =>
      Object.fromEntries(
        batteryIds.map((id) => [id, drillEntry(id).definition.name]),
      ) as Record<DrillId, string>,
    [batteryIds],
  );

  const showResults = useCallback(
    async (tag: string) => {
      const sessionRuns = await runsRepo.bySessionTag(tag);
      setStage({ name: "results", deltas: computeDeltas(sessionRuns, batteryIds, names) });
    },
    [batteryIds, names],
  );

  const startBattery = (phase: "pre" | "post", tag: string) => {
    setStage({ name: "battery", phase, tag, index: 0 });
  };

  const handleDrillComplete = useCallback(
    (events: TrialEvent[]) => {
      if (stage.name !== "battery") return;
      const id = batteryIds[stage.index] as DrillId;
      const definition = BATTERY_FACTORIES[id]();
      const score = definition.score(events);
      void (async () => {
        await recordRun({
          drillId: id,
          variant: BATTERY_VARIANT,
          timestamp: Date.now(),
          score: score.primary,
          unit: score.unit,
          higherIsBetter: score.higherIsBetter,
          breakdown: score.breakdown,
          dPrime: score.dPrime,
          sessionTag: stage.tag,
          phase: stage.phase,
        });
        const nextIndex = stage.index + 1;
        if (nextIndex < batteryIds.length) {
          setStage({ ...stage, index: nextIndex });
        } else if (stage.phase === "pre") {
          await settingsRepo.set("activePrePost", { tag: stage.tag });
          setStage({ name: "await", tag: stage.tag });
        } else {
          await settingsRepo.set("activePrePost", null);
          await showResults(stage.tag);
        }
      })();
    },
    [stage, batteryIds, recordRun, showResults],
  );

  const abandonBattery = useCallback(() => {
    if (stage.name !== "battery") return;
    if (stage.phase === "post") setStage({ name: "await", tag: stage.tag });
    else setStage({ name: "idle", resumeTag: null });
  }, [stage]);

  const currentBatteryId =
    stage.name === "battery" ? (batteryIds[stage.index] as DrillId) : null;
  const currentDefinition = useMemo(
    () => (currentBatteryId ? BATTERY_FACTORIES[currentBatteryId]() : null),
    [currentBatteryId],
  );

  if (stage.name === "battery" && currentDefinition) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <div className="mb-3 flex items-center justify-center gap-2 font-mono text-[10px] tracking-[0.25em] text-muted">
          <span
            style={{ color: stage.phase === "pre" ? "var(--color-cyan)" : "var(--color-violet)" }}
          >
            {stage.phase === "pre" ? "BEFORE" : "AFTER"} BATTERY
          </span>
          <span aria-hidden="true">·</span>
          <span>
            DRILL {stage.index + 1} / {batteryIds.length}
          </span>
        </div>
        <DrillHost
          key={`${stage.tag}-${stage.phase}-${stage.index}`}
          definition={currentDefinition}
          onComplete={handleDrillComplete}
          onExit={abandonBattery}
        />
      </div>
    );
  }

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
        <h1 className="font-mono text-lg font-extrabold tracking-[0.12em] text-violet">
          <GlitchText text="PRE / POST" />
        </h1>
      </div>
      <div className="hud-rule mb-6" style={VIOLET} />

      {stage.name === "loading" && <p className="text-sm text-muted">loading…</p>}

      {stage.name === "idle" && (
        <div className="flex flex-col gap-5">
          <Steps active={stage.resumeTag ? 2 : 0} />
          <div
            className="glass hud-corners rise flex flex-col items-center gap-5 rounded-2xl px-5 py-6 text-center"
            style={VIOLET}
          >
            <p className="text-[15px] leading-relaxed text-fg/85">
              Run a short battery now, go do whatever you were going to do (scroll, meet,
              deep work), then run the same battery after. The result is a side by side of
              the two, nothing more.
            </p>
            <ul className="flex flex-wrap justify-center gap-2" aria-label="battery drills">
              {batteryIds.map((id) => (
                <li
                  key={id}
                  className="rounded-sm border border-violet/40 px-2 py-0.5 font-mono text-[10px] tracking-widest text-violet uppercase"
                >
                  {names[id]}
                </li>
              ))}
              <li className="rounded-sm border border-edge px-2 py-0.5 font-mono text-[10px] tracking-widest text-muted">
                UNDER 3 MIN
              </li>
            </ul>
            {stage.resumeTag ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-muted">
                  A "before" battery is waiting for its "after" half.
                </p>
                <Btn
                  onClick={() => startBattery("post", stage.resumeTag as string)}
                  big
                  solid
                  accent="violet"
                >
                  START AFTER
                </Btn>
                <button
                  type="button"
                  className="font-mono text-[10px] tracking-[0.25em] text-muted hover:text-fg"
                  onClick={() => {
                    void settingsRepo.set("activePrePost", null);
                    setStage({ name: "idle", resumeTag: null });
                  }}
                >
                  DISCARD SESSION
                </button>
              </div>
            ) : (
              <Btn onClick={() => startBattery("pre", newSessionTag())} big solid accent="cyan">
                START BEFORE
              </Btn>
            )}
          </div>
        </div>
      )}

      {stage.name === "await" && (
        <div className="flex flex-col gap-5">
          <Steps active={1} />
          <div
            className="glass hud-corners rise flex flex-col items-center gap-5 rounded-2xl px-5 py-6 text-center"
            style={VIOLET}
          >
            <p className="text-[15px] leading-relaxed text-fg/85">
              "Before" battery saved. Go do the thing. When you are back, run the "after"
              half; the app keeps the session linked in the meantime, even across reloads.
            </p>
            <Btn onClick={() => startBattery("post", stage.tag)} big solid accent="violet">
              START AFTER
            </Btn>
          </div>
        </div>
      )}

      {stage.name === "results" && (
        <PrePostResults deltas={stage.deltas} onDone={() => navigate({ name: "home" })} />
      )}
    </div>
  );
}

const STEPS = ["BEFORE", "LIVE YOUR LIFE", "AFTER"];

function Steps({ active }: { active: number }) {
  return (
    <ol className="flex items-start gap-2 font-mono text-[9px] tracking-[0.2em]">
      {STEPS.map((label, i) => (
        <li
          key={label}
          className="flex flex-1 flex-col gap-1.5"
          aria-current={i === active ? "step" : undefined}
        >
          <span
            className="h-1"
            style={{
              background:
                i < active
                  ? "color-mix(in srgb, var(--color-violet) 55%, transparent)"
                  : i === active
                    ? "var(--color-violet)"
                    : "var(--color-edge)",
              boxShadow: i === active ? "0 0 8px var(--color-violet)" : "none",
            }}
          />
          <span style={{ color: i === active ? "var(--color-violet)" : "var(--color-muted)" }}>
            {String(i + 1).padStart(2, "0")} {label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function PrePostResults({ deltas, onDone }: { deltas: DrillDelta[]; onDone: () => void }) {
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    let alive = true;
    void renderShareCard(deltas).then((blob) => {
      if (!alive || !blob) return;
      url = URL.createObjectURL(blob);
      setCard({ blob, url });
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [deltas]);

  const fileName = `cortex-deck-prepost-${new Date().toISOString().slice(0, 10)}.png`;

  const share = async () => {
    if (!card) return;
    const file = new File([card.blob], fileName, { type: "image/png" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch {
        // cancelled or refused: fall through to a download
      }
    }
    const a = document.createElement("a");
    a.href = card.url;
    a.download = fileName;
    a.click();
    setNote("card downloaded");
  };

  return (
    <div className="flex flex-col gap-5">
      <PipSays
        mood="nod"
        line="Session saved. One session is noisy; the pattern across many says more."
        size={84}
      />
      <div className="glass hud-corners rise rounded-xl px-4 py-1" style={VIOLET}>
        {deltas.map((d) => (
          <div
            key={d.drillId}
            className="flex items-baseline justify-between gap-3 border-b border-edge/60 py-3 last:border-0"
          >
            <span className="sr-only">{formatDelta(d)}</span>
            <span aria-hidden="true" className="text-[15px] font-semibold">
              {d.name}
            </span>
            <span aria-hidden="true" className="font-mono text-sm tabular-nums">
              {d.pre === null || d.post === null ? (
                <span className="text-muted">incomplete</span>
              ) : (
                <>
                  <span className="text-muted">{formatValue(d.pre, d.unit)}</span>
                  <span className="mx-1.5 text-violet">→</span>
                  <span>{formatValue(d.post, d.unit)}</span>
                  {d.pctChange !== null && (
                    <span className="ml-2 text-cyan">
                      {d.pctChange >= 0 ? "+" : "−"}
                      {Math.abs(d.pctChange)}%
                    </span>
                  )}
                </>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Deltas compare this session's two batteries only. Single sessions are noisy;
        patterns across many sessions mean more than any one number.
      </p>
      {card && (
        <figure className="rise flex flex-col gap-3">
          <img
            src={card.url}
            alt="Share card summarizing this pre/post session"
            className="w-full rounded-lg border border-edge"
          />
          <Btn onClick={() => void share()} accent="violet" solid>
            SHARE CARD
          </Btn>
          {note && (
            <figcaption className="text-center font-mono text-[10px] tracking-widest text-muted">
              {note}
            </figcaption>
          )}
        </figure>
      )}
      <Btn onClick={onDone} accent="muted">
        DONE
      </Btn>
    </div>
  );
}
