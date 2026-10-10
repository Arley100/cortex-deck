import type { ReactNode } from "react";
import { sound } from "../audio/engine";
import { GlitchText } from "./GlitchText";
import { accentVar, type Accent } from "./accent";

interface GameShellProps {
  title: string;
  sub: string;
  accent: Accent;
  onExit: () => void;
  children: ReactNode;
}

export function GameShell({ title, sub, accent, onExit, children }: GameShellProps) {
  const color = accentVar[accent];
  return (
    <div className="flex min-h-full flex-1 flex-col" style={{ ["--c" as string]: color }}>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            sound.play("tap");
            onExit();
          }}
          className="group flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-muted transition hover:text-fg active:scale-95"
        >
          <span className="transition group-hover:-translate-x-0.5" aria-hidden="true">
            ←
          </span>
          EXIT
        </button>
        <div className="text-right">
          <div className="font-mono text-lg font-extrabold tracking-[0.12em]" style={{ color }}>
            <GlitchText text={title} />
          </div>
          <div className="font-mono text-[10px] tracking-[0.25em] text-muted">
            {sub.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="hud-rule mb-6" />
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
