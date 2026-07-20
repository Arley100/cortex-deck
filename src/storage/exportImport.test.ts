import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IDBFactory } from "fake-indexeddb";
import { CortexDeckDB } from "./db";
import { exportBundle, importBundle, serializeBundle } from "./exportImport";
import { createRunsRepo } from "./runsRepo";
import type { RunRecord } from "./types";

const run = (over: Partial<RunRecord>): RunRecord => ({
  drillId: "stroop",
  variant: "default",
  timestamp: 1000,
  score: 30,
  unit: "count",
  higherIsBetter: true,
  breakdown: { correct: 30, wrong: 2 },
  ...over,
});

let db: CortexDeckDB;

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  db = new CortexDeckDB("cortex-deck-export-test");
});

afterEach(async () => {
  await db.delete();
});

describe("export and import", () => {
  it("round-trips runs and settings", async () => {
    const repo = createRunsRepo(db);
    await repo.add(run({ score: 31 }));
    await repo.add(run({ score: 35, timestamp: 2000 }));
    await db.settings.put({ key: "batteryDrills", value: ["stroop", "reaction", "gonogo"] });

    const json = serializeBundle(await exportBundle(db));

    const other = new CortexDeckDB("cortex-deck-import-test");
    try {
      const result = await importBundle(json, other);
      expect(result).toEqual({ runs: 2, settings: 1 });
      const restored = createRunsRepo(other);
      expect((await restored.all()).map((r) => r.score)).toEqual([31, 35]);
      expect((await other.settings.get("batteryDrills"))?.value).toEqual([
        "stroop",
        "reaction",
        "gonogo",
      ]);
    } finally {
      await other.delete();
    }
  });

  it("import replaces existing data instead of merging", async () => {
    const repo = createRunsRepo(db);
    await repo.add(run({ score: 99 }));
    const json = serializeBundle({
      app: "cortex-deck",
      version: 1,
      exportedAt: "2026-01-01T00:00:00.000Z",
      runs: [run({ score: 10 })],
      settings: [],
    });
    await importBundle(json, db);
    expect((await repo.all()).map((r) => r.score)).toEqual([10]);
  });

  it("rejects non-JSON and foreign files", async () => {
    await expect(importBundle("not json", db)).rejects.toThrow("not valid JSON");
    await expect(importBundle('{"app":"other"}', db)).rejects.toThrow(
      "not a cortex-deck export",
    );
    await expect(
      importBundle('{"app":"cortex-deck","version":1}', db),
    ).rejects.toThrow("missing runs or settings");
  });
});
