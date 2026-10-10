import { describe, expect, it } from "vitest";
import { homeGreeting, reactionFor, type HomeRow } from "./mood";

const EM_DASH = String.fromCharCode(0x2014);
const BANNED = new RegExp(
  `diagnos|brain damage|\\bIQ\\b|brain age|scientifically proven|failing|impaired|${EM_DASH}`,
  "i",
);

describe("reactionFor", () => {
  it("claps only for runs that beat the baseline", () => {
    expect(reactionFor({ kind: "personalBest", baseline: 70, previousBest: 80 }, "%").mood).toBe(
      "celebrate",
    );
    expect(reactionFor({ kind: "above", baseline: 70 }, "%").mood).toBe("clap");
    expect(reactionFor({ kind: "at", baseline: 70 }, "%").mood).toBe("nod");
    expect(reactionFor({ kind: "below", baseline: 70 }, "%").mood).toBe("encourage");
    expect(reactionFor({ kind: "calibrating", runs: 1, needed: 3 }, "%").mood).toBe("wave");
  });

  it("states the comparison with units", () => {
    expect(reactionFor({ kind: "below", baseline: 312.5 }, "ms").line).toBe(
      "Below your baseline of 312.5 ms today. Another rep?",
    );
    expect(reactionFor({ kind: "personalBest", baseline: 20, previousBest: 24 }, "count").line).toBe(
      "New personal best. Your previous best was 24.",
    );
    expect(reactionFor({ kind: "calibrating", runs: 3, needed: 3 }, "%").line).toMatch(
      /baseline is set/,
    );
  });

  it("syncs one clap sound per animated clap", () => {
    const clap = reactionFor({ kind: "above", baseline: 1 }, "count");
    expect(clap.sounds.filter((s) => s.name === "clap")).toHaveLength(3);
    const best = reactionFor({ kind: "personalBest", baseline: 1, previousBest: 2 }, "count");
    expect(best.sounds.filter((s) => s.name === "clap")).toHaveLength(4);
  });

  it("never uses banned framing", () => {
    const verdicts = [
      { kind: "personalBest", baseline: 1, previousBest: 2 },
      { kind: "above", baseline: 1 },
      { kind: "at", baseline: 1 },
      { kind: "below", baseline: 1 },
      { kind: "calibrating", runs: 1, needed: 3 },
      { kind: "calibrating", runs: 3, needed: 3 },
    ] as const;
    for (const v of verdicts) expect(reactionFor(v, "%").line).not.toMatch(BANNED);
  });
});

describe("homeGreeting", () => {
  const ready = (name: string, today: "above" | "at" | "below" | null): HomeRow => ({
    name,
    status: { kind: "ready", today },
  });
  const cal = (name: string, runs: number): HomeRow => ({
    name,
    status: { kind: "calibrating", runs, needed: 3 },
  });

  it("prescribes reps for drills below baseline first", () => {
    const g = homeGreeting([ready("Stroop", "below"), ready("Reaction", "below"), cal("N-Back", 1)]);
    expect(g.mood).toBe("encourage");
    expect(g.line).toBe(
      "Stroop and Reaction are below your baseline today. A few targeted reps there?",
    );
    expect(homeGreeting([ready("Stroop", "below")]).line).toMatch(/^Stroop is below/);
  });

  it("introduces itself on a fresh install", () => {
    const g = homeGreeting([cal("A", 0), cal("B", 0)]);
    expect(g.mood).toBe("wave");
    expect(g.line).toMatch(/^Hi, I am Pip/);
  });

  it("counts drills still calibrating", () => {
    expect(homeGreeting([cal("A", 2), ready("B", null)]).line).toBe(
      "1 of 2 drills still calibrating. Three runs each sets the baseline.",
    );
  });

  it("is neutral when nothing has run today and approving only when earned", () => {
    expect(homeGreeting([ready("A", null)]).mood).toBe("idle");
    expect(homeGreeting([ready("A", "at"), ready("B", null)]).mood).toBe("nod");
  });

  it("never uses banned framing", () => {
    const cases: HomeRow[][] = [
      [ready("A", "below")],
      [cal("A", 0)],
      [cal("A", 1)],
      [ready("A", null)],
      [ready("A", "above")],
    ];
    for (const c of cases) expect(homeGreeting(c).line).not.toMatch(BANNED);
  });
});
