import { accentVar, type Accent } from "./accent";

interface StatLineProps {
  label: string;
  value: string | number;
  accent?: Accent;
}

export function StatLine({ label, value, accent }: StatLineProps) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="font-mono text-xs tracking-wider text-muted">{label}</span>
      <span
        className="font-mono text-base font-bold"
        style={{ color: accent ? accentVar[accent] : "var(--color-fg)" }}
      >
        {value}
      </span>
    </div>
  );
}
