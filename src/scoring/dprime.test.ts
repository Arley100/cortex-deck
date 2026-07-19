import { describe, expect, it } from "vitest";
import { correctedRate, dPrime, probit } from "./dprime";

describe("probit", () => {
  it("is 0 at the median", () => {
    expect(probit(0.5)).toBeCloseTo(0, 9);
  });

  it("matches known quantiles", () => {
    expect(probit(0.975)).toBeCloseTo(1.959964, 5);
    expect(probit(0.841345)).toBeCloseTo(1, 4);
  });

  it("is antisymmetric", () => {
    expect(probit(0.25)).toBeCloseTo(-probit(0.75), 9);
    expect(probit(0.01)).toBeCloseTo(-probit(0.99), 8);
  });

  it("rejects 0 and 1", () => {
    expect(() => probit(0)).toThrow(RangeError);
    expect(() => probit(1)).toThrow(RangeError);
  });
});

describe("correctedRate", () => {
  it("passes ordinary rates through", () => {
    expect(correctedRate(3, 10)).toBeCloseTo(0.3);
  });

  it("applies the 1/(2N) floor at rate 0", () => {
    expect(correctedRate(0, 10)).toBeCloseTo(0.05);
  });

  it("applies the 1 - 1/(2N) ceiling at rate 1", () => {
    expect(correctedRate(10, 10)).toBeCloseTo(0.95);
  });
});

describe("dPrime", () => {
  it("computes a known value", () => {
    // HR = 7/8 = 0.875, FAR = 2/8 = 0.25
    const d = dPrime({ hits: 7, misses: 1, falseAlarms: 2, correctRejects: 6 });
    expect(d).toBeCloseTo(1.8248, 3);
  });

  it("is 0 when hit and false alarm rates are equal", () => {
    const d = dPrime({ hits: 4, misses: 4, falseAlarms: 4, correctRejects: 4 });
    expect(d).toBeCloseTo(0, 9);
  });

  it("stays finite on a perfect run via the 1/(2N) correction", () => {
    // 8 targets all hit, 16 nontargets none touched
    const d = dPrime({ hits: 8, misses: 0, falseAlarms: 0, correctRejects: 16 });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeCloseTo(3.3969, 3);
  });

  it("stays finite on an all-miss, all-false-alarm run", () => {
    const d = dPrime({ hits: 0, misses: 8, falseAlarms: 16, correctRejects: 0 });
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeLessThan(0);
  });

  it("returns 0 when a stimulus class is absent", () => {
    expect(dPrime({ hits: 0, misses: 0, falseAlarms: 2, correctRejects: 6 })).toBe(0);
    expect(dPrime({ hits: 5, misses: 3, falseAlarms: 0, correctRejects: 0 })).toBe(0);
  });
});
