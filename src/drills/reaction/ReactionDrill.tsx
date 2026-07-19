import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { createRng, randIntIn, type Rng } from "../../engine/rng";
import { createTimeline, type Timeline } from "../../engine/timeline";
import { useRunHandle } from "../../engine/useRunHandle";
import type { RunMeta, TrialEvent } from "../../engine/types";
import { scoreReaction, type ReactionConfig } from "./score";

interface Props {
  config: ReactionConfig;
  onComplete: (events: TrialEvent[], meta: RunMeta) => void;
  onExit: () => void;
}

type Phase = "intro" | "wait" | "go" | "early" | "done";

export function ReactionDrill({ config, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [times, setTimes] = useState<number[]>([]);
  const setHandle = useRunHandle();

  const tlRef = useRef<Timeline | null>(null);
  const rngRef = useRef<Rng>(createRng(0));
  const eventsRef = useRef<TrialEvent[]>([]);
  const trialRef = useRef(0);
  const goAtRef = useRef(0);
  const phaseRef = useRef<Phase>("intro");

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const scheduleTrial = () => {
    // fresh timeline per wait so an early tap can void the pending "go"
    const tl = createTimeline();
    tlRef.current = tl;
    setHandle(tl);
    setPhaseBoth("wait");
    const delay = randIntIn(rngRef.current, config.minDelayMs, config.maxDelayMs);
    tl.after(delay, () => {
      goAtRef.current = performance.now();
      setPhaseBoth("go");
    });
  };

  const start = () => {
    rngRef.current = createRng(config.seed ?? Date.now());
    eventsRef.current = [];
    trialRef.current = 0;
    setTimes([]);
    scheduleTrial();
  };

  const handleTap = () => {
    const p = phaseRef.current;
    if (p === "wait") {
      tlRef.current?.cancel();
      eventsRef.current.push({
        trial: trialRef.current,
        kind: "nontarget",
        response: "falseAlarm",
        detail: { early: true },
      });
      setPhaseBoth("early");
      return;
    }
    if (p === "early") {
      scheduleTrial();
      return;
    }
    if (p === "go") {
      const rt = Math.round(performance.now() - goAtRef.current);
      eventsRef.current.push({
        trial: trialRef.current,
        kind: "target",
        response: "hit",
        rt,
      });
      trialRef.current++;
      setTimes((t) => [...t, rt]);
      if (trialRef.current >= config.trials) {
        setPhaseBoth("done");
        onComplete(eventsRef.current, {});
      } else {
        scheduleTrial();
      }
    }
  };

  const score = phase === "done" ? scoreReaction(eventsRef.current) : null;
  const panelBg =
    phase === "go"
      ? "var(--color-green)"
      : phase === "early"
        ? "var(--color-rose)"
        : "var(--color-panel-hi)";

  return (
    <GameShell title="REACTION" sub="response time" accent="rose" onExit={onExit}>
      {phase === "intro" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-sm leading-relaxed text-muted">
            The panel is dark, then turns <b className="text-green">green</b>. Tap the
            instant it does. {config.trials} trials, we keep your fastest. Don't jump
            early.
          </p>
          <Btn onClick={start} big accent="rose">
            START
          </Btn>
        </div>
      )}
      {(phase === "wait" || phase === "go" || phase === "early") && (
        <div className="flex w-full flex-col items-center gap-5">
          <div className="font-mono text-xs tracking-widest text-muted">
            TRIAL {Math.min(trialRef.current + 1, config.trials)} / {config.trials}
          </div>
          <button
            type="button"
            onClick={handleTap}
            className="flex h-64 w-full items-center justify-center rounded-2xl border border-edge transition-colors"
            style={{ background: panelBg }}
          >
            <span
              className="font-mono text-xl font-extrabold"
              style={{ color: phase === "go" ? "var(--color-bg)" : "var(--color-fg)" }}
            >
              {phase === "wait" && "wait…"}
              {phase === "go" && "TAP"}
              {phase === "early" && "too soon: tap to retry"}
            </span>
          </button>
          {times.length > 0 && (
            <div className="font-mono text-sm text-muted">
              last: {times[times.length - 1]} ms
            </div>
          )}
        </div>
      )}
      {phase === "done" && score && (
        <Results
          accent="rose"
          headline={score.primary}
          tag="fastest (ms)"
          onAgain={start}
          onExit={onExit}
        >
          <StatLine label="FASTEST" value={`${score.breakdown.fastest ?? 0} ms`} accent="green" />
          <StatLine label="AVERAGE" value={`${score.breakdown.average ?? 0} ms`} />
          <StatLine label="EARLY TAPS" value={score.breakdown.earlyTaps ?? 0} accent="rose" />
        </Results>
      )}
    </GameShell>
  );
}
