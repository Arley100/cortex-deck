import { createTimeline, type Timeline } from "./timeline";

/**
 * Shared trial scheduler. A drill declares its trial pacing (stimulus window,
 * optional blank gap, trial count); the scheduler owns all timing and the
 * drill only reacts to callbacks. Cancelling stops everything pending.
 */
export interface TrialLoopOptions {
  trials: number;
  /** how long each stimulus stays up, ms */
  stimulusMs: number;
  /** blank gap between trials, ms; 0 means immediate */
  blankMs?: number;
  onStimulus: (index: number) => void;
  /** fires when the stimulus window closes, before the blank */
  onStimulusEnd: (index: number) => void;
  onDone: () => void;
}

export interface TrialLoopHandle {
  cancel: () => void;
}

export function runTrialLoop(opts: TrialLoopOptions): TrialLoopHandle {
  const tl = createTimeline();
  const blank = opts.blankMs ?? 0;

  const runTrial = (i: number) => {
    if (i >= opts.trials) {
      opts.onDone();
      return;
    }
    opts.onStimulus(i);
    tl.after(opts.stimulusMs, () => {
      opts.onStimulusEnd(i);
      if (blank > 0) tl.after(blank, () => runTrial(i + 1));
      else runTrial(i + 1);
    });
  };

  runTrial(0);
  return { cancel: () => tl.cancel() };
}

/**
 * One-second countdown for the timed drills (Stroop, Math Sprint).
 */
export interface CountdownHandle {
  cancel: () => void;
}

export function runCountdown(
  seconds: number,
  onTick: (remaining: number) => void,
  onDone: () => void,
): CountdownHandle {
  const tl = createTimeline();
  let remaining = seconds;
  tl.every(1000, () => {
    remaining -= 1;
    if (remaining <= 0) {
      tl.cancel();
      onTick(0);
      onDone();
      return;
    }
    onTick(remaining);
  });
  return { cancel: () => tl.cancel() };
}

export type { Timeline };
export { createTimeline };
