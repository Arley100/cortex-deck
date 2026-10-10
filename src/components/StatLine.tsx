import { accentVar, type Accent } from "./accent";

interface StatLineProps {
  label: string;
  value: string | number;
  accent?: Accent;
}

export function StatLine({ label, value, accent }: StatLineProps) {
  return (
    <div className="flex items-baseline gap-2 py-1.5">
      <span className="font-mono text-[11px] tracking-wider text-muted">{label}</span>
      <span
        aria-hidden="true"
        className="mb-[3px] flex-1 border-b border-dotted"
        style={{ borderColor: "color-mix(in srgb, var(--color-muted) 30%, transparent)" }}
      />
      <span
        className="font-mono text-base font-bold tabular-nums"
        style={{ color: accent ? accentVar[accent] : "var(--color-fg)" }}
      >
        {value}
      </span>
    </div>
  );
}
