import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef<(() => void) | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    if (!Number.isFinite(delay) || delay < 0) {
      console.error(`useInterval received invalid delay: ${delay}`);
      return;
    }

    const id = window.setInterval(() => {
      savedCallback.current?.();
    }, delay);

    return () => window.clearInterval(id);
  }, [delay]);
}
