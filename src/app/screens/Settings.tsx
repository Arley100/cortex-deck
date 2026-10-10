import { useEffect, useRef, useState, type ReactNode } from "react";
import { sound } from "../../audio/engine";
import { Btn } from "../../components/Btn";
import { GlitchText } from "../../components/GlitchText";
import { DRILLS } from "../../drills/registry";
import { exportBundle, importBundle, serializeBundle } from "../../storage/exportImport";
import { runsRepo } from "../../storage/runsRepo";
import { settingsRepo } from "../../storage/settingsRepo";
import { useAppStore } from "../store";

function Section({ title, children, accent }: { title: string; children: ReactNode; accent?: string }) {
  return (
    <section
      className="glass hud-corners rise rounded-xl p-4"
      style={accent ? { ["--c" as string]: accent } : undefined}
    >
      <h2 className="mb-3 font-mono text-[10px] tracking-[0.3em] text-muted">{title}</h2>
      {children}
    </section>
  );
}

function Switch({
  on,
  label,
  detail,
  onChange,
}: {
  on: boolean;
  label: string;
  detail: string;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-start justify-between gap-4 py-2 text-left"
    >
      <span>
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{detail}</span>
      </span>
      <span
        aria-hidden="true"
        className="relative mt-1 h-6 w-11 shrink-0 rounded-full border transition-colors"
        style={{
          borderColor: on ? "var(--color-cyan)" : "var(--color-edge)",
          background: on ? "color-mix(in srgb, var(--color-cyan) 22%, transparent)" : "var(--color-panel)",
        }}
      >
        <span
          className="absolute top-[3px] h-4 w-4 rounded-full transition-all"
          style={{
            left: on ? 22 : 3,
            background: on ? "var(--color-cyan)" : "var(--color-muted)",
            boxShadow: on ? "0 0 10px var(--color-cyan)" : "none",
          }}
        />
      </span>
    </button>
  );
}

export function Settings() {
  const navigate = useAppStore((s) => s.navigate);
  const bumpRuns = useAppStore((s) => s.bumpRuns);
  const soundPrefs = useAppStore((s) => s.soundPrefs);
  const setSoundPref = useAppStore((s) => s.setSoundPref);
  const loadSoundPrefs = useAppStore((s) => s.loadSoundPrefs);
  const [battery, setBattery] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [wipeArmed, setWipeArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void settingsRepo.get().then((s) => setBattery(s.batteryDrills));
  }, []);

  const toggleBattery = (id: string) => {
    setWipeArmed(false);
    sound.play("tap");
    const next = battery.includes(id)
      ? battery.filter((b) => b !== id)
      : [...battery, id];
    setBattery(next);
    if (next.length === 3) {
      void settingsRepo.set("batteryDrills", next);
      setMessage("battery saved");
    } else {
      setMessage("pick exactly 3 drills for the battery");
    }
  };

  const doExport = async () => {
    const json = serializeBundle(await exportBundle());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cortex-deck-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("export downloaded");
  };

  const doImport = async (file: File) => {
    try {
      const result = await importBundle(await file.text());
      bumpRuns();
      setBattery((await settingsRepo.get()).batteryDrills);
      await loadSoundPrefs();
      setMessage(`imported ${result.runs} runs`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "import failed");
    }
  };

  const doWipe = async () => {
    if (!wipeArmed) {
      setWipeArmed(true);
      return;
    }
    await runsRepo.clearAll();
    await settingsRepo.clearAll();
    bumpRuns();
    setWipeArmed(false);
    setBattery((await settingsRepo.get()).batteryDrills);
    await loadSoundPrefs();
    setMessage("all data wiped");
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            sound.play("tap");
            navigate({ name: "home" });
          }}
          className="flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-muted transition hover:text-fg active:scale-95"
        >
          <span aria-hidden="true">←</span> EXIT
        </button>
        <h1 className="font-mono text-lg font-extrabold tracking-[0.12em]">
          <GlitchText text="SETTINGS" />
        </h1>
      </div>
      <div className="hud-rule mb-6" />

      <div className="flex flex-col gap-5">
        <Section title="SOUND">
          <Switch
            on={soundPrefs.sfx}
            label="Sound effects"
            detail="Soft ticks and tones that acknowledge your taps and results. They never announce a stimulus, so timing and memory scores stay comparable with silent runs."
            onChange={(on) => {
              setSoundPref("sfx", on);
              if (on) sound.play("toggle");
            }}
          />
          <div className="my-1 h-px bg-edge" />
          <Switch
            on={soundPrefs.ambient}
            label="Ambient drone"
            detail="A low hum with a 6 Hz left/right offset (best on headphones) and slow swells about every 11 seconds you can breathe along with. Some people find it settling. It is a backdrop, not a treatment, and the app makes no claim that it changes scores."
            onChange={(on) => setSoundPref("ambient", on)}
          />
        </Section>

        <Section title="PRE/POST BATTERY (PICK 3)" accent="var(--color-violet)">
          <div className="flex flex-wrap gap-2">
            {DRILLS.map((d) => {
              const id = d.definition.id;
              const on = battery.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleBattery(id)}
                  className="rounded-sm border px-3 py-1.5 font-mono text-xs transition active:scale-95"
                  style={{
                    borderColor: on ? "var(--color-cyan)" : "var(--color-edge)",
                    color: on ? "var(--color-cyan)" : "var(--color-muted)",
                    background: on ? "color-mix(in srgb, var(--color-cyan) 10%, transparent)" : "transparent",
                  }}
                >
                  {d.definition.name}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="DATA">
          <p className="mb-4 text-xs leading-relaxed text-muted">
            Everything lives in this browser. Export writes one JSON file; import
            replaces what is stored here with the file's contents.
          </p>
          <div className="flex gap-3">
            <Btn onClick={() => void doExport()} accent="cyan" className="flex-1">
              EXPORT
            </Btn>
            <Btn onClick={() => fileRef.current?.click()} accent="violet" className="flex-1">
              IMPORT
            </Btn>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            aria-label="import file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void doImport(file);
              e.target.value = "";
            }}
          />
        </Section>

        <Section title="DANGER" accent="var(--color-rose)">
          <Btn onClick={() => void doWipe()} accent="rose" solid={wipeArmed} className="w-full">
            {wipeArmed ? "TAP AGAIN TO WIPE EVERYTHING" : "WIPE ALL DATA"}
          </Btn>
          {wipeArmed && (
            <button
              type="button"
              onClick={() => setWipeArmed(false)}
              className="mt-3 w-full font-mono text-xs tracking-widest text-muted hover:text-fg"
            >
              CANCEL
            </button>
          )}
        </Section>

        {message && (
          <p className="text-center font-mono text-xs text-muted" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
