import type { DrillDelta } from "../app/prepost";
import { createRng } from "../engine/rng";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const UNIT_LABEL: Record<DrillDelta["unit"], string> = {
  "%": "%",
  ms: " ms",
  count: "",
  span: "",
};

export interface CardRow {
  name: string;
  values: string;
  change: string;
}

/** Text content of the card, kept pure so wording is testable. */
export function cardRows(deltas: DrillDelta[]): CardRow[] {
  return deltas.map((d) => {
    if (d.pre === null || d.post === null) {
      return { name: d.name, values: "incomplete", change: "" };
    }
    const u = UNIT_LABEL[d.unit];
    return {
      name: d.name,
      values: `${d.pre}${u}  →  ${d.post}${u}`,
      change: d.pctChange === null ? "" : `${d.pctChange >= 0 ? "+" : "−"}${Math.abs(d.pctChange)}%`,
    };
  });
}

export const CARD_FOOTNOTE =
  "Same-session comparison of my own two runs. Not a medical or intelligence measure.";

/** Draws the card. Fonts should be loaded before calling (see renderShareCard). */
export function drawShareCard(ctx: CanvasRenderingContext2D, deltas: DrillDelta[], date: Date): void {
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;
  const mono = '"JetBrains Mono Variable", ui-monospace, monospace';
  const sans = '"Space Grotesk Variable", system-ui, sans-serif';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b1530");
  bg.addColorStop(1, "#050913");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, 520);
  glow.addColorStop(0, "rgba(157,123,255,0.28)");
  glow.addColorStop(1, "rgba(157,123,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // seeded constellation so the same session always renders the same card
  const rng = createRng(date.getTime() % 100000);
  const pts = Array.from({ length: 46 }, () => ({ x: rng() * W, y: rng() * H }));
  ctx.lineWidth = 1;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i] as { x: number; y: number };
      const b = pts[j] as { x: number; y: number };
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 150) {
        ctx.strokeStyle = `rgba(157,123,255,${((1 - d / 150) * 0.22).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = "rgba(190,215,255,0.55)";
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // title with the RGB split used across the app
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 64px ${sans}`;
  const title = "CORTEX·DECK";
  ctx.fillStyle = "rgba(47,212,232,0.75)";
  ctx.fillText(title, 72 - 3, 130);
  ctx.fillStyle = "rgba(255,63,216,0.6)";
  ctx.fillText(title, 72 + 3, 130);
  ctx.fillStyle = "#e6ecf7";
  ctx.fillText(title, 72, 130);

  ctx.font = `500 20px ${mono}`;
  ctx.fillStyle = "#8d9dbd";
  const when = date.toISOString().slice(0, 10);
  ctx.fillText(`PRE / POST SESSION  ·  ${when}`, 74, 172);

  ctx.fillStyle = "rgba(47,212,232,0.6)";
  ctx.fillRect(72, 200, W - 144, 1.5);

  const rows = cardRows(deltas);
  const top = 262;
  const step = rows.length > 3 ? 64 : 84;
  rows.forEach((r, i) => {
    const y = top + i * step;
    ctx.font = `600 34px ${sans}`;
    ctx.fillStyle = "#e6ecf7";
    ctx.fillText(r.name, 72, y);
    ctx.font = `600 34px ${mono}`;
    ctx.fillStyle = "#cfe8ff";
    ctx.fillText(r.values, 430, y);
    if (r.change) {
      ctx.font = `700 34px ${mono}`;
      ctx.fillStyle = "#2fd4e8";
      const w = ctx.measureText(r.change).width;
      ctx.fillText(r.change, W - 72 - w, y);
    }
  });

  ctx.font = `400 18px ${mono}`;
  ctx.fillStyle = "#8d9dbd";
  ctx.fillText(CARD_FOOTNOTE, 72, H - 64);
  ctx.fillStyle = "#2fd4e8";
  ctx.fillText("cortexdeck.vercel.app", 72, H - 34);
}

/** Renders the card to a PNG blob, or null where canvas is unavailable. */
export async function renderShareCard(deltas: DrillDelta[], date = new Date()): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  try {
    await Promise.all([
      document.fonts?.load('700 64px "Space Grotesk Variable"'),
      document.fonts?.load('600 34px "JetBrains Mono Variable"'),
    ]);
  } catch {
    // fall back to system fonts
  }
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawShareCard(ctx, deltas, date);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
