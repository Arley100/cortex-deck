import { describe, expect, it } from "vitest";
import { accuracyPercent, mean, perMinute, roundedMean } from "./accuracy";

describe("accuracyPercent", () => {
  it("rounds to whole percent", () => {
    expect(accuracyPercent(2, 3)).toBe(67);
  });
  it("is 0 with no trials", () => {
    expect(accuracyPercent(0, 0)).toBe(0);
  });
  it("handles perfect and zero scores", () => {
    expect(accuracyPercent(10, 10)).toBe(100);
    expect(accuracyPercent(0, 10)).toBe(0);
  });
});

describe("perMinute", () => {
  it("scales counts to a minute", () => {
    expect(perMinute(31, 45)).toBe(41);
    expect(perMinute(24, 60)).toBe(24);
  });
  it("is 0 for zero duration", () => {
    expect(perMinute(5, 0)).toBe(0);
  });
});

describe("mean helpers", () => {
  it("mean of empty list is 0", () => {
    expect(mean([])).toBe(0);
  });
  it("roundedMean rounds", () => {
    expect(roundedMean([200, 201])).toBe(201);
    expect(roundedMean([100, 101, 101])).toBe(101);
  });
});
