import { create } from "zustand";
import type { DrillId } from "../engine/types";
import type { RunRecord } from "../storage/types";
import { runsRepo } from "../storage/runsRepo";

export type Screen =
  | { name: "home" }
  | { name: "drill"; id: DrillId }
  | { name: "faculties" }
  | { name: "prepost" }
  | { name: "settings" };

interface AppStore {
  screen: Screen;
  /** bumped after every data change so data hooks refetch */
  runsVersion: number;
  navigate: (screen: Screen) => void;
  bumpRuns: () => void;
  recordRun: (rec: RunRecord) => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  screen: { name: "home" },
  runsVersion: 0,
  navigate: (screen) => set({ screen }),
  bumpRuns: () => set((s) => ({ runsVersion: s.runsVersion + 1 })),
  recordRun: async (rec) => {
    await runsRepo.add(rec);
    set((s) => ({ runsVersion: s.runsVersion + 1 }));
  },
}));
