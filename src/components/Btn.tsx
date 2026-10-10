import type { CSSProperties, ReactNode } from "react";
import { sound, type SfxName } from "../audio/engine";
import { accentVar, type Accent } from "./accent";

interface BtnProps {
  children: ReactNode;
  onClick: () => void;
  accent?: Accent;
  big?: boolean;
  /** filled primary call to action */
  solid?: boolean;
  disabled?: boolean;
  /** acknowledgement sound; drills pass null and play their own feedback */
  sfx?: SfxName | null;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/** HUD-style button: clipped corners, mono caps, glow on hover. */
export function Btn({
  children,
  onClick,
  accent = "cyan",
  big = false,
  solid = false,
  disabled = false,
  sfx = "tap",
  ariaLabel,
  className = "",
  style,
}: BtnProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (sfx) sound.play(sfx);
        onClick();
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`hud-btn ${big ? "hud-btn-lg" : ""} ${solid ? "hud-btn-solid" : ""} ${className}`}
      style={{ ["--c" as string]: accentVar[accent], ...style }}
    >
      <span aria-hidden="true" className="hud-btn-edge" />
      <span aria-hidden="true" className="hud-btn-fill" />
      {children}
    </button>
  );
}
