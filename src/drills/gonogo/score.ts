import type { DrillScore, TrialEvent } from "../../engine/types";
import { accuracyPercent } from "../../scoring/accuracy";
import { dPrime } from "../../scoring/dprime";
import { tallyDetection } from "../../scoring/tally";

export interface GoNoGoConfig {
  trials: number;
  /** share of go trials */
  goRate: number;
  windowMs: number;
  blankMs: number;
  seed?: number;
}

export const GONOGO_DEFAULTS: GoNoGoConfig = {
  trials: 28,
  goRate: 0.68,
  windowMs: 850,
  blankMs: 320,
};

export function scoreGoNoGo(events: TrialEvent[]): DrillScore {
  const t = tallyDetection(events);
  const total = t.hits + t.misses + t.falseAlarms + t.correctRejects;
  return {
    primary: accuracyPercent(t.hits + t.correctRejects, total),
    unit: "%",
    higherIsBetter: true,
    breakdown: {
      hits: t.hits,
      correctStops: t.correctRejects,
      commissions: t.falseAlarms,
      omissions: t.misses,
      meanGoRt: t.meanHitRt,
    },
    dPrime: dPrime({
      hits: t.hits,
      misses: t.misses,
      falseAlarms: t.falseAlarms,
      correctRejects: t.correctRejects,
    }),
  };
}
