import { db, type CortexDeckDB } from "./db";
import type { RunRecord } from "./types";
import type { DrillId } from "../engine/types";

/** Start of the local day containing `ts`. */
export function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function createRunsRepo(database: CortexDeckDB = db) {
  return {
    async add(run: RunRecord): Promise<number> {
      return database.runs.add(run);
    },

    /** all runs for a drill+variant, oldest first */
    async forDrill(drillId: DrillId, variant: string): Promise<RunRecord[]> {
      const rows = await database.runs
        .where("[drillId+variant]")
        .equals([drillId, variant])
        .toArray();
      return rows.sort((a, b) => a.timestamp - b.timestamp);
    },

    /** headline scores oldest first, for baseline computation */
    async historyValues(drillId: DrillId, variant: string): Promise<number[]> {
      const rows = await this.forDrill(drillId, variant);
      return rows.map((r) => r.score);
    },

    /** latest run for a drill+variant on the local day containing `now` */
    async latestToday(
      drillId: DrillId,
      variant: string,
      now: number = Date.now(),
    ): Promise<RunRecord | null> {
      const rows = await this.forDrill(drillId, variant);
      const dayStart = startOfDay(now);
      const today = rows.filter(
        (r) => r.timestamp >= dayStart && r.timestamp <= now,
      );
      return today.length > 0 ? (today[today.length - 1] as RunRecord) : null;
    },

    async bySessionTag(tag: string): Promise<RunRecord[]> {
      const rows = await database.runs.where("sessionTag").equals(tag).toArray();
      return rows.sort((a, b) => a.timestamp - b.timestamp);
    },

    async all(): Promise<RunRecord[]> {
      const rows = await database.runs.toArray();
      return rows.sort((a, b) => a.timestamp - b.timestamp);
    },

    async clearAll(): Promise<void> {
      await database.runs.clear();
    },
  };
}

export type RunsRepo = ReturnType<typeof createRunsRepo>;
export const runsRepo = createRunsRepo();
