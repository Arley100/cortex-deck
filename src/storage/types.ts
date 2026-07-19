import type { DrillId, ScoreUnit } from "../engine/types";

/** One persisted, completed run. */
export interface RunRecord {
  id?: number;
  drillId: DrillId;
  /** variant key, e.g. "2-back"; "default" when the drill has no variants */
  variant: string;
  /** ms since epoch */
  timestamp: number;
  /** the headline metric, same number the results screen showed */
  score: number;
  unit: ScoreUnit;
  higherIsBetter: boolean;
  /** hits, misses, falseAlarms, etc.; kept separate, never collapsed */
  breakdown: Record<string, number>;
  dPrime?: number;
  /** links the two halves of a pre/post session */
  sessionTag?: string;
  /** "pre" | "post" when part of a pre/post battery */
  phase?: "pre" | "post";
}

export interface SettingRecord {
  key: string;
  value: unknown;
}
