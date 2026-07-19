import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { CortexDeckDB } from "./db";
import { createRunsRepo, startOfDay } from "./runsRepo";
import { createSettingsRepo, DEFAULT_SETTINGS } from "./settingsRepo";
import type { RunRecord } from "./types";

const run = (over: Partial<RunRecord>): RunRecord => ({
  drillId: "stroop",
  variant: "default",
  timestamp: Date.now(),
  score: 30,
  unit: "count",
  higherIsBetter: true,
  breakdown: { correct: 30, wrong: 2 },
  ...over,
});

let db: CortexDeckDB;

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  db = new CortexDeckDB("cortex-deck-test");
});

afterEach(async () => {
  await db.delete();
});

describe("runsRepo", () => {
  it("stores runs and returns them oldest first per drill+variant", async () => {
    const repo = createRunsRepo(db);
    await repo.add(run({ timestamp: 3000, score: 33 }));
    await repo.add(run({ timestamp: 1000, score: 31 }));
    await repo.add(run({ timestamp: 2000, score: 32 }));
    await repo.add(run({ drillId: "nback", variant: "2-back", timestamp: 500 }));

    const rows = await repo.forDrill("stroop", "default");
    expect(rows.map((r) => r.timestamp)).toEqual([1000, 2000, 3000]);
    expect(await repo.historyValues("stroop", "default")).toEqual([31, 32, 33]);
  });

  it("finds the latest run of the current day only", async () => {
    const repo = createRunsRepo(db);
    const now = Date.now();
    const yesterday = now - 24 * 60 * 60 * 1000;
    await repo.add(run({ timestamp: yesterday, score: 10 }));
    await repo.add(run({ timestamp: startOfDay(now) + 1000, score: 20 }));
    await repo.add(run({ timestamp: startOfDay(now) + 2000, score: 25 }));

    const latest = await repo.latestToday("stroop", "default", now);
    expect(latest?.score).toBe(25);
  });

  it("returns null when no run today", async () => {
    const repo = createRunsRepo(db);
    const now = Date.now();
    await repo.add(run({ timestamp: now - 24 * 60 * 60 * 1000 }));
    expect(await repo.latestToday("stroop", "default", now)).toBeNull();
  });

  it("groups by session tag in time order", async () => {
    const repo = createRunsRepo(db);
    await repo.add(run({ timestamp: 2000, sessionTag: "s1", phase: "post" }));
    await repo.add(run({ timestamp: 1000, sessionTag: "s1", phase: "pre" }));
    await repo.add(run({ timestamp: 1500, sessionTag: "s2" }));

    const rows = await repo.bySessionTag("s1");
    expect(rows.map((r) => r.phase)).toEqual(["pre", "post"]);
  });

  it("clearAll wipes runs", async () => {
    const repo = createRunsRepo(db);
    await repo.add(run({}));
    await repo.clearAll();
    expect(await repo.all()).toEqual([]);
  });
});

describe("settingsRepo", () => {
  it("returns defaults when empty and persists overrides", async () => {
    const repo = createSettingsRepo(db);
    expect(await repo.get()).toEqual(DEFAULT_SETTINGS);
    await repo.set("batteryDrills", ["stroop", "mathsprint", "reaction"]);
    expect((await repo.get()).batteryDrills).toEqual([
      "stroop",
      "mathsprint",
      "reaction",
    ]);
  });
});
