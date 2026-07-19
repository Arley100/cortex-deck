import { useCallback, useEffect, useRef } from "react";

interface Cancellable {
  cancel: () => void;
}

/**
 * Holds the active scheduler handle for a drill run. Replacing the handle
 * cancels the previous one; unmounting cancels whatever is pending, so no
 * drill can leak timers.
 */
export function useRunHandle() {
  const ref = useRef<Cancellable | null>(null);
  useEffect(
    () => () => {
      ref.current?.cancel();
      ref.current = null;
    },
    [],
  );
  return useCallback((handle: Cancellable | null) => {
    ref.current?.cancel();
    ref.current = handle;
  }, []);
}
