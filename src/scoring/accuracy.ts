/** Rounded percentage; 0 when there is nothing to score. */
export function accuracyPercent(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/** Answers per minute given a run length in seconds. */
export function perMinute(count: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.round((count / seconds) * 60);
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function roundedMean(values: readonly number[]): number {
  return Math.round(mean(values));
}
