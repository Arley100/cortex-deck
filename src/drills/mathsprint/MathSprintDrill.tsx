import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { useFlash } from "../../components/useFlash";
import { createRng, randInt, randIntIn, shuffle, type Rng } from "../../engine/rng";
import { runCountdown } from "../../engine/scheduler";
import { useRunHandle } from "../../engine/useRunHandle";
import type { RunMeta, TrialEvent } from "../../engine/types";
import { scoreMathSprint, type MathSprintConfig } from "./score";

interface Props {
  config: MathSprintConfig;
  onComplete: (events: TrialEvent[], meta: RunMeta) => void;
  onExit: () => void;
}

type Phase = "intro" | "run" | "done";

interface Question {
  a: number;
  b: number;
  op: "+" | "-" | "×";
  answer: number;
  choices: number[];
}

export function makeQuestion(rng: Rng, config: MathSprintConfig): Question {
  const op = (["+", "-", "×"] as const)[randInt(rng, 3)] as "+" | "-" | "×";
  let a: number, b: number, answer: number;
  if (op === "+") {
    a = randIntIn(rng, 5, 49);
    b = randIntIn(rng, 5, 49);
    answer = a + b;
  } else if (op === "-") {
    a = randIntIn(rng, 20, 79);
    b = randIntIn(rng, 5, a - 5 >= 5 ? a - 5 : 5);
    answer = a - b;
  } else {
    a = randIntIn(rng, 3, 12);
    b = randIntIn(rng, 3, 12);
    answer = a * b;
  }
  const opts = new Set<number>([answer]);
  while (opts.size < config.choices) {
    const d = answer + randIntIn(rng, -config.distractorSpread, config.distractorSpread);
    if (d >= 0) opts.add(d);
  }
  return { a, b, op, answer, choices: shuffle(rng, [...opts]) };
}

export function MathSprintDrill({ config, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [question, setQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(config.seconds);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [flash, triggerFlash] = useFlash<"ok" | "no">(130);
  const [events, setEvents] = useState<TrialEvent[]>([]);
  const setHandle = useRunHandle();

  const rngRef = useRef<Rng>(createRng(0));
  const eventsRef = useRef<TrialEvent[]>([]);
  const questionRef = useRef<Question | null>(null);
  const trialNoRef = useRef(0);
  const shownAtRef = useRef(0);
  const streakRef = useRef(0);

  const next = () => {
    const q = makeQuestion(rngRef.current, config);
    questionRef.current = q;
    shownAtRef.current = performance.now();
    setQuestion(q);
  };

  const start = () => {
    rngRef.current = createRng(config.seed ?? Date.now());
    eventsRef.current = [];
    trialNoRef.current = 0;
    streakRef.current = 0;
    setStreak(0);
    setCorrectCount(0);
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

  const answer = (value: number) => {
    const q = questionRef.current;
    if (phase !== "run" || !q) return;
    const correct = value === q.answer;
    eventsRef.current.push({
      trial: trialNoRef.current++,
      kind: "target",
      response: correct ? "correct" : "wrong",
      rt: performance.now() - shownAtRef.current,
      detail: { a: q.a, b: q.b, op: q.op },
    });
    if (correct) {
      streakRef.current++;
      setCorrectCount((c) => c + 1);
    } else {
      streakRef.current = 0;
    }
    setStreak(streakRef.current);
    triggerFlash(correct ? "ok" : "no");
    next();
  };

  const score = phase === "done" ? scoreMathSprint(events) : null;

  return (
    <GameShell title="MATH SPRINT" sub="processing speed" accent="amber" onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            As many as you can in {config.seconds} seconds. Four choices, one right. Chain
            correct answers for a streak.
          </p>
          <Btn onClick={start} big accent="amber">
            START
          </Btn>
        </div>
      )}
      {phase === "run" && question && (
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between font-mono">
            <span
              className="text-xs tracking-widest"
              style={{ color: streak > 1 ? "var(--color-amber)" : "var(--color-muted)" }}
            >
              {streak > 1 ? `🔥 ${streak} streak` : `${correctCount} solved`}
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: timeLeft <= 10 ? "var(--color-rose)" : "var(--color-fg)" }}
            >
              {timeLeft}s
            </span>
          </div>
          <div
            className="flex h-28 w-full items-center justify-center rounded-2xl border bg-panel-hi transition-colors duration-100"
            style={{
              borderColor:
                flash === "ok"
                  ? "var(--color-green)"
                  : flash === "no"
                    ? "var(--color-rose)"
                    : "var(--color-edge)",
            }}
          >
            <span className="font-mono text-4xl font-extrabold">
              {question.a} {question.op} {question.b}
            </span>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {question.choices.map((c, i) => (
              <button
                key={`${trialNoRef.current}-${i}`}
                type="button"
                onClick={() => answer(c)}
                className="rounded-xl border border-edge bg-panel-hi py-5 font-mono text-2xl font-bold transition active:scale-95"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      {phase === "done" && score && (
        <Results
          accent="amber"
          headline={score.primary}
          tag={`solved in ${config.seconds}s`}
          onAgain={start}
          onExit={onExit}
        >
          <StatLine label="ACCURACY" value={`${score.breakdown.accuracy ?? 0}%`} accent="amber" />
          <StatLine label="CORRECT" value={score.breakdown.correct ?? 0} accent="green" />
          <StatLine label="WRONG" value={score.breakdown.wrong ?? 0} accent="rose" />
          <StatLine label="BEST STREAK" value={score.breakdown.bestStreak ?? 0} />
        </Results>
      )}
    </GameShell>
  );
}
