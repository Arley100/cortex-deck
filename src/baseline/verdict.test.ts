import { describe, expect, it } from "vitest";
import { classifyRun } from "./verdict";

describe("classifyRun", () => {
  it("is calibrating until three prior runs exist, counting this run", () => {
    expect(classifyRun([], 50, true)).toEqual({ kind: "calibrating", runs: 1, needed: 3 });
    expect(classifyRun([40, 60], 50, true)).toEqual({
      kind: "calibrating",
      runs: 3,
      needed: 3,
    });
  });

  it("flags a personal best only when strictly better than every prior run", () => {
    expect(classifyRun([50, 60, 70], 71, true)).toEqual({
      kind: "personalBest",
      baseline: 60,
      previousBest: 70,
    });
    // tying the best is not a new best
    expect(classifyRun([50, 60, 70], 70, true).kind).toBe("above");
  });

  it("inverts personal best for lower-is-better metrics", () => {
    expect(classifyRun([300, 280, 320], 270, false)).toEqual({
      kind: "personalBest",
      baseline: 300,
      previousBest: 280,
    });
    expect(classifyRun([300, 280, 320], 340, false).kind).toBe("below");
  });

  it("uses the 10% band around the prior baseline", () => {
    const prior = [100, 100, 100, 120];
    expect(classifyRun(prior, 105, true)).toEqual({ kind: "at", baseline: 100 });
    expect(classifyRun(prior, 111, true)).toEqual({ kind: "above", baseline: 100 });
    expect(classifyRun(prior, 89, true)).toEqual({ kind: "below", baseline: 100 });
  });

  it("compares against the baseline from prior runs, not including this one", () => {
    // if the 1000 were folded in, the baseline would shift; it must not
    const verdict = classifyRun([10, 10, 10], 9, true);
    expect(verdict).toEqual({ kind: "at", baseline: 10 });
  });

  it("only looks at the last ten prior runs for the baseline", () => {
    const prior = [1, 1, 1, 1, 1, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50];
    expect(classifyRun(prior, 50, true)).toEqual({ kind: "at", baseline: 50 });
  });

  it("handles a zero baseline without dividing by zero", () => {
    expect(classifyRun([0, 0, 0], 0, true)).toEqual({ kind: "at", baseline: 0 });
    expect(classifyRun([0, 0, 0], 2, true).kind).toBe("personalBest");
  });
});
