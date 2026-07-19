export type DrillId =
  | "nback"
  | "stroop"
  | "sequence"
  | "mathsprint"
  | "reaction"
  | "gonogo";

export type ScoreUnit = "%" | "ms" | "count" | "span";

/**
 * A single scored event emitted by a drill run. Drills push these into the
 * run context; scoring functions consume the full list at the end.
 */
export interface TrialEvent {
  /** index of the trial within the run, 0-based */
  trial: number;
  /** what the correct behavior was for this trial */
  kind: "target" | "nontarget";
  /** what the user did */
  response: "hit" | "miss" | "falseAlarm" | "correctReject" | "correct" | "wrong";
  /** response time in ms measured with performance.now(), when applicable */
  rt?: number;
  /** drill-specific payload, e.g. the answer value or pad index */
  detail?: Record<string, number | string | boolean>;
}

export interface DrillScore {
  /** the headline metric */
  primary: number;
  unit: ScoreUnit;
  higherIsBetter: boolean;
  /** hits, misses, falseAlarms, etc.; always reported separately */
  breakdown: Record<string, number>;
  /** for nback and gonogo */
  dPrime?: number;
}

export interface RunMeta {
  /** variant actually run, chosen on the drill's intro screen */
  variant?: string;
}

export interface DrillContext {
  /** where the drill mounts its UI */
  container: HTMLElement;
  /** variant preselected by the caller, if any */
  variant?: string;
  /** report a finished run; may fire more than once if the user replays */
  complete: (events: TrialEvent[], meta?: RunMeta) => void;
  /** user tapped exit; host tears the drill down */
  exit?: () => void;
  /** host registers teardown work to run when the drill is removed */
  registerCleanup?: (fn: () => void) => void;
}

export interface DrillDefinition {
  id: DrillId;
  name: string;
  /** e.g. "working memory" */
  faculty: string;
  /** e.g. ["2-back", "3-back"] */
  variants?: string[];
  run(ctx: DrillContext): void;
  score(events: TrialEvent[]): DrillScore;
}
