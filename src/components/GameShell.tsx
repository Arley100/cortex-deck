import type { ReactNode } from "react";
import { accentVar, type Accent } from "./accent";

interface GameShellProps {
  title: string;
  sub: string;
  accent: Accent;
  onExit: () => void;
  children: ReactNode;
}

export function GameShell({ title, sub, accent, onExit, children }: GameShellProps) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="font-mono text-sm text-muted transition active:scale-95"
        >
          ← exit
        </button>
        <div className="text-right">
          <div
            className="text-lg font-extrabold tracking-tight"
            style={{ color: accentVar[accent] }}
          >
            {title}
          </div>
          <div className="font-mono text-xs tracking-widest text-muted">
            {sub.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">{children}</div>
    </div>
  );
}
