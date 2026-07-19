import { db, type CortexDeckDB } from "./db";

export interface AppSettings {
  /** drills chosen for the pre/post battery */
  batteryDrills: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  batteryDrills: ["stroop", "reaction", "gonogo"],
};

export function createSettingsRepo(database: CortexDeckDB = db) {
  return {
    async get(): Promise<AppSettings> {
      const rows = await database.settings.toArray();
      const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return { ...DEFAULT_SETTINGS, ...stored } as AppSettings;
    },

    async set<K extends keyof AppSettings>(
      key: K,
      value: AppSettings[K],
    ): Promise<void> {
      await database.settings.put({ key, value });
    },

    async clearAll(): Promise<void> {
      await database.settings.clear();
    },
  };
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>;
export const settingsRepo = createSettingsRepo();
