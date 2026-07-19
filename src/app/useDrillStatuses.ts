import { useEffect, useState } from "react";
import { DRILLS } from "../drills/registry";
import type { DrillId, ScoreUnit } from "../engine/types";
import type { Accent } from "../components/accent";
import { baselineStatus, type BaselineStatus } from "../baseline/baseline";
import { runsRepo } from "../storage/runsRepo";
import { useAppStore } from "./store";

export interface DrillStatusRow {
  id: DrillId;
  name: string;
  faculty: string;
  accent: Accent;
  glyph: string;
  /** representative variant: the one most recently run, else the first */
  variant: string;
  status: BaselineStatus;
  todayValue: number | null;
  /** last 10 headline scores, oldest first, for the sparkline */
  last10: number[];
  unit: ScoreUnit | null;
}

/**
 * Per-drill baseline status for the home and faculties screens. Battery runs
 * are stored under the "battery" variant and are not considered here.
 */
export function useDrillStatuses(): DrillStatusRow[] | null {
  const runsVersion = useAppStore((s) => s.runsVersion);
  const [rows, setRows] = useState<DrillStatusRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const out: DrillStatusRow[] = [];
      for (const entry of DRILLS) {
        const id = entry.definition.id;
        let variant = entry.variantKeys[0] as string;
        let latestTs = -1;
        for (const v of entry.variantKeys) {
          const runs = await runsRepo.forDrill(id, v);
          const last = runs[runs.length - 1];
          if (last && last.timestamp > latestTs) {
            latestTs = last.timestamp;
            variant = v;
          }
        }
        const runs = await runsRepo.forDrill(id, variant);
        const values = runs.map((r) => r.score);
        const today = await runsRepo.latestToday(id, variant);
        const higherIsBetter =
          runs.length > 0 ? (runs[0] as (typeof runs)[number]).higherIsBetter : true;
        out.push({
          id,
          name: entry.definition.name,
          faculty: entry.definition.faculty,
          accent: entry.accent,
          glyph: entry.glyph,
          variant,
          status: baselineStatus(values, today ? today.score : null, higherIsBetter),
          todayValue: today ? today.score : null,
          last10: values.slice(-10),
          unit: runs.length > 0 ? (runs[0] as (typeof runs)[number]).unit : null,
        });
      }
      if (alive) setRows(out);
    })();
    return () => {
      alive = false;
    };
  }, [runsVersion]);

  return rows;
}
