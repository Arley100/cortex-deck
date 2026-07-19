import { describe, expect, it } from "vitest";
import { bestStreak } from "./streaks";

describe("bestStreak", () => {
  it("finds the longest run", () => {
    expect(bestStreak([true, true, false, true, true, true, false])).toBe(3);
  });
  it("is 0 for empty or all-false", () => {
    expect(bestStreak([])).toBe(0);
    expect(bestStreak([false, false])).toBe(0);
  });
  it("counts a full run", () => {
    expect(bestStreak([true, true, true])).toBe(3);
  });
  it("counts a trailing run", () => {
    expect(bestStreak([false, true, true])).toBe(2);
  });
});
