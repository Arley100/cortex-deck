import type { ScoreUnit } from "../engine/types";

/** Formats a headline value with its unit; medians may carry one decimal. */
export function formatValue(value: number | null, unit: ScoreUnit | null): string {
  if (value === null) return "·";
  const v = Number.isInteger(value) ? `${value}` : value.toFixed(1);
  if (unit === "%") return `${v}%`;
  if (unit === "ms") return `${v} ms`;
  return v;
}
