import type { DrillDefinition } from "../../engine/types";
import { mountReactDrill } from "../mount";
import { ReactionDrill } from "./ReactionDrill";
import { REACTION_DEFAULTS, scoreReaction, type ReactionConfig } from "./score";

export { REACTION_DEFAULTS, scoreReaction };
export type { ReactionConfig };

export function createReactionDefinition(
  overrides: Partial<ReactionConfig> = {},
): DrillDefinition {
  const config = { ...REACTION_DEFAULTS, ...overrides };
  return {
    id: "reaction",
    name: "Reaction",
    faculty: "response time",
    run: (ctx) =>
      mountReactDrill(
        ctx,
        <ReactionDrill
          config={config}
          onComplete={(events, meta) => ctx.complete(events, meta)}
          onExit={() => ctx.exit?.()}
        />,
      ),
    score: scoreReaction,
  };
}

export const reactionDefinition = createReactionDefinition();
