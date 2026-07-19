import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTimeline } from "./timeline";
import { runCountdown, runTrialLoop } from "./scheduler";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("createTimeline", () => {
  it("fires scheduled callbacks in order", () => {
    const tl = createTimeline();
    const calls: string[] = [];
    tl.after(100, () => calls.push("a"));
    tl.after(50, () => calls.push("b"));
    vi.advanceTimersByTime(100);
    expect(calls).toEqual(["b", "a"]);
  });

  it("cancel clears everything pending and blocks new work", () => {
    const tl = createTimeline();
    const fn = vi.fn();
    tl.after(100, fn);
    tl.every(50, fn);
    tl.cancel();
    tl.after(10, fn);
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
    expect(tl.cancelled).toBe(true);
  });
});

describe("runTrialLoop", () => {
  it("runs stimulus, end, blank, next trial, then done", () => {
    const calls: string[] = [];
    runTrialLoop({
      trials: 2,
      stimulusMs: 100,
      blankMs: 30,
      onStimulus: (i) => calls.push(`stim${i}`),
      onStimulusEnd: (i) => calls.push(`end${i}`),
      onDone: () => calls.push("done"),
    });
    expect(calls).toEqual(["stim0"]);
    vi.advanceTimersByTime(100);
    expect(calls).toEqual(["stim0", "end0"]);
    vi.advanceTimersByTime(30);
    expect(calls).toEqual(["stim0", "end0", "stim1"]);
    vi.advanceTimersByTime(130);
    expect(calls).toEqual(["stim0", "end0", "stim1", "end1", "done"]);
  });

  it("cancel stops mid-run", () => {
    const calls: string[] = [];
    const handle = runTrialLoop({
      trials: 3,
      stimulusMs: 100,
      onStimulus: (i) => calls.push(`stim${i}`),
      onStimulusEnd: (i) => calls.push(`end${i}`),
      onDone: () => calls.push("done"),
    });
    vi.advanceTimersByTime(100);
    handle.cancel();
    vi.advanceTimersByTime(1000);
    expect(calls).toEqual(["stim0", "end0", "stim1"]);
  });
});

describe("runCountdown", () => {
  it("ticks down each second and finishes at zero", () => {
    const ticks: number[] = [];
    let done = false;
    runCountdown(
      3,
      (r) => ticks.push(r),
      () => {
        done = true;
      },
    );
    vi.advanceTimersByTime(3000);
    expect(ticks).toEqual([2, 1, 0]);
    expect(done).toBe(true);
    // no further ticks after completion
    vi.advanceTimersByTime(3000);
    expect(ticks).toEqual([2, 1, 0]);
  });

  it("cancel stops the countdown", () => {
    const ticks: number[] = [];
    const handle = runCountdown(
      5,
      (r) => ticks.push(r),
      () => ticks.push(-1),
    );
    vi.advanceTimersByTime(2000);
    handle.cancel();
    vi.advanceTimersByTime(5000);
    expect(ticks).toEqual([4, 3]);
  });
});
