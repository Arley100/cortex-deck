import type { DrillScore, TrialEvent } from "../../engine/types";

export interface SequenceConfig {
  pads: number;
  litMs: number;
  gapMs: number;
  startDelayMs: number;
  tapLitMs: number;
  growDelayMs: number;
  seed?: number;
}

export const SEQUENCE_DEFAULTS: SequenceConfig = {
  pads: 4,
  litMs: 480,
  gapMs: 200,
  startDelayMs: 500,
  tapLitMs: 160,
  growDelayMs: 550,
};

/**
 * One "correct" event per completed round; rounds grow by one, so the number
 * of completed rounds equals the longest chain.
 */
export function scoreSequence(events: TrialEvent[]): DrillScore {
  const span = events.filter((e) => e.response === "correct").length;
  const errors = events.filter((e) => e.response === "wrong").length;
  return {
    primary: span,
    unit: "span",
    higherIsBetter: true,
    breakdown: { span, errors },
  };
}
