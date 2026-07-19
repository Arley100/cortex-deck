import { describe, expect, it } from "vitest";
import { createRng, pick, randInt, randIntIn, shuffle } from "./rng";

describe("createRng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("differs across seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });

  it("stays in [0, 1)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("helpers", () => {
  it("randInt stays in range and hits every bucket eventually", () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = randInt(rng, 4);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(4);
      seen.add(v);
    }
    expect(seen.size).toBe(4);
  });

  it("randIntIn is inclusive of both bounds", () => {
    const rng = createRng(9);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randIntIn(rng, 2, 4));
    expect([...seen].sort()).toEqual([2, 3, 4]);
  });

  it("pick returns a member and throws on empty", () => {
    const rng = createRng(5);
    expect(["a", "b", "c"]).toContain(pick(rng, ["a", "b", "c"]));
    expect(() => pick(rng, [])).toThrow();
  });

  it("shuffle permutes without losing elements", () => {
    const rng = createRng(11);
    const out = shuffle(rng, [1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
