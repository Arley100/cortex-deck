import type { RunVerdict } from "../baseline/verdict";
import type { ScoreUnit } from "../engine/types";
import type { SfxName } from "../audio/engine";
import { formatValue } from "../components/format";
import type { PipMood } from "./Pip";

export interface Reaction {
  mood: PipMood;
  line: string;
  /** sounds to play and when, ms after the reaction appears */
  sounds: { name: SfxName; at: number }[];
}

/** clap sounds land where Pip's hands meet: 0.1 s delay + half of a 0.5 s cycle */
const claps = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ name: "clap" as const, at: 350 + i * 500 }));

/**
 * What Pip does after a run. Lines state the comparison and nothing more:
 * no praise beyond what the numbers show, and "below" is a state, not a
 * verdict on the person.
 */
export function reactionFor(verdict: RunVerdict, unit: ScoreUnit): Reaction {
  const f = (v: number) => formatValue(v, unit);
  switch (verdict.kind) {
    case "personalBest":
      return {
        mood: "celebrate",
        line: `New personal best. Your previous best was ${f(verdict.previousBest)}.`,
        sounds: [...claps(4), { name: "chime", at: 2150 }],
      };
    case "above":
      return {
        mood: "clap",
        line: `Above your baseline of ${f(verdict.baseline)}.`,
        sounds: claps(3),
      };
    case "at":
      return {
        mood: "nod",
        line: `Right at your baseline of ${f(verdict.baseline)}. Steady.`,
        sounds: [{ name: "good", at: 250 }],
      };
    case "below":
      return {
        mood: "encourage",
        line: `Below your baseline of ${f(verdict.baseline)} today. Another rep?`,
        sounds: [{ name: "lift", at: 200 }],
      };
    case "calibrating":
      return {
        mood: "wave",
        line:
          verdict.runs >= verdict.needed
            ? `That is ${verdict.runs} runs. Your baseline is set from here on.`
            : `Calibrating: ${verdict.runs}/${verdict.needed} runs logged. Your baseline needs ${verdict.needed}.`,
        sounds: [{ name: "toggle", at: 200 }],
      };
  }
}

export interface HomeRow {
  name: string;
  status:
    | { kind: "calibrating"; runs: number; needed: number }
    | { kind: "ready"; today: "above" | "at" | "below" | null };
}

function list(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Pip's line on the home screen: the targeted-reps prescription. Drills
 * below baseline today come first, then calibration, then a neutral prompt.
 */
export function homeGreeting(rows: HomeRow[]): { mood: PipMood; line: string } {
  const below = rows.filter((r) => r.status.kind === "ready" && r.status.today === "below");
  if (below.length > 0) {
    const names = below.map((r) => r.name);
    return {
      mood: "encourage",
      line: `${list(names)} ${names.length === 1 ? "is" : "are"} below your baseline today. A few targeted reps there?`,
    };
  }
  const calibrating = rows.filter((r) => r.status.kind === "calibrating");
  const totalRuns = calibrating.reduce(
    (n, r) => n + (r.status.kind === "calibrating" ? r.status.runs : 0),
    0,
  );
  if (calibrating.length === rows.length && totalRuns === 0) {
    return {
      mood: "wave",
      line: "Hi, I am Pip. Run each drill 3 times and I will learn your baseline. You are only ever compared with yourself.",
    };
  }
  if (calibrating.length > 0) {
    return {
      mood: "wave",
      line: `${calibrating.length} of ${rows.length} drills still calibrating. Three runs each sets the baseline.`,
    };
  }
  const ranToday = rows.filter((r) => r.status.kind === "ready" && r.status.today !== null);
  if (ranToday.length === 0) {
    return { mood: "idle", line: "Baselines are set. Pick any drill for today's check-in." };
  }
  return {
    mood: "nod",
    line: "Everything you ran today is at or above your baseline.",
  };
}
