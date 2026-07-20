import { useEffect, useRef, useState } from "react";
import { Btn } from "../../components/Btn";
import { DRILLS } from "../../drills/registry";
import { exportBundle, importBundle, serializeBundle } from "../../storage/exportImport";
import { runsRepo } from "../../storage/runsRepo";
import { settingsRepo } from "../../storage/settingsRepo";
import { useAppStore } from "../store";

export function Settings() {
  const navigate = useAppStore((s) => s.navigate);
  const bumpRuns = useAppStore((s) => s.bumpRuns);
  const [battery, setBattery] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [wipeArmed, setWipeArmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void settingsRepo.get().then((s) => setBattery(s.batteryDrills));
  }, []);

  const toggleBattery = (id: string) => {
    setWipeArmed(false);
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
    setMessage("all data wiped");
  };

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate({ name: "home" })}
          className="font-mono text-sm text-muted transition active:scale-95"
        >
          ← exit
        </button>
        <div className="text-lg font-extrabold tracking-tight">SETTINGS</div>
      </div>

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="mb-2 font-mono text-xs tracking-widest text-muted">
            PRE/POST BATTERY (PICK 3)
          </h2>
          <div className="flex flex-wrap gap-2">
            {DRILLS.map((d) => {
              const id = d.definition.id;
              const on = battery.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleBattery(id)}
                  className="rounded-full border px-3 py-1 font-mono text-xs transition active:scale-95"
                  style={{
                    borderColor: on ? "var(--color-cyan)" : "var(--color-edge)",
                    color: on ? "var(--color-cyan)" : "var(--color-muted)",
                  }}
                >
                  {d.definition.name}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-mono text-xs tracking-widest text-muted">DATA</h2>
          <p className="mb-3 text-xs leading-relaxed text-muted">
            Everything lives in this browser. Export writes one JSON file; import
            replaces what is stored here with the file's contents.
          </p>
          <div className="flex gap-3">
            <Btn onClick={() => void doExport()} accent="cyan" style={{ flex: 1 }}>
              EXPORT
            </Btn>
            <Btn onClick={() => fileRef.current?.click()} accent="violet" style={{ flex: 1 }}>
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
        </section>

        <section>
          <h2 className="mb-2 font-mono text-xs tracking-widest text-muted">DANGER</h2>
          <Btn onClick={() => void doWipe()} accent="rose" style={{ width: "100%" }}>
            {wipeArmed ? "TAP AGAIN TO WIPE EVERYTHING" : "WIPE ALL DATA"}
          </Btn>
          {wipeArmed && (
            <button
              type="button"
              onClick={() => setWipeArmed(false)}
              className="mt-2 w-full font-mono text-xs tracking-widest text-muted"
            >
              CANCEL
            </button>
          )}
        </section>

        {message && (
          <p className="text-center font-mono text-xs text-muted">{message}</p>
        )}
      </div>
    </div>
  );
}
