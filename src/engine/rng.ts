/**
 * Seedable RNG (mulberry32). Drills use a seeded stream so trial sequences
 * are reproducible in tests; the app seeds from Date.now() in production.
 */
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** integer in [0, n) */
export function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

/** integer in [min, max] inclusive */
export function randIntIn(rng: Rng, min: number, max: number): number {
  return min + randInt(rng, max - min + 1);
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  const item = items[randInt(rng, items.length)];
  if (item === undefined && items.length === 0) {
    throw new Error("pick from empty array");
  }
  return item as T;
}

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}
