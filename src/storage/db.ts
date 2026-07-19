import Dexie, { type Transaction } from "dexie";
import type { RunRecord, SettingRecord } from "./types";

/**
 * Migration scaffold: to change the schema, append a new entry with the next
 * version number and an optional upgrade function; never edit or remove a
 * shipped entry. Dexie replays them in order on open.
 */
interface Migration {
  version: number;
  stores: Record<string, string>;
  upgrade?: (tx: Transaction) => Promise<void> | void;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    stores: {
      runs: "++id, drillId, [drillId+variant], timestamp, sessionTag",
      settings: "key",
    },
  },
];

export class CortexDeckDB extends Dexie {
  runs!: Dexie.Table<RunRecord, number>;
  settings!: Dexie.Table<SettingRecord, string>;

  constructor(name = "cortex-deck") {
    super(name);
    for (const m of MIGRATIONS) {
      const v = this.version(m.version).stores(m.stores);
      if (m.upgrade) v.upgrade(m.upgrade);
    }
  }
}

export const db = new CortexDeckDB();
