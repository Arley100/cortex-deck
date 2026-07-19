import type { DrillScore, TrialEvent } from "../../engine/types";
import { accuracyPercent } from "../../scoring/accuracy";
import { dPrime } from "../../scoring/dprime";
import { tallyDetection } from "../../scoring/tally";

export interface NBackConfig {
  trials: number;
  isiMs: number;
  /** blank gap after each stimulus, ms */
  flashMs: number;
  /** forced match rate */
  matchRate: number;
  seed?: number;
}

export const NBACK_DEFAULTS: NBackConfig = {
  trials: 24,
  isiMs: 2400,
  flashMs: 260,
  matchRate: 0.32,
};

export function scoreNBack(events: TrialEvent[]): DrillScore {
  const t = tallyDetection(events);
  const total = t.hits + t.misses + t.falseAlarms + t.correctRejects;
  return {
    primary: accuracyPercent(t.hits + t.correctRejects, total),
    unit: "%",
    higherIsBetter: true,
    breakdown: {
      hits: t.hits,
      missedMatches: t.misses,
      falseAlarms: t.falseAlarms,
      correctPasses: t.correctRejects,
    },
    dPrime: dPrime({
      hits: t.hits,
      misses: t.misses,
      falseAlarms: t.falseAlarms,
      correctRejects: t.correctRejects,
    }),
  };
}
