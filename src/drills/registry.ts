import type { DrillDefinition, DrillId } from "../engine/types";
import type { Accent } from "../components/accent";
import { nbackDefinition } from "./nback";
import { stroopDefinition } from "./stroop";
import { sequenceDefinition } from "./sequence";
import { mathSprintDefinition } from "./mathsprint";
import { reactionDefinition } from "./reaction";
import { goNoGoDefinition } from "./gonogo";

export interface DrillEntry {
  definition: DrillDefinition;
  accent: Accent;
  glyph: string;
  /** variant keys runs are recorded under; "default" for single-variant drills */
  variantKeys: string[];
}

export const DRILLS: DrillEntry[] = [
  { definition: nbackDefinition, accent: "cyan", glyph: "◉", variantKeys: ["2-back", "3-back"] },
  { definition: stroopDefinition, accent: "violet", glyph: "▲", variantKeys: ["default"] },
  { definition: sequenceDefinition, accent: "green", glyph: "◆", variantKeys: ["default"] },
  { definition: mathSprintDefinition, accent: "amber", glyph: "✦", variantKeys: ["default"] },
  { definition: reactionDefinition, accent: "rose", glyph: "⚡", variantKeys: ["default"] },
  { definition: goNoGoDefinition, accent: "blue", glyph: "⊘", variantKeys: ["default"] },
];

export function drillEntry(id: DrillId): DrillEntry {
  const entry = DRILLS.find((d) => d.definition.id === id);
  if (!entry) throw new Error(`unknown drill ${id}`);
  return entry;
}
