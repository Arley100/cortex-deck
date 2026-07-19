import { createRoot } from "react-dom/client";
import type { ReactElement } from "react";
import type { DrillContext } from "../engine/types";

/**
 * Standard run() implementation for React drills: render into the host
 * container and hand the host an unmount callback. The unmount is deferred a
 * tick so tearing down from inside a parent render commit is safe.
 */
export function mountReactDrill(ctx: DrillContext, element: ReactElement): void {
  const root = createRoot(ctx.container);
  root.render(element);
  ctx.registerCleanup?.(() => {
    setTimeout(() => root.unmount(), 0);
  });
}
