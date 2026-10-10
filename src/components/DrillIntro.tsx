import type { ReactNode } from "react";
import { accentVar, type Accent } from "./accent";

interface DrillIntroProps {
  accent: Accent;
  glyph: string;
  /** short parameter tags, e.g. "24 trials" */
  specs: string[];
  children: ReactNode;
  actions: ReactNode;
}

/** Shared intro card every drill shows before its first trial. */
export function DrillIntro({ accent, glyph, specs, children, actions }: DrillIntroProps) {
  const color = accentVar[accent];
  return (
    <div
      className="glass hud-corners rise flex w-full flex-col items-center gap-5 rounded-2xl px-5 py-7 text-center"
      style={{ ["--c" as string]: color }}
    >
      <div
        aria-hidden="true"
        className="relative flex h-20 w-20 items-center justify-center rounded-full text-3xl"
        style={{
          color,
          background: `radial-gradient(circle, color-mix(in srgb, ${color} 22%, transparent), transparent 70%)`,
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 40%, transparent), 0 0 40px -6px ${color}`,
        }}
      >
        <span className="absolute inset-2 rounded-full border border-dashed opacity-40" style={{ borderColor: color }} />
        {glyph}
      </div>
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted">HOW IT WORKS</div>
      <p className="max-w-xs text-[15px] leading-relaxed text-fg/85">{children}</p>
      <ul className="flex flex-wrap justify-center gap-2" aria-label="drill parameters">
        {specs.map((s) => (
          <li
            key={s}
            className="rounded-sm border px-2 py-0.5 font-mono text-[10px] tracking-widest uppercase"
            style={{
              color,
              borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
            }}
          >
            {s}
          </li>
        ))}
      </ul>
      <div className="mt-1 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}
