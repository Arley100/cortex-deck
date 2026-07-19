/** Longest run of consecutive true values. */
export function bestStreak(outcomes: readonly boolean[]): number {
  let best = 0;
  let current = 0;
  for (const ok of outcomes) {
    current = ok ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}
