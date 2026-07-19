import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App shell", () => {
  it("renders the title and all six drill cards with status chips", async () => {
    render(<App />);
    expect(screen.getByRole("heading")).toHaveTextContent("CORTEX·DECK");
    expect(await screen.findByText("N-Back")).toBeInTheDocument();
    for (const name of ["Stroop", "Sequence", "Math Sprint", "Reaction", "Go / No-Go"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    // with an empty database every drill is calibrating
    expect(screen.getAllByText("calibrating: 0/3")).toHaveLength(6);
  });
});
