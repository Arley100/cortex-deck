import type { CSSProperties, ReactNode } from "react";
import { accentVar, type Accent } from "./accent";

interface BtnProps {
  children: ReactNode;
  onClick: () => void;
  accent?: Accent;
  big?: boolean;
  disabled?: boolean;
  style?: CSSProperties;
}

export function Btn({
  children,
  onClick,
  accent = "cyan",
  big = false,
  disabled = false,
  style,
}: BtnProps) {
  const color = accentVar[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border-[1.5px] bg-transparent font-semibold tracking-wide transition active:scale-95 disabled:opacity-40 ${
        big ? "px-6 py-4 text-lg" : "px-5 py-3 text-base"
      }`}
      style={{ borderColor: color, color, ...style }}
    >
      {children}
    </button>
  );
}
