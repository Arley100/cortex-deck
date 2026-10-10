import { useEffect, useId, useRef } from "react";

/**
 * Pip: a small original robot who reacts to results. Moods map one to one to
 * run verdicts (see mascot/mood.ts); Pip never reacts more warmly than the
 * numbers justify.
 */
export type PipMood = "idle" | "wave" | "clap" | "celebrate" | "nod" | "encourage";

const MOOD_LABEL: Record<PipMood, string> = {
  idle: "Pip, standing by",
  wave: "Pip, waving",
  clap: "Pip, clapping",
  celebrate: "Pip, clapping and hopping",
  nod: "Pip, nodding with a thumbs up",
  encourage: "Pip, pumping both fists in encouragement",
};

const CHEST: Record<PipMood, string> = {
  idle: "var(--color-cyan)",
  wave: "var(--color-violet)",
  clap: "var(--color-cyan)",
  celebrate: "var(--color-green)",
  nod: "var(--color-cyan)",
  encourage: "var(--color-amber)",
};

const SPARKS = [
  { x: 12, y: 30, delay: 0 },
  { x: 106, y: 22, delay: 0.4 },
  { x: 8, y: 84, delay: 0.8 },
  { x: 110, y: 74, delay: 1.2 },
];

/** four-point star centered on (x, y) */
function starPath(x: number, y: number, r = 6, w = 1.6): string {
  return (
    `M${x} ${y - r} L${x + w} ${y - w} L${x + r} ${y} L${x + w} ${y + w} ` +
    `L${x} ${y + r} L${x - w} ${y + w} L${x - r} ${y} L${x - w} ${y - w} Z`
  );
}

interface PipProps {
  mood?: PipMood;
  size?: number;
  /** follow the pointer with the eyes */
  track?: boolean;
  className?: string;
}

export function Pip({ mood = "idle", size = 112, track = true, className = "" }: PipProps) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!track) return;
    let frame = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      frame = 0;
      const svg = svgRef.current;
      const eyes = eyesRef.current;
      if (!svg || !eyes) return;
      const r = svg.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.35;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      const ox = clamp((px - cx) / 260) * 4.5;
      const oy = clamp((py - cy) / 260) * 3.2;
      eyes.setAttribute("transform", `translate(${ox.toFixed(2)} ${oy.toFixed(2)})`);
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [track]);

  const happy = mood === "clap" || mood === "celebrate";
  const shell = `pip-shell-${uid}`;
  const glow = `pip-glow-${uid}`;
  const chest = CHEST[mood];

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 150"
      width={size}
      height={(size * 150) / 120}
      role="img"
      aria-label={MOOD_LABEL[mood]}
      data-mood={mood}
      className={`pip pip--${mood} ${className}`}
    >
      <defs>
        <linearGradient id={shell} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#f4f8ff" />
          <stop offset="0.55" stopColor="#c9d6f2" />
          <stop offset="1" stopColor="#8496c4" />
        </linearGradient>
        <filter id={glow} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse className="pip-shadow" cx="60" cy="146" rx="22" ry="3.6" fill="#000" opacity="0.4" />

      {/* sparkles only animate in the celebrate mood */}
      {SPARKS.map(({ x, y, delay }) => (
        <path
          key={`${x}-${y}`}
          className="pip-spark"
          style={{ ["--sd" as string]: `${delay}s` }}
          d={starPath(x, y)}
          fill="var(--color-amber)"
        />
      ))}

      <g className="pip-root">
        {/* legs */}
        <rect x="47" y="116" width="10" height="20" rx="5" fill="#7d8fbd" />
        <rect x="63" y="116" width="10" height="20" rx="5" fill="#7d8fbd" />
        <ellipse cx="51" cy="137" rx="8" ry="4.5" fill={`url(#${shell})`} />
        <ellipse cx="69" cy="137" rx="8" ry="4.5" fill={`url(#${shell})`} />

        {/* body */}
        <rect x="37" y="85" width="46" height="37" rx="17" fill={`url(#${shell})`} />
        <path d="M41 108 Q60 114 79 108" stroke="#8091c0" strokeWidth="1.2" fill="none" opacity="0.6" />
        <circle cx="60" cy="100" r="7.5" fill="#0a1328" />
        <circle cx="60" cy="100" r="4.2" fill={chest} filter={`url(#${glow})`} />

        {/* arms rotate around the shoulders */}
        <g className="pip-arm-l">
          <path d="M37 93 L27 116" stroke="#9fb0da" strokeWidth="7" strokeLinecap="round" />
          <circle cx="27" cy="116" r="5.8" fill={`url(#${shell})`} />
        </g>
        <g className="pip-arm-r">
          <path d="M83 93 L93 116" stroke="#9fb0da" strokeWidth="7" strokeLinecap="round" />
          <circle cx="93" cy="116" r="5.8" fill={`url(#${shell})`} />
        </g>

        <g className="pip-head">
          <rect x="54" y="74" width="12" height="10" rx="3" fill="#7d8fbd" />
          <path d="M60 22 L60 11" stroke="#9fb0da" strokeWidth="2.5" strokeLinecap="round" />
          <circle className="pip-bulb" cx="60" cy="8" r="4.5" fill="var(--color-cyan)" filter={`url(#${glow})`} />
          <circle cx="21" cy="51" r="6.5" fill="#7d8fbd" />
          <circle cx="99" cy="51" r="6.5" fill="#7d8fbd" />
          <rect x="21" y="21" width="78" height="58" rx="27" fill={`url(#${shell})`} />
          <rect
            x="30"
            y="32"
            width="60"
            height="37"
            rx="17"
            fill="#071022"
            stroke="color-mix(in srgb, var(--color-cyan) 35%, transparent)"
            strokeWidth="1"
          />
          <path d="M37 38 Q46 34 58 35" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          <g ref={eyesRef}>
            {happy ? (
              <g stroke="var(--color-cyan)" strokeWidth="3.6" strokeLinecap="round" fill="none" filter={`url(#${glow})`}>
                <path d="M42 54 Q48 45 54 54" />
                <path d="M66 54 Q72 45 78 54" />
              </g>
            ) : (
              <g fill="var(--color-cyan)" filter={`url(#${glow})`}>
                <rect x="43.5" y={mood === "encourage" ? 46 : 44} width="9" height={mood === "encourage" ? 11 : 14} rx="4.5" />
                <rect x="67.5" y={mood === "encourage" ? 46 : 44} width="9" height={mood === "encourage" ? 11 : 14} rx="4.5" />
              </g>
            )}
            {mood === "encourage" && (
              <g stroke="var(--color-cyan)" strokeWidth="2.4" strokeLinecap="round">
                <path d="M42 41 L53 43.5" />
                <path d="M78 41 L67 43.5" />
              </g>
            )}
            {!happy && (
              <g className="pip-lids" fill="#071022">
                <rect x="41" y="40" width="13" height="20" />
                <rect x="66" y="40" width="13" height="20" />
              </g>
            )}
          </g>

          {mood === "celebrate" ? (
            <ellipse cx="60" cy="63" rx="4.2" ry="3.4" fill="var(--color-cyan)" filter={`url(#${glow})`} />
          ) : mood === "encourage" ? (
            <path d="M55 63.5 Q60 66 65 63.5" stroke="var(--color-cyan)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M54 61.5 Q60 67 66 61.5" stroke="var(--color-cyan)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          )}
          <circle cx="37" cy="62" r="3.2" fill="var(--color-rose)" opacity="0.45" />
          <circle cx="83" cy="62" r="3.2" fill="var(--color-rose)" opacity="0.45" />
        </g>
      </g>
    </svg>
  );
}
