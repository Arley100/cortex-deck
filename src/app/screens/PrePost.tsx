import { useCallback, useEffect, useMemo, useState } from "react";
import { Btn } from "../../components/Btn";
import { DrillHost } from "../../components/DrillHost";
import { drillEntry } from "../../drills/registry";
import type { DrillId, TrialEvent } from "../../engine/types";
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
        <div className="mb-3 text-center font-mono text-xs tracking-widest text-muted">
          {stage.phase === "pre" ? "BEFORE" : "AFTER"} BATTERY · DRILL {stage.index + 1} /{" "}
          {batteryIds.length}
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
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ name: "home" })}
          className="font-mono text-sm text-muted transition active:scale-95"
        >
          ← exit
        </button>
        <div className="text-lg font-extrabold tracking-tight">PRE / POST</div>
      </div>

      {stage.name === "loading" && <p className="text-sm text-muted">loading…</p>}

      {stage.name === "idle" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            Run a short battery now, go do whatever you were going to do (scroll, meet,
            deep work), then run the same battery after. The result is a side by side of
            the two, nothing more.
          </p>
          <p className="font-mono text-xs tracking-wide text-muted">
            battery: {batteryIds.map((id) => names[id]).join(" · ")} · under 3 minutes
          </p>
          {stage.resumeTag ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted">
                A "before" battery is waiting for its "after" half.
              </p>
              <Btn onClick={() => startBattery("post", stage.resumeTag as string)} big accent="violet">
                START AFTER
              </Btn>
              <button
                type="button"
                className="font-mono text-xs tracking-widest text-muted"
                onClick={() => {
                  void settingsRepo.set("activePrePost", null);
                  setStage({ name: "idle", resumeTag: null });
                }}
              >
                DISCARD SESSION
              </button>
            </div>
          ) : (
            <Btn onClick={() => startBattery("pre", newSessionTag())} big accent="cyan">
              START BEFORE
            </Btn>
          )}
        </div>
      )}

      {stage.name === "await" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            "Before" battery saved. Go do the thing. When you are back, run the "after"
            half; the app keeps the session linked in the meantime, even across reloads.
          </p>
          <Btn onClick={() => startBattery("post", stage.tag)} big accent="violet">
            START AFTER
          </Btn>
        </div>
      )}

      {stage.name === "results" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-edge bg-panel p-4">
            {stage.deltas.map((d) => (
              <div key={d.drillId} className="py-1 font-mono text-sm">
                {formatDelta(d)}
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Deltas compare this session's two batteries only. Single sessions are noisy;
            patterns across many sessions mean more than any one number.
          </p>
          {/* share card PNG placeholder: real canvas rendering lands in a
              follow-up polish pass */}
          <div className="rounded-xl border border-dashed border-edge p-3 text-center font-mono text-xs text-muted">
            share card PNG: coming soon
          </div>
          <Btn onClick={() => navigate({ name: "home" })} accent="muted">
            DONE
          </Btn>
        </div>
      )}
    </div>
  );
}
