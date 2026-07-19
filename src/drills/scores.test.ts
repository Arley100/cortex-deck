import { describe, expect, it } from "vitest";
import type { TrialEvent } from "../engine/types";
import { scoreNBack } from "./nback";
import { createScoreStroop } from "./stroop";
import { scoreSequence } from "./sequence";
import { scoreMathSprint } from "./mathsprint";
import { scoreReaction } from "./reaction";
import { scoreGoNoGo } from "./gonogo";

const ev = (over: Partial<TrialEvent>): TrialEvent => ({
  trial: 0,
  kind: "target",
  response: "hit",
  ...over,
});

describe("scoreNBack", () => {
  it("reports accuracy, separate counts, and d-prime", () => {
    const events: TrialEvent[] = [
      ev({ response: "hit", rt: 500 }),
      ev({ response: "hit", rt: 700 }),
      ev({ response: "miss" }),
      ev({ kind: "nontarget", response: "falseAlarm" }),
      ...Array.from({ length: 4 }, (_, i) =>
        ev({ trial: 4 + i, kind: "nontarget", response: "correctReject" }),
      ),
    ];
    const s = scoreNBack(events);
    expect(s.primary).toBe(75); // (2 hits + 4 cr) / 8
    expect(s.unit).toBe("%");
    expect(s.higherIsBetter).toBe(true);
    expect(s.breakdown).toEqual({
      hits: 2,
      missedMatches: 1,
      falseAlarms: 1,
      correctPasses: 4,
    });
    expect(Number.isFinite(s.dPrime)).toBe(true);
  });
});

describe("createScoreStroop", () => {
  it("headline is correct count with accuracy and pace in the breakdown", () => {
    const events: TrialEvent[] = [
      ev({ response: "correct" }),
      ev({ response: "correct" }),
      ev({ response: "correct" }),
      ev({ response: "wrong" }),
    ];
    const s = createScoreStroop(45)(events);
    expect(s.primary).toBe(3);
    expect(s.unit).toBe("count");
    expect(s.breakdown.accuracy).toBe(75);
    expect(s.breakdown.perMinute).toBe(4); // 3 correct in 45 s
  });
});

describe("scoreSequence", () => {
  it("span equals completed rounds", () => {
    const events: TrialEvent[] = [
      ev({ response: "correct", detail: { length: 1 } }),
      ev({ response: "correct", detail: { length: 2 } }),
      ev({ response: "correct", detail: { length: 3 } }),
      ev({ response: "wrong", detail: { length: 4 } }),
    ];
    const s = scoreSequence(events);
    expect(s.primary).toBe(3);
    expect(s.unit).toBe("span");
    expect(s.breakdown.errors).toBe(1);
  });

  it("handles a fail on the very first round", () => {
    const s = scoreSequence([ev({ response: "wrong" })]);
    expect(s.primary).toBe(0);
  });
});

describe("scoreMathSprint", () => {
  it("tracks best streak across the event order", () => {
    const events: TrialEvent[] = [
      ev({ response: "correct" }),
      ev({ response: "correct" }),
      ev({ response: "wrong" }),
      ev({ response: "correct" }),
      ev({ response: "correct" }),
      ev({ response: "correct" }),
    ];
    const s = scoreMathSprint(events);
    expect(s.primary).toBe(5);
    expect(s.breakdown.bestStreak).toBe(3);
    expect(s.breakdown.accuracy).toBe(83);
  });
});

describe("scoreReaction", () => {
  it("keeps fastest as headline, lower is better, early taps counted", () => {
    const events: TrialEvent[] = [
      ev({ response: "hit", rt: 320 }),
      ev({ kind: "nontarget", response: "falseAlarm", detail: { early: true } }),
      ev({ response: "hit", rt: 250 }),
      ev({ response: "hit", rt: 300 }),
    ];
    const s = scoreReaction(events);
    expect(s.primary).toBe(250);
    expect(s.unit).toBe("ms");
    expect(s.higherIsBetter).toBe(false);
    expect(s.breakdown.average).toBe(290);
    expect(s.breakdown.earlyTaps).toBe(1);
  });
});

describe("scoreGoNoGo", () => {
  it("reports all four outcome classes, mean go RT, and d-prime", () => {
    const events: TrialEvent[] = [
      ev({ response: "hit", rt: 400 }),
      ev({ response: "hit", rt: 600 }),
      ev({ response: "miss" }),
      ev({ kind: "nontarget", response: "falseAlarm" }),
      ev({ kind: "nontarget", response: "correctReject" }),
      ev({ kind: "nontarget", response: "correctReject" }),
      ev({ kind: "nontarget", response: "correctReject" }),
    ];
    const s = scoreGoNoGo(events);
    expect(s.primary).toBe(71); // (2 + 3) / 7
    expect(s.breakdown).toEqual({
      hits: 2,
      correctStops: 3,
      commissions: 1,
      omissions: 1,
      meanGoRt: 500,
    });
    expect(Number.isFinite(s.dPrime)).toBe(true);
  });
});
