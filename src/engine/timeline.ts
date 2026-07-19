/**
 * Tracked timer container. Every pending timeout lives in one place so a
 * single cancel() call cleans the whole drill up on exit or unmount; drills
 * never own raw setTimeout chains.
 */
export interface Timeline {
  after(ms: number, fn: () => void): void;
  every(ms: number, fn: () => void): void;
  cancel(): void;
  readonly cancelled: boolean;
}

export function createTimeline(): Timeline {
  const timeouts = new Set<ReturnType<typeof setTimeout>>();
  const intervals = new Set<ReturnType<typeof setInterval>>();
  let cancelled = false;

  return {
    after(ms, fn) {
      if (cancelled) return;
      const id = setTimeout(() => {
        timeouts.delete(id);
        fn();
      }, ms);
      timeouts.add(id);
    },
    every(ms, fn) {
      if (cancelled) return;
      const id = setInterval(fn, ms);
      intervals.add(id);
    },
    cancel() {
      cancelled = true;
      timeouts.forEach(clearTimeout);
      intervals.forEach(clearInterval);
      timeouts.clear();
      intervals.clear();
    },
    get cancelled() {
      return cancelled;
    },
  };
}
