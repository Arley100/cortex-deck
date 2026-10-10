import type { ReactNode } from "react";
import { useAppStore } from "../app/store";
import { PipSays } from "../mascot/PipSays";
import { reactionFor } from "../mascot/mood";
import { Btn } from "./Btn";
import { GlitchText } from "./GlitchText";
import { accentVar, type Accent } from "./accent";
import { formatValue } from "./format";

interface ResultsProps {
  headline: string | number;
  tag: string;
  accent: Accent;
  children?: ReactNode;
  onAgain: () => void;
  onExit: () => void;
}

export function Results({ headline, tag, accent, children, onAgain, onExit }: ResultsProps) {
  const color = accentVar[accent];
  const last = useAppStore((s) => s.lastVerdict);
  const ready = last?.status === "ready" ? last : null;
  const reaction = ready ? reactionFor(ready.verdict, ready.unit) : null;

  return (
    <div className="flex w-full flex-col items-center gap-5" style={{ ["--c" as string]: color }}>
      <div className="rise w-full">
        <PipSays
          mood={reaction?.mood ?? "idle"}
          line={reaction?.line ?? null}
          sounds={reaction?.sounds}
          size={92}
        />
      </div>

      <div className="rise text-center" style={{ ["--d" as string]: "120ms" }}>
        <div
          className="font-mono text-6xl font-extrabold tracking-tight tabular-nums"
          style={{ color, filter: `drop-shadow(0 0 22px color-mix(in srgb, ${color} 45%, transparent))` }}
        >
          <GlitchText text={String(headline)} once />
        </div>
        <div className="mt-1 font-mono text-[11px] tracking-[0.28em] text-muted">
          {tag.toUpperCase()}
        </div>
        {ready && ready.verdict.kind !== "calibrating" && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 font-mono text-[10px] tracking-widest text-muted">
            <span className="rounded-sm border border-edge px-2 py-0.5">
              BASELINE {formatValue(ready.verdict.baseline, ready.unit)}
            </span>
            {ready.verdict.kind === "personalBest" && (
              <span className="rounded-sm border border-edge px-2 py-0.5">
                PREVIOUS BEST {formatValue(ready.verdict.previousBest, ready.unit)}
              </span>
            )}
          </div>
        )}
      </div>

      {children && (
        <div
          className="glass hud-corners rise w-full rounded-xl px-4 py-3"
          style={{ ["--d" as string]: "220ms" }}
        >
          {children}
        </div>
      )}
      <div className="rise flex w-full gap-3" style={{ ["--d" as string]: "300ms" }}>
        <Btn onClick={onAgain} accent={accent} solid className="flex-1">
          AGAIN
        </Btn>
        <Btn onClick={onExit} accent="muted" className="flex-1">
          MENU
        </Btn>
      </div>
    </div>
  );
}
