/**
 * Rolling personal baseline per drill+variant. All comparisons are against
 * the user's own history; wording elsewhere in the app must stay neutral.
 */

export const BASELINE_WINDOW = 10;
export const BASELINE_MIN_RUNS = 3;
/** within this fraction of baseline counts as "at baseline" */
export const DEVIATION_BAND = 0.1;

export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError("median of empty list");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] as number;
  return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/**
 * Baseline = median of the last BASELINE_WINDOW values; null until
 * BASELINE_MIN_RUNS values exist. Input is ordered oldest to newest.
 */
export function computeBaseline(values: readonly number[]): number | null {
  if (values.length < BASELINE_MIN_RUNS) return null;
  return median(values.slice(-BASELINE_WINDOW));
}

export type Deviation = "above" | "at" | "below";

/**
 * Compare today's value with the baseline. "above" always means better than
 * baseline; for lower-is-better metrics (Reaction) the comparison inverts.
 */
export function deviation(
  today: number,
  baseline: number,
  higherIsBetter: boolean,
): Deviation {
  if (baseline === 0) {
    if (today === 0) return "at";
    return today > 0 === higherIsBetter ? "above" : "below";
  }
  const ratio = today / baseline;
  const betterCut = higherIsBetter ? 1 + DEVIATION_BAND : 1 - DEVIATION_BAND;
  const worseCut = higherIsBetter ? 1 - DEVIATION_BAND : 1 + DEVIATION_BAND;
  if (higherIsBetter ? ratio > betterCut : ratio < betterCut) return "above";
  if (higherIsBetter ? ratio < worseCut : ratio > worseCut) return "below";
  return "at";
}

export type BaselineStatus =
  | { kind: "calibrating"; runs: number; needed: number }
  | { kind: "ready"; baseline: number; today: Deviation | null };

/**
 * Status for a drill+variant. `history` is ordered oldest to newest and
 * excludes nothing; `todayValue` is the latest run from the current day, if
 * any.
 */
export function baselineStatus(
  history: readonly number[],
  todayValue: number | null,
  higherIsBetter: boolean,
): BaselineStatus {
  const baseline = computeBaseline(history);
  if (baseline === null) {
    return {
      kind: "calibrating",
      runs: history.length,
      needed: BASELINE_MIN_RUNS,
    };
  }
  return {
    kind: "ready",
    baseline,
    today:
      todayValue === null ? null : deviation(todayValue, baseline, higherIsBetter),
  };
}
