import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { createRng, randInt } from "../../engine/rng";
import { runTrialLoop } from "../../engine/scheduler";
import { useRunHandle } from "../../engine/useRunHandle";
import type { RunMeta, TrialEvent } from "../../engine/types";
import { scoreNBack } from "./score";
import type { NBackConfig } from "./score";

interface Props {
  config: NBackConfig;
  onComplete: (events: TrialEvent[], meta: RunMeta) => void;
  onExit: () => void;
}

type Phase = "intro" | "run" | "done";
type Flash = "hit" | "fa" | "miss" | null;

export function NBackDrill({ config, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [n, setN] = useState(2);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [flash, setFlash] = useState<Flash>(null);
  const [trialNo, setTrialNo] = useState(0);
  const [events, setEvents] = useState<TrialEvent[]>([]);
  const setHandle = useRunHandle();

  const seqRef = useRef<number[]>([]);
  const eventsRef = useRef<TrialEvent[]>([]);
  const respondedRef = useRef(false);
  const shownAtRef = useRef(0);

  const isMatch = (i: number, nn: number) => {
    const seq = seqRef.current;
    return i >= nn && seq[i] === seq[i - nn];
  };

  const start = (nn: number) => {
    const rng = createRng(config.seed ?? Date.now());
    const seq: number[] = [];
    for (let i = 0; i < config.trials; i++) {
      if (i >= nn && rng() < config.matchRate) seq.push(seq[i - nn] as number);
      else seq.push(randInt(rng, 9));
    }
    seqRef.current = seq;
    eventsRef.current = [];
    setN(nn);
    setPhase("run");
    setFlash(null);
    setHandle(
      runTrialLoop({
        trials: config.trials,
        stimulusMs: config.isiMs,
        blankMs: config.flashMs,
        onStimulus: (i) => {
          respondedRef.current = false;
          shownAtRef.current = performance.now();
          setTrialNo(i);
          setFlash(null);
          setActiveCell(seq[i] as number);
        },
        onStimulusEnd: (i) => {
          if (!respondedRef.current) {
            if (isMatch(i, nn)) {
              eventsRef.current.push({ trial: i, kind: "target", response: "miss" });
              setFlash("miss");
            } else {
              eventsRef.current.push({
                trial: i,
                kind: "nontarget",
                response: "correctReject",
              });
            }
          }
          setActiveCell(null);
        },
        onDone: () => {
          const done = eventsRef.current;
          setEvents(done);
          setPhase("done");
          onComplete(done, { variant: `${nn}-back` });
        },
      }),
    );
  };

  const callMatch = () => {
    if (phase !== "run" || respondedRef.current || activeCell === null) return;
    respondedRef.current = true;
    const i = trialNo;
    const rt = performance.now() - shownAtRef.current;
    if (isMatch(i, n)) {
      eventsRef.current.push({ trial: i, kind: "target", response: "hit", rt });
      setFlash("hit");
    } else {
      eventsRef.current.push({ trial: i, kind: "nontarget", response: "falseAlarm", rt });
      setFlash("fa");
    }
  };

  const score = phase === "done" ? scoreNBack(events) : null;
  const glow =
    flash === "hit"
      ? "var(--color-green)"
      : flash === "fa"
        ? "var(--color-rose)"
        : "var(--color-cyan)";

  return (
    <GameShell title="N-BACK" sub={`working memory · ${n}-back`} accent="cyan" onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            A cell lights up every couple of seconds. Tap{" "}
            <b className="text-cyan">MATCH</b> when the lit cell equals the one from{" "}
            <b className="text-cyan">N steps back</b>. 3-back is a real step up.
          </p>
          <div className="flex gap-3">
            <Btn onClick={() => start(2)} big accent="cyan">
              2-BACK
            </Btn>
            <Btn onClick={() => start(3)} big accent="violet">
              3-BACK
            </Btn>
          </div>
        </div>
      )}
      {phase === "run" && (
        <div className="flex flex-col items-center gap-6">
          <div className="font-mono text-xs tracking-widest text-muted">
            {trialNo + 1} / {config.trials}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => {
              const on = activeCell === i;
              return (
                <div
                  key={i}
                  data-testid={`cell-${i}`}
                  className="h-[74px] w-[74px] rounded-xl border transition-all duration-150"
                  style={{
                    background: on ? glow : "var(--color-panel-hi)",
                    borderColor: on ? glow : "var(--color-edge)",
                    boxShadow: on ? `0 0 22px ${glow}` : "none",
                  }}
                />
              );
            })}
          </div>
          <div className="h-5 font-mono text-sm font-semibold">
            {flash === "miss" && <span className="text-rose">missed a match</span>}
            {flash === "hit" && <span className="text-green">match</span>}
            {flash === "fa" && <span className="text-rose">not a match</span>}
          </div>
          <Btn onClick={callMatch} big accent="cyan" style={{ minWidth: 200 }}>
            MATCH
          </Btn>
        </div>
      )}
      {phase === "done" && score && (
        <Results
          accent="cyan"
          headline={`${score.primary}%`}
          tag={`${n}-back accuracy`}
          onAgain={() => start(n)}
          onExit={onExit}
        >
          <StatLine label="HITS" value={score.breakdown.hits ?? 0} accent="green" />
          <StatLine label="MISSED MATCHES" value={score.breakdown.missedMatches ?? 0} accent="rose" />
          <StatLine label="FALSE ALARMS" value={score.breakdown.falseAlarms ?? 0} accent="rose" />
          <StatLine label="CORRECT PASSES" value={score.breakdown.correctPasses ?? 0} />
          <StatLine label="D-PRIME" value={(score.dPrime ?? 0).toFixed(2)} accent="cyan" />
        </Results>
      )}
    </GameShell>
  );
}
