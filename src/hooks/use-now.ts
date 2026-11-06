import { useEffect, useState } from 'react';

/**
 * Returns the current time, re-rendering at the start of every minute (or at
 * the given interval). Aligning to the minute boundary keeps clocks accurate
 * without re-rendering every second.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const msToBoundary = intervalMs - (Date.now() % intervalMs);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), intervalMs);
    }, msToBoundary);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}
