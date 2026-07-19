import { describe, expect, it } from "vitest";
import { tallyChoice, tallyDetection } from "./tally";
import type { TrialEvent } from "../engine/types";

describe("tallyDetection", () => {
  it("counts each response type separately and averages hit RTs", () => {
    const events: TrialEvent[] = [
      { trial: 0, kind: "target", response: "hit", rt: 400 },
      { trial: 1, kind: "target", response: "hit", rt: 600 },
      { trial: 2, kind: "target", response: "miss" },
      { trial: 3, kind: "nontarget", response: "falseAlarm" },
      { trial: 4, kind: "nontarget", response: "correctReject" },
      { trial: 5, kind: "nontarget", response: "correctReject" },
    ];
    expect(tallyDetection(events)).toEqual({
      hits: 2,
      misses: 1,
      falseAlarms: 1,
      correctRejects: 2,
      meanHitRt: 500,
    });
  });

  it("returns zeros for an empty run", () => {
    expect(tallyDetection([])).toEqual({
      hits: 0,
      misses: 0,
      falseAlarms: 0,
      correctRejects: 0,
      meanHitRt: 0,
    });
  });
});

describe("tallyChoice", () => {
  it("counts correct and wrong", () => {
    const events: TrialEvent[] = [
      { trial: 0, kind: "target", response: "correct" },
      { trial: 1, kind: "target", response: "correct" },
      { trial: 2, kind: "target", response: "wrong" },
    ];
    expect(tallyChoice(events)).toEqual({ correct: 2, wrong: 1 });
  });
});
