import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Short-lived feedback state ("ok"/"no" borders and the like) that clears
 * itself after `ms` and never leaks its timer on unmount.
 */
export function useFlash<T>(ms: number) {
  const [flash, setFlash] = useState<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const trigger = useCallback(
    (value: T) => {
      setFlash(value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFlash(null), ms);
    },
    [ms],
  );

  return [flash, trigger] as const;
}
