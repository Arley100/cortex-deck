import type { ReactNode } from "react";

interface GlitchTextProps {
  /** plain text for the offset layers */
  text: string;
  /** visible content; defaults to `text` (pass nodes to color parts of it) */
  children?: ReactNode;
  /** one burst on mount instead of the slow periodic loop */
  once?: boolean;
  className?: string;
}

/**
 * RGB-split text with brief slice glitches. The offset layers are
 * aria-hidden duplicates, so assistive tech reads the text exactly once.
 */
export function GlitchText({ text, children, once = false, className = "" }: GlitchTextProps) {
  return (
    <span className={`glitch ${once ? "glitch-once" : ""} ${className}`}>
      {children ?? text}
      <span aria-hidden="true" className="glitch-layer glitch-a">
        {text}
      </span>
      <span aria-hidden="true" className="glitch-layer glitch-b">
        {text}
      </span>
    </span>
  );
}
