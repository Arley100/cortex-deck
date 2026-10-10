import { BASELINE_MIN_RUNS, computeBaseline, deviation } from "./baseline";

/**
 * How one finished run compares with the user's own prior history for the
 * same drill+variant. This is what the results screen (and the mascot) react
 * to, so it must stay honest: a personal best is strictly better than every
 * prior run, and "above"/"below" use the same 10% band as the home chips.
 */
export type RunVerdict =
  | {
      kind: "calibrating";
      /** runs logged including this one */
      runs: number;
      needed: number;
    }
  | {
      kind: "personalBest";
      /** baseline from the runs before this one */
      baseline: number;
      previousBest: number;
    }
  | { kind: "above" | "at" | "below"; baseline: number };

export type VerdictKind = RunVerdict["kind"];

/**
 * `prior` is the drill+variant history before this run, oldest first. The
 * baseline is computed from `prior` only, so a run never inflates the
 * baseline it is being compared against.
 */
export function classifyRun(
  prior: readonly number[],
  score: number,
  higherIsBetter: boolean,
): RunVerdict {
  const baseline = computeBaseline(prior);
  if (baseline === null) {
    return {
      kind: "calibrating",
      runs: prior.length + 1,
      needed: BASELINE_MIN_RUNS,
    };
  }
  const previousBest = higherIsBetter ? Math.max(...prior) : Math.min(...prior);
  const isBest = higherIsBetter ? score > previousBest : score < previousBest;
  if (isBest) return { kind: "personalBest", baseline, previousBest };
  return { kind: deviation(score, baseline, higherIsBetter), baseline };
}
