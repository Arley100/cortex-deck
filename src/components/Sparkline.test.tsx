import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkline } from "./Sparkline";
import { sparkGeometry } from "./sparkGeometry";

describe("sparkGeometry", () => {
  it("returns nothing for an empty series", () => {
    expect(sparkGeometry([], null, true, 100, 40).last).toBeNull();
  });

  it("puts better values higher for both metric directions", () => {
    const up = sparkGeometry([10, 20], null, true, 100, 40);
    expect(up.last!.y).toBeLessThan(36); // 20 is the max, near the top
    expect(up.last!.y).toBe(4);
    const down = sparkGeometry([300, 200], null, false, 100, 40);
    // 200 ms is better than 300 ms, so it is drawn at the top
    expect(down.last!.y).toBe(4);
  });

  it("includes the baseline in the scale and centers a single point", () => {
    const g = sparkGeometry([50], 40, true, 100, 40);
    expect(g.last!.x).toBe(50);
    expect(g.baselineY).toBe(36);
  });

  it("handles a flat series without dividing by zero", () => {
    const g = sparkGeometry([5, 5, 5], 5, true, 100, 40);
    expect(Number.isFinite(g.last!.y)).toBe(true);
    expect(g.path).not.toMatch(/NaN|Infinity/);
  });
});

describe("Sparkline", () => {
  it("renders an accessible svg, or a placeholder with no runs", () => {
    const { rerender } = render(
      <Sparkline points={[1, 2, 3]} baseline={2} higherIsBetter color="red" label="trend" />,
    );
    expect(screen.getByRole("img", { name: "trend" })).toBeInTheDocument();
    rerender(<Sparkline points={[]} baseline={null} higherIsBetter color="red" label="trend" />);
    expect(screen.getByText("no runs yet")).toBeInTheDocument();
  });
});
