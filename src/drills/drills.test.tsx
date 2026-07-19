import { afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NBackDrill } from "./nback/NBackDrill";
import { NBACK_DEFAULTS } from "./nback";
import { StroopDrill } from "./stroop/StroopDrill";
import { STROOP_DEFAULTS } from "./stroop";
import { GoNoGoDrill } from "./gonogo/GoNoGoDrill";
import { GONOGO_DEFAULTS } from "./gonogo";
import { DRILLS } from "./registry";

afterEach(() => {
  vi.useRealTimers();
});

describe("registry", () => {
  it("exposes all six drills with unique ids and score functions", () => {
    const ids = DRILLS.map((d) => d.definition.id);
    expect(ids).toEqual([
      "nback",
      "stroop",
      "sequence",
      "mathsprint",
      "reaction",
      "gonogo",
    ]);
    for (const d of DRILLS) {
      expect(typeof d.definition.run).toBe("function");
      expect(typeof d.definition.score).toBe("function");
    }
  });
});

describe("NBackDrill", () => {
  it("shows both variants on the intro screen", () => {
    render(
      <NBackDrill config={NBACK_DEFAULTS} onComplete={() => {}} onExit={() => {}} />,
    );
    expect(screen.getByText("2-BACK")).toBeInTheDocument();
    expect(screen.getByText("3-BACK")).toBeInTheDocument();
  });
});

describe("StroopDrill", () => {
  it("runs a shortened drill to completion and reports honest counts", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    render(
      <StroopDrill
        config={{ ...STROOP_DEFAULTS, seconds: 2, seed: 7 }}
        onComplete={onComplete}
        onExit={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("START"));
    // answer one trial (any button; correctness depends on the seeded trial)
    fireEvent.click(screen.getByRole("button", { name: "RED" }));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    const events = onComplete.mock.calls[0]?.[0];
    expect(events).toHaveLength(1);
    expect(["correct", "wrong"]).toContain(events[0].response);
  });
});

describe("GoNoGoDrill", () => {
  it("completes a short run with one event per trial", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const config = { ...GONOGO_DEFAULTS, trials: 4, seed: 3 };
    render(<GoNoGoDrill config={config} onComplete={onComplete} onExit={() => {}} />);
    fireEvent.click(screen.getByText("START"));
    act(() => {
      vi.advanceTimersByTime(4 * (config.windowMs + config.blankMs) + 50);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    const events = onComplete.mock.calls[0]?.[0];
    expect(events).toHaveLength(4);
    // with no taps, every go is an omission and every nogo a correct stop
    for (const e of events) {
      expect(["miss", "correctReject"]).toContain(e.response);
    }
  });
});
