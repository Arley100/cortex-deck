/** Accent colors drills and chrome pull from the theme tokens. */
export type Accent =
  | "cyan"
  | "violet"
  | "green"
  | "amber"
  | "rose"
  | "blue"
  | "muted";

export const accentVar: Record<Accent, string> = {
  cyan: "var(--color-cyan)",
  violet: "var(--color-violet)",
  green: "var(--color-green)",
  amber: "var(--color-amber)",
  rose: "var(--color-rose)",
  blue: "var(--color-blue)",
  muted: "var(--color-muted)",
};
