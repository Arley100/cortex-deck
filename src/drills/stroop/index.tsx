import type { DrillDefinition } from "../../engine/types";
import { mountReactDrill } from "../mount";
import { StroopDrill } from "./StroopDrill";
import { createScoreStroop, STROOP_DEFAULTS, type StroopConfig } from "./score";

export { createScoreStroop, STROOP_DEFAULTS };
export type { StroopConfig };

export function createStroopDefinition(
  overrides: Partial<StroopConfig> = {},
): DrillDefinition {
  const config = { ...STROOP_DEFAULTS, ...overrides };
  return {
    id: "stroop",
    name: "Stroop",
    faculty: "attention · inhibition",
    run: (ctx) =>
      mountReactDrill(
        ctx,
        <StroopDrill
          config={config}
          onComplete={(events, meta) => ctx.complete(events, meta)}
          onExit={() => ctx.exit?.()}
        />,
      ),
    score: createScoreStroop(config.seconds),
  };
}

export const stroopDefinition = createStroopDefinition();
