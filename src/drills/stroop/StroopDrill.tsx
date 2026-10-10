import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { DrillIntro } from "../../components/DrillIntro";
import { TimeBar } from "../../components/TrialMeter";
import { sound } from "../../audio/engine";
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
    sound.play(correct ? "good" : "bad");
    triggerFlash(correct ? "ok" : "no");
    next();
  };

  const correctCount = eventsRef.current.filter((e) => e.response === "correct").length;
  const score = phase === "done" ? createScoreStroop(config.seconds)(events) : null;

  return (
    <GameShell title="STROOP" sub="attention · inhibition" accent="violet" onExit={onExit}>
      {phase === "intro" && (
        <DrillIntro
          accent="violet"
          glyph="▲"
          specs={[`${config.seconds} seconds`, "4 inks", `${Math.round(config.incongruentRate * 100)}% incongruent`]}
          actions={
            <Btn onClick={start} big solid accent="violet">
              START
            </Btn>
          }
        >
          Tap the button matching the <b className="text-violet">ink color</b>, not the
          word. {config.seconds} seconds. The urge to read the word is the enemy.
        </DrillIntro>
      )}
      {phase === "run" && trial && (
        <div className="flex w-full flex-col items-center gap-6">
          <TimeBar left={timeLeft} total={config.seconds} color="var(--color-violet)" />
          <div className="w-full text-left font-mono text-[10px] tracking-[0.25em] text-muted">
            <span className="tabular-nums text-fg">{correctCount}</span> CORRECT
          </div>
          <div
            className="glass hud-corners scanlines flex h-40 w-full items-center justify-center rounded-2xl transition-colors duration-100"
            style={{
              ["--c" as string]:
                flash === "ok"
                  ? "var(--color-green)"
                  : flash === "no"
                    ? "var(--color-rose)"
                    : "var(--color-violet)",
              borderColor:
                flash === "ok"
                  ? "var(--color-green)"
                  : flash === "no"
                    ? "var(--color-rose)"
                    : undefined,
            }}
          >
            <span
              className="text-6xl font-bold tracking-tight"
              style={{
                color: trial.inkCss,
                textShadow: `0 0 28px color-mix(in srgb, ${trial.inkCss} 55%, transparent)`,
              }}
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
                className="hud-btn hud-btn-lg hud-btn-solid w-full"
                style={{ ["--c" as string]: c.css }}
              >
                <span aria-hidden="true" className="hud-btn-edge" />
                <span aria-hidden="true" className="hud-btn-fill" />
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
