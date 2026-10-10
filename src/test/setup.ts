import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// jsdom has no IndexedDB; storage-backed components run against this fake
import "fake-indexeddb/auto";

// jsdom has no 2D canvas; components treat a null context as "draw nothing"
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

// vitest runs without globals, so RTL cannot register its own auto-cleanup;
// unmount after every test so component timers never outlive the test
afterEach(() => {
  cleanup();
});
