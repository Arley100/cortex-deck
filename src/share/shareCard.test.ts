import { describe, expect, it } from "vitest";
import { CARD_FOOTNOTE, cardRows } from "./shareCard";
import type { DrillDelta } from "../app/prepost";

const delta = (over: Partial<DrillDelta>): DrillDelta => ({
  drillId: "stroop",
  name: "Stroop",
  unit: "count",
  pre: 31,
  post: 24,
  pctChange: -23,
  ...over,
});

describe("cardRows", () => {
  it("shows both values and the signed change", () => {
    expect(cardRows([delta({})])).toEqual([
      { name: "Stroop", values: "31  →  24", change: "−23%" },
    ]);
    expect(cardRows([delta({ unit: "ms", pre: 300, post: 280, pctChange: -7 })])[0]?.values).toBe(
      "300 ms  →  280 ms",
    );
    expect(cardRows([delta({ pctChange: 5 })])[0]?.change).toBe("+5%");
  });

  it("marks incomplete drills instead of inventing numbers", () => {
    expect(cardRows([delta({ post: null, pctChange: null })])).toEqual([
      { name: "Stroop", values: "incomplete", change: "" },
    ]);
  });

  it("keeps the card's disclaimer neutral", () => {
    expect(CARD_FOOTNOTE).not.toMatch(/diagnos|\bIQ\b|brain age|—/);
  });
});
