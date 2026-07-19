import { describe, expect, it } from "vitest";
import {
  baselineStatus,
  computeBaseline,
  deviation,
  median,
} from "./baseline";

describe("median", () => {
  it("takes the middle of an odd list", () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it("averages the two middles of an even list", () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
  it("throws on an empty list", () => {
    expect(() => median([])).toThrow(RangeError);
  });
});

describe("computeBaseline", () => {
  it("is null below the minimum run count", () => {
    expect(computeBaseline([])).toBeNull();
    expect(computeBaseline([10, 12])).toBeNull();
  });
  it("exists from three runs", () => {
    expect(computeBaseline([10, 12, 14])).toBe(12);
  });
  it("uses only the last 10 runs", () => {
    // 5 old outliers followed by 10 recent values of 20
    const history = [100, 100, 100, 100, 100, ...Array(10).fill(20)];
    expect(computeBaseline(history)).toBe(20);
  });
});

describe("deviation", () => {
  it("flags within 10 percent as at baseline", () => {
    expect(deviation(100, 100, true)).toBe("at");
    expect(deviation(109, 100, true)).toBe("at");
    expect(deviation(91, 100, true)).toBe("at");
    // exactly 10 percent off is still at baseline
    expect(deviation(110, 100, true)).toBe("at");
    expect(deviation(90, 100, true)).toBe("at");
  });
  it("flags more than 10 percent better as above", () => {
    expect(deviation(111, 100, true)).toBe("above");
  });
  it("flags more than 10 percent worse as below", () => {
    expect(deviation(89, 100, true)).toBe("below");
  });
  it("inverts for lower-is-better metrics", () => {
    // reaction time: faster is better
    expect(deviation(250, 300, false)).toBe("above");
    expect(deviation(340, 300, false)).toBe("below");
    expect(deviation(310, 300, false)).toBe("at");
  });
  it("handles a zero baseline", () => {
    expect(deviation(0, 0, true)).toBe("at");
    expect(deviation(5, 0, true)).toBe("above");
    expect(deviation(5, 0, false)).toBe("below");
  });
});

describe("baselineStatus", () => {
  it("reports calibrating with run count", () => {
    expect(baselineStatus([10, 11], null, true)).toEqual({
      kind: "calibrating",
      runs: 2,
      needed: 3,
    });
  });
  it("reports ready with no run today", () => {
    expect(baselineStatus([10, 12, 14], null, true)).toEqual({
      kind: "ready",
      baseline: 12,
      today: null,
    });
  });
  it("reports today's deviation once a run exists", () => {
    expect(baselineStatus([10, 12, 14], 20, true)).toEqual({
      kind: "ready",
      baseline: 12,
      today: "above",
    });
  });
});
