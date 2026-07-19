import type { ReactNode } from "react";
import { Btn } from "./Btn";
import { accentVar, type Accent } from "./accent";

interface ResultsProps {
  headline: string | number;
  tag: string;
  accent: Accent;
  children?: ReactNode;
  onAgain: () => void;
  onExit: () => void;
}

export function Results({ headline, tag, accent, children, onAgain, onExit }: ResultsProps) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="text-center">
        <div
          className="text-6xl font-extrabold tracking-tight"
          style={{ color: accentVar[accent] }}
        >
          {headline}
        </div>
        <div className="mt-1 font-mono text-xs tracking-widest text-muted">
          {tag.toUpperCase()}
        </div>
      </div>
      {children && (
        <div className="w-full rounded-xl border border-edge bg-panel p-4">{children}</div>
      )}
      <div className="flex w-full gap-3">
        <Btn onClick={onAgain} accent={accent} style={{ flex: 1 }}>
          AGAIN
        </Btn>
        <Btn onClick={onExit} accent="muted" style={{ flex: 1 }}>
          MENU
        </Btn>
      </div>
    </div>
  );
}
