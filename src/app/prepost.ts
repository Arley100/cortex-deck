import type { DrillDefinition, DrillId, ScoreUnit } from "../engine/types";
import type { RunRecord } from "../storage/types";
import { createStroopDefinition } from "../drills/stroop";
import { createReactionDefinition } from "../drills/reaction";
import { createGoNoGoDefinition } from "../drills/gonogo";
import { createNBackDefinition } from "../drills/nback";
import { createMathSprintDefinition } from "../drills/mathsprint";
import { createSequenceDefinition } from "../drills/sequence";

/** runs recorded by a battery use this variant so they never mix into the
 * full-length baselines */
export const BATTERY_VARIANT = "battery";

/** shortened battery versions; the full battery stays under 3 minutes */
export const BATTERY_FACTORIES: Record<DrillId, () => DrillDefinition> = {
  stroop: () => createStroopDefinition({ seconds: 30 }),
  reaction: () => createReactionDefinition({ trials: 3 }),
  gonogo: () => createGoNoGoDefinition({ trials: 20 }),
  nback: () => createNBackDefinition({ trials: 12 }),
  mathsprint: () => createMathSprintDefinition({ seconds: 30 }),
  sequence: () => createSequenceDefinition(),
};

export function newSessionTag(now: number = Date.now()): string {
  return `pp-${now}`;
}

export interface DrillDelta {
  drillId: DrillId;
  name: string;
  unit: ScoreUnit;
  pre: number | null;
  post: number | null;
  /** signed percent change post vs pre; null if either side is missing or pre is 0 */
  pctChange: number | null;
}

/**
 * Uses the last run per drill and phase, so a retried battery half counts
 * its most recent attempt.
 */
export function computeDeltas(
  sessionRuns: RunRecord[],
  batteryIds: DrillId[],
  names: Record<DrillId, string>,
): DrillDelta[] {
  return batteryIds.map((drillId) => {
    const pre = sessionRuns.filter((r) => r.drillId === drillId && r.phase === "pre").at(-1);
    const post = sessionRuns.filter((r) => r.drillId === drillId && r.phase === "post").at(-1);
    const unit = (post ?? pre)?.unit ?? "count";
    let pctChange: number | null = null;
    if (pre && post && pre.score !== 0) {
      pctChange = Math.round(((post.score - pre.score) / pre.score) * 100);
    }
    return {
      drillId,
      name: names[drillId],
      unit,
      pre: pre ? pre.score : null,
      post: post ? post.score : null,
      pctChange,
    };
  });
}

const UNIT_SUFFIX: Record<ScoreUnit, string> = {
  "%": "% accuracy",
  ms: " ms",
  count: " correct",
  span: " span",
};

/** Neutral wording: values and the change, nothing else. */
export function formatDelta(d: DrillDelta): string {
  if (d.pre === null || d.post === null) return `${d.name}: incomplete`;
  const suffix = UNIT_SUFFIX[d.unit];
  const change =
    d.pctChange === null ? "" : `, ${d.pctChange >= 0 ? "+" : ""}${d.pctChange}%`;
  return `${d.name}: ${d.pre} → ${d.post}${suffix}${change}`;
}
