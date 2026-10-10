import { useEffect } from "react";
import { sound } from "../audio/engine";
import { useTypewriter } from "../components/useTypewriter";
import { Pip, type PipMood } from "./Pip";
import type { Reaction } from "./mood";

interface PipSaysProps {
  mood: PipMood;
  line: string | null;
  size?: number;
  /** played once per distinct line, timed to the animation */
  sounds?: Reaction["sounds"];
}

/** Pip plus a speech bubble that types its line out. */
export function PipSays({ mood, line, size = 96, sounds }: PipSaysProps) {
  const typed = useTypewriter(line ?? "");

  useEffect(() => {
    if (!sounds || sounds.length === 0) return;
    const timers = sounds.map((s) => setTimeout(() => sound.play(s.name), s.at));
    return () => timers.forEach(clearTimeout);
    // replay only when the line changes, not on every parent render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  return (
    <div className="flex items-center gap-3">
      <Pip key={`${mood}-${line}`} mood={mood} size={size} className="shrink-0" />
      {line && (
        <div className="bubble glass min-h-[3.5rem] flex-1 rounded-2xl px-4 py-3 font-mono text-[12.5px] leading-relaxed text-fg">
          <span className="sr-only" aria-live="polite">
            {line}
          </span>
          <span aria-hidden="true" className={typed.length < line.length ? "caret" : ""}>
            {typed}
          </span>
        </div>
      )}
    </div>
  );
}
