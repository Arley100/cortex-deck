import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { createRng, randInt, type Rng } from "../../engine/rng";
import { createTimeline, type Timeline } from "../../engine/timeline";
import { useRunHandle } from "../../engine/useRunHandle";
import type { RunMeta, TrialEvent } from "../../engine/types";
import { scoreSequence, type SequenceConfig } from "./score";

const PADS = [
  { lit: "var(--color-cyan)", dim: "#123842" },
  { lit: "var(--color-violet)", dim: "#2a2247" },
  { lit: "var(--color-green)", dim: "#14372a" },
  { lit: "var(--color-amber)", dim: "#3c2f14" },
] as const;

interface Props {
  config: SequenceConfig;
  onComplete: (events: TrialEvent[], meta: RunMeta) => void;
  onExit: () => void;
}

type Phase = "intro" | "show" | "input" | "done";

export function SequenceDrill({ config, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [lit, setLit] = useState<number | null>(null);
  const [length, setLength] = useState(0);
  const [finalSpan, setFinalSpan] = useState(0);
  const setHandle = useRunHandle();

  const tlRef = useRef<Timeline | null>(null);
  const rngRef = useRef<Rng>(createRng(0));
  const seqRef = useRef<number[]>([]);
  const posRef = useRef(0);
  const acceptingRef = useRef(false);
  const eventsRef = useRef<TrialEvent[]>([]);

  const playback = (seq: number[]) => {
    const tl = tlRef.current as Timeline;
    setPhase("show");
    setLength(seq.length);
    acceptingRef.current = false;
    const step = (i: number) => {
      if (i >= seq.length) {
        setLit(null);
        posRef.current = 0;
        acceptingRef.current = true;
        setPhase("input");
        return;
      }
      setLit(seq[i] as number);
      tl.after(config.litMs, () => {
        setLit(null);
        tl.after(config.gapMs, () => step(i + 1));
      });
    };
    tl.after(config.startDelayMs, () => step(0));
  };

  const start = () => {
    const tl = createTimeline();
    tlRef.current = tl;
    setHandle(tl);
    rngRef.current = createRng(config.seed ?? Date.now());
    eventsRef.current = [];
    const seq = [randInt(rngRef.current, config.pads)];
    seqRef.current = seq;
    playback(seq);
  };

  const grow = () => {
    const seq = [...seqRef.current, randInt(rngRef.current, config.pads)];
    seqRef.current = seq;
    playback(seq);
  };

  const finish = (span: number) => {
    const tl = tlRef.current as Timeline;
    setFinalSpan(span);
    tl.after(300, () => {
      setPhase("done");
      onComplete(eventsRef.current, {});
    });
  };

  const tap = (i: number) => {
    if (!acceptingRef.current) return;
    const tl = tlRef.current as Timeline;
    const seq = seqRef.current;
    setLit(i);
    tl.after(config.tapLitMs, () => setLit(null));
    if (seq[posRef.current] === i) {
      posRef.current++;
      if (posRef.current === seq.length) {
        acceptingRef.current = false;
        eventsRef.current.push({
          trial: seq.length - 1,
          kind: "target",
          response: "correct",
          detail: { length: seq.length },
        });
        tl.after(config.growDelayMs, grow);
      }
    } else {
      acceptingRef.current = false;
      eventsRef.current.push({
        trial: seq.length - 1,
        kind: "target",
        response: "wrong",
        detail: { length: seq.length, position: posRef.current },
      });
      finish(seq.length - 1);
    }
  };

  const score = phase === "done" ? scoreSequence(eventsRef.current) : null;

  return (
    <GameShell title="SEQUENCE" sub="memory span" accent="green" onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            Watch the pads flash, then repeat the pattern. Each round adds one step. One
            wrong tap ends the run.
          </p>
          <Btn onClick={start} big accent="green">
            START
          </Btn>
        </div>
      )}
      {(phase === "show" || phase === "input") && (
        <div className="flex flex-col items-center gap-6">
          <div className="font-mono text-xs tracking-widest text-muted">
            LENGTH {length} · {phase === "show" ? "WATCH" : "YOUR TURN"}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PADS.map((p, i) => (
              <button
                key={i}
                type="button"
                aria-label={`pad ${i + 1}`}
                onClick={() => tap(i)}
                className="h-24 w-24 rounded-2xl border transition-all duration-100"
                style={{
                  background: lit === i ? p.lit : p.dim,
                  borderColor: lit === i ? p.lit : "var(--color-edge)",
                  boxShadow: lit === i ? `0 0 26px ${p.lit}` : "none",
                }}
              />
            ))}
          </div>
        </div>
      )}
      {phase === "done" && score && (
        <Results
          accent="green"
          headline={finalSpan}
          tag="longest chain"
          onAgain={start}
          onExit={onExit}
        >
          <StatLine label="SPAN" value={score.breakdown.span ?? 0} accent="green" />
          <p className="pt-2 text-xs leading-relaxed text-muted">
            {finalSpan <= 4
              ? "Typical span is around 5 to 9 items. Keep going."
              : finalSpan <= 7
                ? "Right in the classic 'magical number seven' band."
                : "Long chain. Strong chunking."}
          </p>
        </Results>
      )}
    </GameShell>
  );
}
