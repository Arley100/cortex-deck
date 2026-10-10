import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { DrillIntro } from "../../components/DrillIntro";
import { TrialMeter } from "../../components/TrialMeter";
import { sound } from "../../audio/engine";
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
      sound.play("bad");
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
      sound.play("tap");
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
  const panelColor =
    phase === "go" ? "var(--color-green)" : phase === "early" ? "var(--color-rose)" : null;

  return (
    <GameShell title="REACTION" sub="response time" accent="rose" onExit={onExit}>
      {phase === "intro" && (
        <DrillIntro
          accent="rose"
          glyph="⚡"
          specs={[`${config.trials} trials`, "random delay", "fastest counts"]}
          actions={
            <Btn onClick={start} big solid accent="rose">
              START
            </Btn>
          }
        >
          The panel is dark, then turns <b className="text-green">green</b>. Tap the
          instant it does. {config.trials} trials, we keep your fastest. Don't jump early.
        </DrillIntro>
      )}
      {(phase === "wait" || phase === "go" || phase === "early") && (
        <div className="flex w-full flex-col items-center gap-5">
          <TrialMeter
            current={Math.min(trialRef.current, config.trials - 1)}
            total={config.trials}
            color="var(--color-rose)"
          />
          {/* no motion while waiting: an animation could act as a timing cue */}
          <button
            type="button"
            onClick={handleTap}
            className={`relative flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border ${
              phase === "early" ? "shake" : ""
            } ${panelColor ? "" : "glass"}`}
            style={{
              background: panelColor
                ? `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${panelColor} 75%, white), ${panelColor} 70%)`
                : undefined,
              borderColor: panelColor ?? "var(--color-edge)",
              boxShadow: panelColor ? `0 0 50px -6px ${panelColor}` : undefined,
            }}
          >
            {phase === "wait" && (
              <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                {[200, 140, 80].map((d) => (
                  <span
                    key={d}
                    className="absolute rounded-full border border-dashed border-edge"
                    style={{ width: d, height: d }}
                  />
                ))}
              </span>
            )}
            <span
              className="relative font-mono text-xl font-extrabold tracking-[0.2em]"
              style={{ color: phase === "wait" ? "var(--color-muted)" : "var(--color-bg)" }}
            >
              {phase === "wait" && "WAIT…"}
              {phase === "go" && "TAP"}
              {phase === "early" && "TOO SOON: TAP TO RETRY"}
            </span>
          </button>
          <div className="h-5 font-mono text-xs tracking-[0.2em] text-muted">
            {times.length > 0 && (
              <>
                LAST <span className="tabular-nums text-fg">{times[times.length - 1]} ms</span>
              </>
            )}
          </div>
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
