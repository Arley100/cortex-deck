import { useEffect, useId, useRef } from "react";

/**
 * Pip: a small original character who reacts to results. Part ichimatsu
 * doll (shaved monk-like scalp, porcelain face, haori over striped hakama),
 * part plush desk companion (round soft head, dot eyes, blush, headphones).
 * Moods map one to one to run verdicts (see mascot/mood.ts); Pip never
 * reacts more warmly than the numbers justify.
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

/** color of the haori tie on Pip's chest */
const TIE: Record<PipMood, string> = {
  idle: "#f4f1ea",
  wave: "var(--color-violet)",
  clap: "var(--color-cyan)",
  celebrate: "var(--color-green)",
  nod: "var(--color-cyan)",
  encourage: "var(--color-amber)",
};

const INK = "#2a2230";
const SKIN = "#fbf1e6";

const SPARKS = [
  { x: 12, y: 30, delay: 0 },
  { x: 108, y: 20, delay: 0.4 },
  { x: 8, y: 84, delay: 0.8 },
  { x: 112, y: 76, delay: 1.2 },
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
      const ox = clamp((px - cx) / 260) * 3.4;
      const oy = clamp((py - cy) / 260) * 2.4;
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
  const id = (name: string) => `pip-${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const tie = TIE[mood];

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
        {/* plush head: warm cream with a soft lower shadow */}
        <radialGradient id={id("head")} cx="0.42" cy="0.36" r="0.75">
          <stop offset="0" stopColor="#fffaf3" />
          <stop offset="0.6" stopColor="#f2e3d1" />
          <stop offset="1" stopColor="#d7bfa5" />
        </radialGradient>
        {/* shaved scalp, the doll's blue-grey hairline */}
        <linearGradient id={id("scalp")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e9ab3" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a9b3c8" stopOpacity="0.12" />
        </linearGradient>
        <filter id={id("soft")} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
        <linearGradient id={id("haori")} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#56618a" />
          <stop offset="1" stopColor="#353d5c" />
        </linearGradient>
        <linearGradient id={id("hakama")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9b8f7b" />
          <stop offset="1" stopColor="#6f6556" />
        </linearGradient>
        <linearGradient id={id("cup")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a5060" />
          <stop offset="1" stopColor="#22262f" />
        </linearGradient>
        <clipPath id={id("clip")}>
          <ellipse cx="60" cy="46" rx="33" ry="31" />
        </clipPath>
        <filter id={id("glow")} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse className="pip-shadow" cx="60" cy="146" rx="24" ry="3.6" fill="#000" opacity="0.4" />

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
        {/* tabi feet */}
        <ellipse cx="50" cy="140" rx="7.5" ry="3.8" fill="#f4f1ea" />
        <ellipse cx="70" cy="140" rx="7.5" ry="3.8" fill="#f4f1ea" />

        {/* striped hakama */}
        <path d="M37 108 L83 108 L91 138 Q60 143 29 138 Z" fill={url("hakama")} />
        <g stroke="#5c5346" strokeOpacity="0.55" strokeWidth="1.1">
          {[44, 50, 56, 62, 68, 74].map((x) => (
            <path key={x} d={`M${x} 112 L${x + (x - 60) * 0.18} 139`} />
          ))}
        </g>
        <path d="M60 116 L60 140" stroke="#4d453a" strokeWidth="1.4" />

        {/* haori jacket over a white collar */}
        <path d="M41 82 Q60 75 79 82 L86 117 Q60 123 34 117 Z" fill={url("haori")} />
        <path d="M51 79 L60 97 L69 79" stroke="#f4f1ea" strokeWidth="4" strokeLinejoin="round" fill="none" />
        <path d="M48 80 L60 103 M72 80 L60 103" stroke="#6b77a3" strokeWidth="1.3" fill="none" />

        {/* haori tie: the knot carries the mood color */}
        <g filter={mood === "idle" ? undefined : url("glow")}>
          <path d="M57.5 104 L55 112 M62.5 104 L65 112" stroke={tie} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="60" cy="102.5" r="3.4" fill={tie} />
        </g>

        {/* sleeves rotate around the shoulders */}
        <g className="pip-arm-l">
          <path d="M40 89 L32.5 106" stroke={url("haori")} strokeWidth="13" strokeLinecap="round" />
          <path d="M27 103 L38 108" stroke="#6b77a3" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="30" cy="112" r="5.2" fill={SKIN} />
        </g>
        <g className="pip-arm-r">
          <path d="M80 89 L87.5 106" stroke={url("haori")} strokeWidth="13" strokeLinecap="round" />
          <path d="M93 103 L82 108" stroke="#6b77a3" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="90" cy="112" r="5.2" fill={SKIN} />
        </g>

        <g className="pip-head">
          {/* round plush head with a shaved, monk-like scalp */}
          <ellipse cx="60" cy="46" rx="33" ry="31" fill={url("head")} />
          <g clipPath={url("clip")}>
            <path
              d="M18 44 Q24 30 41 30 Q60 35 79 30 Q96 30 102 44 L102 0 L18 0 Z"
              fill={url("scalp")}
              filter={url("soft")}
            />
          </g>
          {/* lighter face panel */}
          <ellipse cx="60" cy="55" rx="23" ry="16.5" fill={SKIN} />
          <ellipse cx="44" cy="61" rx="5" ry="3" fill="#f3a3a9" opacity="0.6" />
          <ellipse cx="76" cy="61" rx="5" ry="3" fill="#f3a3a9" opacity="0.6" />

          <g ref={eyesRef}>
            {happy ? (
              <g stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none">
                <path d="M45 54 Q49 48.5 53 54" />
                <path d="M67 54 Q71 48.5 75 54" />
              </g>
            ) : (
              <g fill={INK}>
                <circle cx="49" cy="53" r="3.6" />
                <circle cx="71" cy="53" r="3.6" />
                <circle cx="50.2" cy="51.8" r="1.1" fill="#ffffff" />
                <circle cx="72.2" cy="51.8" r="1.1" fill="#ffffff" />
              </g>
            )}
            {mood === "encourage" && (
              <g stroke={INK} strokeWidth="1.8" strokeLinecap="round">
                <path d="M44 46 L52.5 47.8" />
                <path d="M76 46 L67.5 47.8" />
              </g>
            )}
            {!happy && (
              <g className="pip-lids" fill={SKIN}>
                <rect x="44.5" y="48.5" width="9" height="9" />
                <rect x="66.5" y="48.5" width="9" height="9" />
              </g>
            )}
          </g>

          {mood === "celebrate" ? (
            <ellipse cx="60" cy="62" rx="3.4" ry="2.8" fill="#c65d6d" />
          ) : mood === "encourage" ? (
            <path d="M56.5 62 Q60 64 63.5 62" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M56 60.5 Q60 65 64 60.5" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          )}

          {/* headphones */}
          <path d="M25 47 Q25 9 60 9 Q95 9 95 47" stroke="#2c313d" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <path d="M31 30 Q40 15 60 13.5" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <rect x="18" y="35" width="13" height="25" rx="6.5" fill={url("cup")} />
          <rect x="89" y="35" width="13" height="25" rx="6.5" fill={url("cup")} />
          <circle className="pip-bulb" cx="22.5" cy="47.5" r="1.7" fill="var(--color-cyan)" filter={url("glow")} />
          <circle className="pip-bulb" cx="97.5" cy="47.5" r="1.7" fill="var(--color-cyan)" filter={url("glow")} />
        </g>
      </g>
    </svg>
  );
}
