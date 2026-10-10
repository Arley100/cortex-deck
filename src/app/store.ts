import { create } from "zustand";
import type { DrillId, ScoreUnit } from "../engine/types";
import type { RunRecord } from "../storage/types";
import { runsRepo } from "../storage/runsRepo";
import { settingsRepo, type SoundPrefs } from "../storage/settingsRepo";
import { classifyRun, type RunVerdict } from "../baseline/verdict";
import { sound } from "../audio/engine";

export type Screen =
  | { name: "home" }
  | { name: "drill"; id: DrillId }
  | { name: "faculties" }
  | { name: "prepost" }
  | { name: "settings" };

/** verdict for the most recent recorded run; results screens read this */
export type LastVerdict =
  | { key: number; status: "pending" }
  | { key: number; status: "ready"; verdict: RunVerdict; unit: ScoreUnit; score: number };

interface AppStore {
  screen: Screen;
  /** bumped after every data change so data hooks refetch */
  runsVersion: number;
  lastVerdict: LastVerdict | null;
  soundPrefs: SoundPrefs;
  navigate: (screen: Screen) => void;
  bumpRuns: () => void;
  recordRun: (rec: RunRecord) => Promise<void>;
  loadSoundPrefs: () => Promise<void>;
  setSoundPref: (key: keyof SoundPrefs, on: boolean) => void;
}

let verdictSeq = 0;

export const useAppStore = create<AppStore>((set, get) => ({
  screen: { name: "home" },
  runsVersion: 0,
  lastVerdict: null,
  soundPrefs: { sfx: true, ambient: false },
  navigate: (screen) => set({ screen }),
  bumpRuns: () => set((s) => ({ runsVersion: s.runsVersion + 1 })),
  recordRun: async (rec) => {
    // mark pending synchronously so a results screen never shows the
    // previous run's verdict while this one is computed
    const key = ++verdictSeq;
    set({ lastVerdict: { key, status: "pending" } });
    const prior = await runsRepo.historyValues(rec.drillId, rec.variant);
    const verdict = classifyRun(prior, rec.score, rec.higherIsBetter);
    await runsRepo.add(rec);
    set((s) => ({
      runsVersion: s.runsVersion + 1,
      lastVerdict:
        s.lastVerdict?.key === key
          ? { key, status: "ready", verdict, unit: rec.unit, score: rec.score }
          : s.lastVerdict,
    }));
  },
  loadSoundPrefs: async () => {
    const prefs = (await settingsRepo.get()).sound;
    sound.setSfx(prefs.sfx);
    sound.setAmbient(prefs.ambient);
    set({ soundPrefs: prefs });
  },
  setSoundPref: (key, on) => {
    const prefs = { ...get().soundPrefs, [key]: on };
    if (key === "sfx") sound.setSfx(on);
    else sound.setAmbient(on);
    set({ soundPrefs: prefs });
    void settingsRepo.set("sound", prefs);
  },
}));
