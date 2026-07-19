import type { DrillScore, TrialEvent } from "../../engine/types";
import { accuracyPercent } from "../../scoring/accuracy";
import { bestStreak } from "../../scoring/streaks";
import { tallyChoice } from "../../scoring/tally";

export interface MathSprintConfig {
  seconds: number;
  /** distractors land within +-distractorSpread of the answer */
  distractorSpread: number;
  choices: number;
  seed?: number;
}

export const MATHSPRINT_DEFAULTS: MathSprintConfig = {
  seconds: 60,
  distractorSpread: 6,
  choices: 4,
};

export function scoreMathSprint(events: TrialEvent[]): DrillScore {
  const t = tallyChoice(events);
  const streak = bestStreak(
    events
      .filter((e) => e.response === "correct" || e.response === "wrong")
      .map((e) => e.response === "correct"),
  );
  return {
    primary: t.correct,
    unit: "count",
    higherIsBetter: true,
    breakdown: {
      correct: t.correct,
      wrong: t.wrong,
      accuracy: accuracyPercent(t.correct, t.correct + t.wrong),
      bestStreak: streak,
    },
  };
}
