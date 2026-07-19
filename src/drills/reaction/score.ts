import type { DrillScore, TrialEvent } from "../../engine/types";
import { roundedMean } from "../../scoring/accuracy";

export interface ReactionConfig {
  trials: number;
  minDelayMs: number;
  maxDelayMs: number;
  seed?: number;
}

export const REACTION_DEFAULTS: ReactionConfig = {
  trials: 5,
  minDelayMs: 1400,
  maxDelayMs: 4000,
};

/** Lower is better: the headline is the fastest valid tap. */
export function scoreReaction(events: TrialEvent[]): DrillScore {
  const rts = events
    .filter((e) => e.response === "hit" && e.rt !== undefined)
    .map((e) => Math.round(e.rt as number));
  const early = events.filter((e) => e.response === "falseAlarm").length;
  return {
    primary: rts.length > 0 ? Math.min(...rts) : 0,
    unit: "ms",
    higherIsBetter: false,
    breakdown: {
      fastest: rts.length > 0 ? Math.min(...rts) : 0,
      average: roundedMean(rts),
      earlyTaps: early,
    },
  };
}
