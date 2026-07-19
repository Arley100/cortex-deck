import { useCallback } from "react";
import { DrillHost } from "../../components/DrillHost";
import { drillEntry } from "../../drills/registry";
import type { DrillId, RunMeta, TrialEvent } from "../../engine/types";
import { useAppStore } from "../store";

export function DrillScreen({ id }: { id: DrillId }) {
  const navigate = useAppStore((s) => s.navigate);
  const recordRun = useAppStore((s) => s.recordRun);
  const entry = drillEntry(id);

  const handleComplete = useCallback(
    (events: TrialEvent[], meta: RunMeta | undefined) => {
      const score = entry.definition.score(events);
      void recordRun({
        drillId: id,
        variant: meta?.variant ?? "default",
        timestamp: Date.now(),
        score: score.primary,
        unit: score.unit,
        higherIsBetter: score.higherIsBetter,
        breakdown: score.breakdown,
        dPrime: score.dPrime,
      });
    },
    [entry, id, recordRun],
  );

  const handleExit = useCallback(() => navigate({ name: "home" }), [navigate]);

  return (
    <DrillHost
      definition={entry.definition}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
