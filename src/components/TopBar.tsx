import type { ReactNode } from "react";
import { sound } from "../audio/engine";
import { useAppStore } from "../app/store";

function Toggle({
  on,
  label,
  onClick,
  children,
}: {
  on: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-8 items-center gap-1.5 rounded-sm border px-2.5 font-mono text-[10px] tracking-[0.2em] transition active:scale-95"
      style={{
        color: on ? "var(--color-cyan)" : "var(--color-muted)",
        borderColor: on
          ? "color-mix(in srgb, var(--color-cyan) 45%, transparent)"
          : "var(--color-edge)",
        background: on ? "color-mix(in srgb, var(--color-cyan) 9%, transparent)" : "transparent",
      }}
    >
      {children}
    </button>
  );
}

/** Status pill plus the two sound switches; shown on every screen. */
export function TopBar() {
  const prefs = useAppStore((s) => s.soundPrefs);
  const setPref = useAppStore((s) => s.setSoundPref);

  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 rounded-full border border-edge bg-panel/60 px-3 py-1 font-mono text-[10px] tracking-[0.22em] text-muted backdrop-blur">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-cyan"
          style={{ boxShadow: "0 0 8px var(--color-cyan)" }}
        />
        <span className="whitespace-nowrap">
          <span className="hidden sm:inline">LOCAL · </span>ON-DEVICE
        </span>
      </div>
      {sound.supported && (
        <div className="flex gap-2">
          <Toggle
            on={prefs.ambient}
            label="Drone: ambient sound"
            onClick={() => setPref("ambient", !prefs.ambient)}
          >
            <span
              aria-hidden="true"
              className={`flex h-3 items-end gap-[2px] ${prefs.ambient ? "breathe" : ""}`}
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`w-[2px] bg-current ${prefs.ambient ? "eq-bar" : ""}`}
                  style={{
                    height: prefs.ambient ? "100%" : "35%",
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </span>
            DRONE
          </Toggle>
          <Toggle
            on={prefs.sfx}
            label="SFX: sound effects"
            onClick={() => {
              setPref("sfx", !prefs.sfx);
              // confirms the switch audibly only when turning sound on
              if (!prefs.sfx) sound.play("toggle");
            }}
          >
            <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 4.5h2.2L6 2v8L3.2 7.5H1z" fill="currentColor" />
              {prefs.sfx ? (
                <path d="M8 4c.8.9.8 3.1 0 4M9.6 2.6c1.6 1.8 1.6 5 0 6.8" stroke="currentColor" strokeLinecap="round" />
              ) : (
                <path d="M8 4.2l3 3.6M11 4.2l-3 3.6" stroke="currentColor" strokeLinecap="round" />
              )}
            </svg>
            SFX
          </Toggle>
        </div>
      )}
    </header>
  );
}
