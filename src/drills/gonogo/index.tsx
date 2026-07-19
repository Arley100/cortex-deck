import type { DrillDefinition } from "../../engine/types";
import { mountReactDrill } from "../mount";
import { GoNoGoDrill } from "./GoNoGoDrill";
import { GONOGO_DEFAULTS, scoreGoNoGo, type GoNoGoConfig } from "./score";

export { GONOGO_DEFAULTS, scoreGoNoGo };
export type { GoNoGoConfig };

export function createGoNoGoDefinition(
  overrides: Partial<GoNoGoConfig> = {},
): DrillDefinition {
  const config = { ...GONOGO_DEFAULTS, ...overrides };
  return {
    id: "gonogo",
    name: "Go / No-Go",
    faculty: "response inhibition",
    run: (ctx) =>
      mountReactDrill(
        ctx,
        <GoNoGoDrill
          config={config}
          onComplete={(events, meta) => ctx.complete(events, meta)}
          onExit={() => ctx.exit?.()}
        />,
      ),
    score: scoreGoNoGo,
  };
}

export const goNoGoDefinition = createGoNoGoDefinition();
