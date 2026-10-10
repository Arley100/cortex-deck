import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { DrillIntro } from "../../components/DrillIntro";
import { sound } from "../../audio/engine";
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

/** quadrant shapes so the four pads read as one ring */
const PAD_SHAPE = [
  "rounded-tl-[100%] rounded-sm",
  "rounded-tr-[100%] rounded-sm",
  "rounded-bl-[100%] rounded-sm",
  "rounded-br-[100%] rounded-sm",
];
const PAD_LIGHT = ["70% 70%", "30% 70%", "70% 30%", "30% 30%"];

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
    sound.play(seq[posRef.current] === i ? "tap" : "bad");
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
        <DrillIntro
          accent="green"
          glyph="◆"
          specs={["4 pads", "+1 step per round", "one miss ends it"]}
          actions={
            <Btn onClick={start} big solid accent="green">
              START
            </Btn>
          }
        >
          Watch the pads flash, then repeat the pattern. Each round adds one step. One
          wrong tap ends the run.
        </DrillIntro>
      )}
      {(phase === "show" || phase === "input") && (
        <div className="flex flex-col items-center gap-6">
          <div className="relative grid h-[272px] w-[272px] grid-cols-2 gap-2.5 sm:h-[300px] sm:w-[300px]">
            {PADS.map((p, i) => (
              <button
                key={i}
                type="button"
                aria-label={`pad ${i + 1}`}
                onClick={() => tap(i)}
                className={`border transition-all duration-100 ${PAD_SHAPE[i]}`}
                style={{
                  background:
                    lit === i
                      ? `radial-gradient(circle at ${PAD_LIGHT[i]}, color-mix(in srgb, ${p.lit} 65%, white), ${p.lit} 70%)`
                      : `linear-gradient(180deg, ${p.dim}, color-mix(in srgb, ${p.dim} 70%, black))`,
                  borderColor: lit === i ? p.lit : `color-mix(in srgb, ${p.lit} 22%, transparent)`,
                  boxShadow: lit === i ? `0 0 34px ${p.lit}, 0 0 80px -12px ${p.lit}` : "none",
                }}
              />
            ))}
            <div
              className="glass pointer-events-none absolute top-1/2 left-1/2 flex h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full"
              aria-live="polite"
            >
              <span className="font-mono text-3xl font-bold tabular-nums text-fg">{length}</span>
              <span
                className="font-mono text-[9px] tracking-[0.25em]"
                style={{ color: phase === "show" ? "var(--color-muted)" : "var(--color-green)" }}
              >
                {phase === "show" ? "WATCH" : "YOUR TURN"}
              </span>
            </div>
          </div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted">LENGTH {length}</div>
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
