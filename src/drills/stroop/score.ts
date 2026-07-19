import type { DrillScore, TrialEvent } from "../../engine/types";
import { accuracyPercent, perMinute } from "../../scoring/accuracy";
import { tallyChoice } from "../../scoring/tally";

export interface StroopConfig {
  seconds: number;
  /** share of trials where ink and word are forced to differ */
  incongruentRate: number;
  seed?: number;
}

export const STROOP_DEFAULTS: StroopConfig = {
  seconds: 45,
  incongruentRate: 0.75,
};

export function createScoreStroop(seconds: number) {
  return (events: TrialEvent[]): DrillScore => {
    const t = tallyChoice(events);
    return {
      primary: t.correct,
      unit: "count",
      higherIsBetter: true,
      breakdown: {
        correct: t.correct,
        wrong: t.wrong,
        accuracy: accuracyPercent(t.correct, t.correct + t.wrong),
        perMinute: perMinute(t.correct, seconds),
      },
    };
  };
}
