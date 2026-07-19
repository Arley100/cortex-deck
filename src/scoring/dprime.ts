/**
 * Signal-detection d-prime for the target/nontarget drills (N-Back, Go/No-Go).
 * Rates of exactly 0 or 1 use the standard 1/(2N) correction so the probit
 * never sees 0 or 1 and the result stays finite.
 */

export interface DetectionCounts {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejects: number;
}

/**
 * Inverse of the standard normal CDF (probit), Acklam's rational
 * approximation; absolute error under 1.2e-9 on (0, 1).
 */
export function probit(p: number): number {
  if (p <= 0 || p >= 1) {
    throw new RangeError(`probit expects p in (0, 1), got ${p}`);
  }
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ] as const;
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ] as const;
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ] as const;
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ] as const;
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/** Rate clamped away from 0 and 1 with the 1/(2N) correction. */
export function correctedRate(count: number, n: number): number {
  const rate = count / n;
  if (rate <= 0) return 1 / (2 * n);
  if (rate >= 1) return 1 - 1 / (2 * n);
  return rate;
}

/**
 * d' = z(hitRate) - z(faRate). Returns 0 when either stimulus class is
 * absent, since sensitivity is undefined without both classes.
 */
export function dPrime(counts: DetectionCounts): number {
  const nTargets = counts.hits + counts.misses;
  const nNontargets = counts.falseAlarms + counts.correctRejects;
  if (nTargets === 0 || nNontargets === 0) return 0;
  const hitRate = correctedRate(counts.hits, nTargets);
  const faRate = correctedRate(counts.falseAlarms, nNontargets);
  return probit(hitRate) - probit(faRate);
}
