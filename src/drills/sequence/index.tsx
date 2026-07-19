import type { DrillDefinition } from "../../engine/types";
import { mountReactDrill } from "../mount";
import { SequenceDrill } from "./SequenceDrill";
import { scoreSequence, SEQUENCE_DEFAULTS, type SequenceConfig } from "./score";

export { scoreSequence, SEQUENCE_DEFAULTS };
export type { SequenceConfig };

export function createSequenceDefinition(
  overrides: Partial<SequenceConfig> = {},
): DrillDefinition {
  const config = { ...SEQUENCE_DEFAULTS, ...overrides };
  return {
    id: "sequence",
    name: "Sequence",
    faculty: "memory span",
    run: (ctx) =>
      mountReactDrill(
        ctx,
        <SequenceDrill
          config={config}
          onComplete={(events, meta) => ctx.complete(events, meta)}
          onExit={() => ctx.exit?.()}
        />,
      ),
    score: scoreSequence,
  };
}

export const sequenceDefinition = createSequenceDefinition();
