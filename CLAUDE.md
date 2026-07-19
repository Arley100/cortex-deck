# CLAUDE.md — Cortex Deck

## What this project is

Cortex Deck is a local-first, browser-based focus-recovery console. The user arrives with a feed-fried brain (LinkedIn, reels, Discord) and unable to lock onto a task. The app gives them six short cognitive drills with honest scoring, tracks a personal baseline per faculty, shows which faculties are scoring below *their own* baseline today, and prescribes targeted reps.

A working prototype exists at `prototype/cognitive-console.jsx`. Match its game mechanics and feel exactly unless this spec says otherwise. Restructure the code properly; the prototype is a single-file proof of concept, not an architecture.

## Non-negotiable framing rules

These govern all UI copy, README text, and code comments:

1. Never claim the app diagnoses, detects deficits, or measures intelligence. It measures task performance relative to the user's own history. Banned words in user-facing copy: "diagnose", "brain damage", "IQ", "brain age", "scientifically proven to improve".
2. Scoring is honest: hits, misses, and false alarms are always reported separately. Never collapse them into a single flattering number. No score inflation, no fake praise.
3. The README must include a short "What this is not" section: not a medical device, not an IQ booster, trains the practiced task with limited transfer.
4. Below-baseline results are phrased neutrally: "below your baseline", never "failing" or "impaired".

## Stack

- Vite + React 18 + TypeScript, strict mode
- Tailwind CSS for styling (the prototype's inline-style palette becomes Tailwind theme tokens)
- Zustand for state
- Dexie (IndexedDB) for persistence; everything stays on-device, zero network calls, zero analytics
- Vitest + React Testing Library for tests
- Deployable as a static site to GitHub Pages; include the deploy workflow

## Writing conventions

- No em dashes anywhere: source comments, UI copy, README, commit messages. Use colons, semicolons, or sentence breaks.
- Repo references use github.com/Arley100/cortex-deck.
- README tone: direct, technically concrete, no marketing superlatives.

## Architecture

```
src/
  app/            shell, router (simple state-based routing is fine), theme
  drills/         one folder per drill, each exporting a DrillDefinition
    nback/
    stroop/
    sequence/
    mathsprint/
    reaction/
    gonogo/
  engine/         shared drill runtime: trial scheduler, timers, RNG (seedable)
  scoring/        pure functions: accuracy, d-prime, streaks; 100% unit-tested
  baseline/       rolling baseline computation and deviation flags
  storage/        Dexie schema, run repository, migrations
  components/     shared UI (GameShell, Results, StatLine, Btn, charts)
```

Key contract every drill implements:

```ts
interface DrillDefinition {
  id: DrillId;
  name: string;
  faculty: string;                    // e.g. "working memory"
  variants?: string[];                // e.g. ["2-back", "3-back"]
  run(ctx: DrillContext): void;       // mounts the drill UI
  score(events: TrialEvent[]): DrillScore;
}

interface DrillScore {
  primary: number;                    // the headline metric
  unit: "%" | "ms" | "count" | "span";
  higherIsBetter: boolean;
  breakdown: Record<string, number>;  // hits, misses, falseAlarms, etc.
  dPrime?: number;                    // for nback and gonogo
}
```

All timing uses performance.now(). The trial scheduler lives in `engine/` and is shared; drills declare trial sequences, they do not own setTimeout chains (the prototype does; fix that).

## The six drills

Port mechanics from the prototype. Parameters below are the source of truth.

1. **N-Back** (working memory). 3x3 grid, 24 trials, 2400 ms ISI, 32% forced match rate. Variants: 2-back and 3-back, selectable on the intro screen. Score: accuracy % plus d-prime. Report hits, missed matches, false alarms, correct passes.
2. **Stroop** (attention, inhibition). 45 s, four colors (RED, GREEN, BLUE, AMBER), 75% incongruent trials. Tap the ink color. Score: correct count; breakdown includes accuracy and answers per minute.
3. **Sequence** (memory span). Simon-style, 4 pads, sequence grows by 1 each round, 480 ms lit / 200 ms gap playback, one error ends the run. Score: longest chain (span).
4. **Math Sprint** (processing speed). 60 s, operations + − ×, four answer choices with distractors within ±6 of the answer, streak counter. Score: correct count; breakdown includes accuracy and best streak.
5. **Reaction** (response time). 5 trials, random 1400–4000 ms delay, panel turns green, early taps flagged and retried. Score: fastest ms (lower is better); breakdown includes average.
6. **Go/No-Go** (response inhibition). 28 trials, 68% go (green circle) / 32% no-go (red square), 850 ms response window, 320 ms blank. Score: accuracy % plus d-prime. Breakdown: hits, correct stops, commissions, omissions, mean go RT.

## Baseline engine (the core feature)

- Every completed run is persisted: { drillId, variant, timestamp, score, breakdown, sessionTag }.
- Baseline per drill+variant: rolling median of the last 10 runs, requiring a minimum of 3 runs before a baseline exists. Before that, UI shows "calibrating: N/3 runs".
- Deviation flag: today's run vs baseline. Thresholds: within ±10% of baseline = "at baseline"; more than 10% better = "above"; more than 10% worse = "below". For Reaction (lower is better) invert the comparison.
- Home screen shows per-drill status chips: calibrating / at / above / below baseline, using the run from the current day if one exists.
- A "Faculties" screen lists all six faculties with baseline value, today's value, and a small sparkline of the last 10 runs (render with a tiny inline SVG, no chart library).

## Pre/Post mode (the differentiator)

- A guided flow: "Before" battery, then the user goes and does whatever (scroll, meeting, deep work), then an "After" battery.
- Battery = shortened versions of three drills the user picks (default: Stroop 30 s, Reaction 3 trials, Go/No-Go 20 trials), total under 3 minutes.
- Both batteries are tagged with a shared sessionTag; the results screen shows a side-by-side delta per drill with neutral wording ("Stroop: 31 → 24 correct, −23%").
- Include a shareable summary card rendered as a PNG via canvas (all client-side) so a delta can be posted without screenshots of the whole app.

## Persistence and privacy

- Dexie schema v1: runs table, settings table. Write a migration scaffold even though v1 is the only version.
- Export/import: single JSON file download and restore. No accounts, no network.
- State survives reload; add a "wipe all data" action in settings with a confirm step.

## Quality bar

- `scoring/` and `baseline/` are pure and fully unit-tested, including d-prime edge cases (hit rate or FA rate of 0 or 1 must use the standard 1/(2N) correction, not produce Infinity).
- Timers must be cleaned up on unmount; the prototype leaks some, do not copy that.
- Mobile-first: layout is designed at 380 px width and must be fully usable by touch; test desktop as the secondary case.
- Lighthouse performance and accessibility above 90; all interactive elements reachable by keyboard.
- CI: GitHub Actions running typecheck, lint, and tests on push.

## Build order

1. Scaffold Vite + TS + Tailwind + Vitest, port the theme tokens from the prototype palette.
2. Engine + scoring + baseline modules with tests, before any UI.
3. Storage layer with Dexie.
4. Port drills one at a time against the DrillDefinition contract, verifying each against the prototype's behavior.
5. Home screen with status chips, then Faculties screen, then Pre/Post mode.
6. Export/import, settings, deploy workflow, README.

Commit after each numbered step with a conventional-commit message.

## Commands (fill in once scaffolded)

- dev: `npm run dev`
- test: `npm run test`
- typecheck: `npm run typecheck`
- lint: `npm run lint`
- build: `npm run build`
