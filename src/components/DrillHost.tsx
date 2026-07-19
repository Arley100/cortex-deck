import { useEffect, useRef } from "react";
import type { DrillDefinition, RunMeta, TrialEvent } from "../engine/types";

interface DrillHostProps {
  definition: DrillDefinition;
  variant?: string;
  onComplete: (events: TrialEvent[], meta: RunMeta | undefined) => void;
  onExit: () => void;
}

/**
 * Mounts a drill through its DrillDefinition.run contract and tears it down
 * when the host unmounts.
 */
export function DrillHost({ definition, variant, onComplete, onExit }: DrillHostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  const onExitRef = useRef(onExit);
  onCompleteRef.current = onComplete;
  onExitRef.current = onExit;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cleanup: (() => void) | null = null;
    definition.run({
      container,
      variant,
      complete: (events, meta) => onCompleteRef.current(events, meta),
      exit: () => onExitRef.current(),
      registerCleanup: (fn) => {
        cleanup = fn;
      },
    });
    return () => cleanup?.();
  }, [definition, variant]);

  return <div ref={containerRef} className="flex flex-1 flex-col" />;
}
