import type { DrillDefinition } from "../../engine/types";
import { mountReactDrill } from "../mount";
import { MathSprintDrill } from "./MathSprintDrill";
import {
  MATHSPRINT_DEFAULTS,
  scoreMathSprint,
  type MathSprintConfig,
} from "./score";

export { MATHSPRINT_DEFAULTS, scoreMathSprint };
export type { MathSprintConfig };

export function createMathSprintDefinition(
  overrides: Partial<MathSprintConfig> = {},
): DrillDefinition {
  const config = { ...MATHSPRINT_DEFAULTS, ...overrides };
  return {
    id: "mathsprint",
    name: "Math Sprint",
    faculty: "processing speed",
    run: (ctx) =>
      mountReactDrill(
        ctx,
        <MathSprintDrill
          config={config}
          onComplete={(events, meta) => ctx.complete(events, meta)}
          onExit={() => ctx.exit?.()}
        />,
      ),
    score: scoreMathSprint,
  };
}

export const mathSprintDefinition = createMathSprintDefinition();
