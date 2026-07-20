import { db, type CortexDeckDB } from "./db";
import type { RunRecord, SettingRecord } from "./types";

/** Single-file JSON export; everything the app knows, nothing leaves the
 * device unless the user moves the file themselves. */
export interface ExportBundleV1 {
  app: "cortex-deck";
  version: 1;
  exportedAt: string;
  runs: RunRecord[];
  settings: SettingRecord[];
}

export async function exportBundle(database: CortexDeckDB = db): Promise<ExportBundleV1> {
  const [runs, settings] = await Promise.all([
    database.runs.toArray(),
    database.settings.toArray(),
  ]);
  return {
    app: "cortex-deck",
    version: 1,
    exportedAt: new Date().toISOString(),
    runs,
    settings,
  };
}

export function serializeBundle(bundle: ExportBundleV1): string {
  return JSON.stringify(bundle, null, 2);
}

/** Replaces all stored data with the bundle's contents. */
export async function importBundle(
  json: string,
  database: CortexDeckDB = db,
): Promise<{ runs: number; settings: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("file is not valid JSON");
  }
  const bundle = parsed as Partial<ExportBundleV1>;
  if (bundle.app !== "cortex-deck" || bundle.version !== 1) {
    throw new Error("file is not a cortex-deck export");
  }
  if (!Array.isArray(bundle.runs) || !Array.isArray(bundle.settings)) {
    throw new Error("export file is missing runs or settings");
  }
  const runs = bundle.runs.map((r) => {
    const { ...rest } = r as RunRecord;
    delete rest.id;
    return rest;
  });
  await database.transaction("rw", database.runs, database.settings, async () => {
    await database.runs.clear();
    await database.settings.clear();
    await database.runs.bulkAdd(runs);
    await database.settings.bulkPut(bundle.settings as SettingRecord[]);
  });
  return { runs: runs.length, settings: bundle.settings.length };
}
