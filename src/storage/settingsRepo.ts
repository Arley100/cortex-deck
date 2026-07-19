import { db, type CortexDeckDB } from "./db";

export interface PrePostSession {
  /** shared tag on both halves of the session */
  tag: string;
}

export interface AppSettings {
  /** drills chosen for the pre/post battery */
  batteryDrills: string[];
  /** a pre battery is done and the post battery is still pending */
  activePrePost: PrePostSession | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  batteryDrills: ["stroop", "reaction", "gonogo"],
  activePrePost: null,
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
