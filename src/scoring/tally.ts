import type { TrialEvent } from "../engine/types";
import { roundedMean } from "./accuracy";

export interface DetectionTally {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejects: number;
  /** rounded mean RT of hit responses, ms; 0 when there were none */
  meanHitRt: number;
}

/** Counts detection-style events (N-Back, Go/No-Go). */
export function tallyDetection(events: readonly TrialEvent[]): DetectionTally {
  const t = { hits: 0, misses: 0, falseAlarms: 0, correctRejects: 0 };
  const rts: number[] = [];
  for (const e of events) {
    switch (e.response) {
      case "hit":
        t.hits++;
        if (e.rt !== undefined) rts.push(e.rt);
        break;
      case "miss":
        t.misses++;
        break;
      case "falseAlarm":
        t.falseAlarms++;
        break;
      case "correctReject":
        t.correctRejects++;
        break;
      case "correct":
      case "wrong":
        break;
    }
  }
  return { ...t, meanHitRt: roundedMean(rts) };
}

export interface ChoiceTally {
  correct: number;
  wrong: number;
}

/** Counts forced-choice events (Stroop, Math Sprint). */
export function tallyChoice(events: readonly TrialEvent[]): ChoiceTally {
  let correct = 0;
  let wrong = 0;
  for (const e of events) {
    if (e.response === "correct") correct++;
    else if (e.response === "wrong") wrong++;
  }
  return { correct, wrong };
}
