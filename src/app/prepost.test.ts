import { describe, expect, it } from "vitest";
import { computeDeltas, formatDelta, newSessionTag } from "./prepost";
import type { RunRecord } from "../storage/types";
import type { DrillId } from "../engine/types";

const NAMES = {
  stroop: "Stroop",
  reaction: "Reaction",
  gonogo: "Go / No-Go",
  nback: "N-Back",
  mathsprint: "Math Sprint",
  sequence: "Sequence",
} as Record<DrillId, string>;

const run = (over: Partial<RunRecord>): RunRecord => ({
  drillId: "stroop",
  variant: "battery",
  timestamp: 0,
  score: 0,
  unit: "count",
  higherIsBetter: true,
  breakdown: {},
  sessionTag: "pp-1",
  ...over,
});

describe("computeDeltas", () => {
  it("pairs the last pre and post run per drill", () => {
    const runs = [
      run({ phase: "pre", score: 31, timestamp: 1 }),
      run({ phase: "post", score: 24, timestamp: 2 }),
      run({ drillId: "reaction", unit: "ms", phase: "pre", score: 310, timestamp: 1 }),
      run({ drillId: "reaction", unit: "ms", phase: "post", score: 285, timestamp: 2 }),
    ];
    const deltas = computeDeltas(runs, ["stroop", "reaction"], NAMES);
    expect(deltas[0]).toEqual({
      drillId: "stroop",
      name: "Stroop",
      unit: "count",
      pre: 31,
      post: 24,
      pctChange: -23,
    });
    expect(deltas[1]?.pctChange).toBe(-8);
  });

  it("uses the most recent attempt when a phase was retried", () => {
    const runs = [
      run({ phase: "pre", score: 10, timestamp: 1 }),
      run({ phase: "pre", score: 20, timestamp: 2 }),
      run({ phase: "post", score: 30, timestamp: 3 }),
    ];
    const [d] = computeDeltas(runs, ["stroop"], NAMES);
    expect(d?.pre).toBe(20);
    expect(d?.pctChange).toBe(50);
  });

  it("marks missing phases as incomplete instead of guessing", () => {
    const runs = [run({ phase: "pre", score: 31 })];
    const [d] = computeDeltas(runs, ["stroop"], NAMES);
    expect(d?.post).toBeNull();
    expect(d?.pctChange).toBeNull();
    expect(formatDelta(d!)).toBe("Stroop: incomplete");
  });

  it("avoids dividing by a zero pre score", () => {
    const runs = [
      run({ phase: "pre", score: 0, timestamp: 1 }),
      run({ phase: "post", score: 4, timestamp: 2 }),
    ];
    const [d] = computeDeltas(runs, ["stroop"], NAMES);
    expect(d?.pctChange).toBeNull();
    expect(formatDelta(d!)).toBe("Stroop: 0 → 4 correct");
  });
});

describe("formatDelta", () => {
  it("matches the neutral spec wording for counts", () => {
    expect(
      formatDelta({
        drillId: "stroop",
        name: "Stroop",
        unit: "count",
        pre: 31,
        post: 24,
        pctChange: -23,
      }),
    ).toBe("Stroop: 31 → 24 correct, -23%");
  });

  it("formats ms and positive changes", () => {
    expect(
      formatDelta({
        drillId: "reaction",
        name: "Reaction",
        unit: "ms",
        pre: 310,
        post: 285,
        pctChange: -8,
      }),
    ).toBe("Reaction: 310 → 285 ms, -8%");
    expect(
      formatDelta({
        drillId: "gonogo",
        name: "Go / No-Go",
        unit: "%",
        pre: 86,
        post: 93,
        pctChange: 8,
      }),
    ).toBe("Go / No-Go: 86 → 93% accuracy, +8%");
  });
});

describe("newSessionTag", () => {
  it("derives from the timestamp", () => {
    expect(newSessionTag(123)).toBe("pp-123");
  });
});
