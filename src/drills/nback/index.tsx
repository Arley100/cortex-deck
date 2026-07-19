import type { DrillDefinition } from "../../engine/types";
import { mountReactDrill } from "../mount";
import { NBackDrill } from "./NBackDrill";
import { NBACK_DEFAULTS, scoreNBack, type NBackConfig } from "./score";

export { NBACK_DEFAULTS, scoreNBack };
export type { NBackConfig };

export function createNBackDefinition(
  overrides: Partial<NBackConfig> = {},
): DrillDefinition {
  const config = { ...NBACK_DEFAULTS, ...overrides };
  return {
    id: "nback",
    name: "N-Back",
    faculty: "working memory",
    variants: ["2-back", "3-back"],
    run: (ctx) =>
      mountReactDrill(
        ctx,
        <NBackDrill
          config={config}
          onComplete={(events, meta) => ctx.complete(events, meta)}
          onExit={() => ctx.exit?.()}
        />,
      ),
    score: scoreNBack,
  };
}

export const nbackDefinition = createNBackDefinition();
