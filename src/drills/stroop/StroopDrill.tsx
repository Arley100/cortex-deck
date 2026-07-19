import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { createRng, randInt, type Rng } from "../../engine/rng";
import { runCountdown } from "../../engine/scheduler";
import { useRunHandle } from "../../engine/useRunHandle";
import type { RunMeta, TrialEvent } from "../../engine/types";
import { useFlash } from "../../components/useFlash";
import { createScoreStroop, type StroopConfig } from "./score";

const INKS = [
  { name: "RED", css: "var(--color-rose)" },
  { name: "GREEN", css: "var(--color-green)" },
  { name: "BLUE", css: "var(--color-blue)" },
  { name: "AMBER", css: "var(--color-amber)" },
] as const;

interface Props {
  config: StroopConfig;
  onComplete: (events: TrialEvent[], meta: RunMeta) => void;
  onExit: () => void;
}

type Phase = "intro" | "run" | "done";

interface Trial {
  word: string;
  inkName: string;
  inkCss: string;
}

export function StroopDrill({ config, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [trial, setTrial] = useState<Trial | null>(null);
  const [timeLeft, setTimeLeft] = useState(config.seconds);
  const [flash, triggerFlash] = useFlash<"ok" | "no">(150);
  const [events, setEvents] = useState<TrialEvent[]>([]);
  const setHandle = useRunHandle();

  const rngRef = useRef<Rng>(createRng(0));
  const eventsRef = useRef<TrialEvent[]>([]);
  const trialRef = useRef<Trial | null>(null);
  const trialNoRef = useRef(0);
  const shownAtRef = useRef(0);

  const next = () => {
    const rng = rngRef.current;
    const word = INKS[randInt(rng, 4)] as (typeof INKS)[number];
    let ink = INKS[randInt(rng, 4)] as (typeof INKS)[number];
    if (rng() < config.incongruentRate) {
      while (ink.name === word.name) ink = INKS[randInt(rng, 4)] as (typeof INKS)[number];
    }
    const t = { word: word.name, inkName: ink.name, inkCss: ink.css };
    trialRef.current = t;
    shownAtRef.current = performance.now();
    setTrial(t);
  };

  const start = () => {
    rngRef.current = createRng(config.seed ?? Date.now());
    eventsRef.current = [];
    trialNoRef.current = 0;
    setTimeLeft(config.seconds);
    setPhase("run");
    setHandle(
      runCountdown(
        config.seconds,
        (remaining) => setTimeLeft(remaining),
        () => {
          const done = eventsRef.current;
          setEvents(done);
          setPhase("done");
          onComplete(done, {});
        },
      ),
    );
    next();
  };

  const answer = (pickedName: string) => {
    const t = trialRef.current;
    if (phase !== "run" || !t) return;
    const correct = pickedName === t.inkName;
    eventsRef.current.push({
      trial: trialNoRef.current++,
      kind: "target",
      response: correct ? "correct" : "wrong",
      rt: performance.now() - shownAtRef.current,
      detail: { word: t.word, ink: t.inkName, congruent: t.word === t.inkName },
    });
    triggerFlash(correct ? "ok" : "no");
    next();
  };

  const correctCount = eventsRef.current.filter((e) => e.response === "correct").length;
  const score = phase === "done" ? createScoreStroop(config.seconds)(events) : null;

  return (
    <GameShell title="STROOP" sub="attention · inhibition" accent="violet" onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            Tap the button matching the <b className="text-violet">ink color</b>, not the
            word. {config.seconds} seconds. The urge to read the word is the enemy.
          </p>
          <Btn onClick={start} big accent="violet">
            START
          </Btn>
        </div>
      )}
      {phase === "run" && trial && (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between font-mono">
            <span className="text-xs tracking-widest text-muted">{correctCount} correct</span>
            <span
              className="text-sm font-bold"
              style={{ color: timeLeft <= 10 ? "var(--color-rose)" : "var(--color-fg)" }}
            >
              {timeLeft}s
            </span>
          </div>
          <div
            className="flex h-32 w-full items-center justify-center rounded-2xl border bg-panel-hi transition-colors duration-100"
            style={{
              borderColor:
                flash === "ok"
                  ? "var(--color-green)"
                  : flash === "no"
                    ? "var(--color-rose)"
                    : "var(--color-edge)",
            }}
          >
            <span
              className="text-5xl font-extrabold tracking-tight"
              style={{ color: trial.inkCss }}
            >
              {trial.word}
            </span>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {INKS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => answer(c.name)}
                className="rounded-xl py-4 font-mono font-bold text-bg transition active:scale-95"
                style={{ background: c.css }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && score && (
        <Results
          accent="violet"
          headline={score.primary}
          tag="correct answers"
          onAgain={start}
          onExit={onExit}
        >
          <StatLine label="ACCURACY" value={`${score.breakdown.accuracy ?? 0}%`} accent="violet" />
          <StatLine label="CORRECT" value={score.breakdown.correct ?? 0} accent="green" />
          <StatLine label="WRONG" value={score.breakdown.wrong ?? 0} accent="rose" />
          <StatLine label="PER MINUTE" value={score.breakdown.perMinute ?? 0} />
        </Results>
      )}
    </GameShell>
  );
}
