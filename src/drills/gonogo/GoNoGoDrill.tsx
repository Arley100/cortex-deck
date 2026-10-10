import { useRef, useState } from "react";
import { GameShell } from "../../components/GameShell";
import { Results } from "../../components/Results";
import { StatLine } from "../../components/StatLine";
import { Btn } from "../../components/Btn";
import { DrillIntro } from "../../components/DrillIntro";
import { TrialMeter } from "../../components/TrialMeter";
import { sound } from "../../audio/engine";
import { useFlash } from "../../components/useFlash";
import { createRng, type Rng } from "../../engine/rng";
import { runTrialLoop } from "../../engine/scheduler";
import { useRunHandle } from "../../engine/useRunHandle";
import type { RunMeta, TrialEvent } from "../../engine/types";
import { scoreGoNoGo, type GoNoGoConfig } from "./score";

interface Props {
  config: GoNoGoConfig;
  onComplete: (events: TrialEvent[], meta: RunMeta) => void;
  onExit: () => void;
}

type Phase = "intro" | "run" | "done";
type Stim = "go" | "nogo";

export function buildStimuli(rng: Rng, config: GoNoGoConfig): Stim[] {
  return Array.from({ length: config.trials }, () =>
    rng() < config.goRate ? "go" : "nogo",
  );
}

export function GoNoGoDrill({ config, onComplete, onExit }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [stim, setStim] = useState<Stim | null>(null);
  const [trialNo, setTrialNo] = useState(0);
  const [counts, setCounts] = useState({ hits: 0, commissions: 0 });
  const [flash, triggerFlash] = useFlash<"ok" | "no">(160);
  const [events, setEvents] = useState<TrialEvent[]>([]);
  const setHandle = useRunHandle();

  const eventsRef = useRef<TrialEvent[]>([]);
  const stimuliRef = useRef<Stim[]>([]);
  const respondedRef = useRef(false);
  const stimRef = useRef<Stim | null>(null);
  const stimAtRef = useRef(0);
  const trialNoRef = useRef(0);

  const start = () => {
    const rng = createRng(config.seed ?? Date.now());
    stimuliRef.current = buildStimuli(rng, config);
    eventsRef.current = [];
    trialNoRef.current = 0;
    setCounts({ hits: 0, commissions: 0 });
    setPhase("run");
    setHandle(
      runTrialLoop({
        trials: config.trials,
        stimulusMs: config.windowMs,
        blankMs: config.blankMs,
        onStimulus: (i) => {
          const s = stimuliRef.current[i] as Stim;
          respondedRef.current = false;
          stimRef.current = s;
          stimAtRef.current = performance.now();
          trialNoRef.current = i;
          setTrialNo(i);
          setStim(s);
        },
        onStimulusEnd: (i) => {
          if (!respondedRef.current) {
            const s = stimuliRef.current[i] as Stim;
            if (s === "go") {
              eventsRef.current.push({ trial: i, kind: "target", response: "miss" });
            } else {
              eventsRef.current.push({
                trial: i,
                kind: "nontarget",
                response: "correctReject",
              });
            }
          }
          stimRef.current = null;
          setStim(null);
        },
        onDone: () => {
          const done = eventsRef.current;
          setEvents(done);
          setPhase("done");
          onComplete(done, {});
        },
      }),
    );
  };

  const tap = () => {
    if (phase !== "run" || !stimRef.current || respondedRef.current) return;
    respondedRef.current = true;
    const i = trialNoRef.current;
    if (stimRef.current === "go") {
      eventsRef.current.push({
        trial: i,
        kind: "target",
        response: "hit",
        rt: performance.now() - stimAtRef.current,
      });
      setCounts((c) => ({ ...c, hits: c.hits + 1 }));
      sound.play("good");
      triggerFlash("ok");
    } else {
      eventsRef.current.push({ trial: i, kind: "nontarget", response: "falseAlarm" });
      setCounts((c) => ({ ...c, commissions: c.commissions + 1 }));
      sound.play("bad");
      triggerFlash("no");
    }
  };

  const score = phase === "done" ? scoreGoNoGo(events) : null;

  const edge =
    flash === "no" ? "var(--color-rose)" : flash === "ok" ? "var(--color-green)" : undefined;

  return (
    <GameShell title="GO / NO-GO" sub="response inhibition" accent="blue" onExit={onExit}>
      {phase === "intro" && (
        <DrillIntro
          accent="blue"
          glyph="⊘"
          specs={[`${config.trials} trials`, `${config.windowMs} ms window`, `${Math.round(config.goRate * 100)}% go`]}
          actions={
            <Btn onClick={start} big solid accent="blue">
              START
            </Btn>
          }
        >
          Tap fast on a <b className="text-green">green circle</b>. Do{" "}
          <b className="text-rose">nothing</b> on a <b className="text-rose">red square</b>.
          It's easy to go; the skill is stopping.
        </DrillIntro>
      )}
      {phase === "run" && (
        <div className="flex w-full flex-col items-center gap-5">
          <TrialMeter current={trialNo} total={config.trials} color="var(--color-blue)" />
          <button
            type="button"
            onClick={tap}
            aria-label="tap on green"
            className="glass hud-corners flex h-72 w-full items-center justify-center rounded-2xl transition-colors duration-100"
            style={{ ["--c" as string]: edge ?? "var(--color-blue)", borderColor: edge }}
          >
            {stim ? (
              stim === "go" ? (
                <span
                  data-testid="stim-go"
                  className="h-[128px] w-[128px] rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle at 40% 35%, color-mix(in srgb, var(--color-green) 60%, white), var(--color-green) 65%)",
                    boxShadow: "0 0 40px var(--color-green), 0 0 90px -10px var(--color-green)",
                  }}
                />
              ) : (
                <span
                  data-testid="stim-nogo"
                  className="h-[124px] w-[124px] rounded-[14px]"
                  style={{
                    background:
                      "linear-gradient(160deg, color-mix(in srgb, var(--color-rose) 70%, white), var(--color-rose) 60%)",
                    boxShadow: "0 0 40px var(--color-rose), 0 0 90px -10px var(--color-rose)",
                  }}
                />
              )
            ) : (
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-muted" />
            )}
          </button>
          <div className="flex gap-4 font-mono text-[10px] tracking-[0.25em] text-muted">
            <span>
              HITS <span className="tabular-nums text-green">{counts.hits}</span>
            </span>
            <span>
              SLIPS <span className="tabular-nums text-rose">{counts.commissions}</span>
            </span>
          </div>
        </div>
      )}
      {phase === "done" && score && (
        <Results
          accent="blue"
          headline={`${score.primary}%`}
          tag="accuracy"
          onAgain={start}
          onExit={onExit}
        >
          <StatLine label="HITS (go)" value={score.breakdown.hits ?? 0} accent="green" />
          <StatLine label="CORRECT STOPS" value={score.breakdown.correctStops ?? 0} accent="green" />
          <StatLine label="SLIPPED (tapped red)" value={score.breakdown.commissions ?? 0} accent="rose" />
          <StatLine label="MISSED (no tap on go)" value={score.breakdown.omissions ?? 0} accent="rose" />
          <StatLine label="AVG GO SPEED" value={`${score.breakdown.meanGoRt ?? 0} ms`} />
          <StatLine label="D-PRIME" value={(score.dPrime ?? 0).toFixed(2)} accent="blue" />
        </Results>
      )}
    </GameShell>
  );
}
