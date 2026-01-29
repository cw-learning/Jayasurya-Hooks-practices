import { useState, useRef, useCallback, useEffect } from 'react';
import type { Timer } from '../types/timer';
import { timerApi } from '../api/timerApi';

export type UseTimerResult = {
  timer: Timer;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  reset: () => Promise<void>;
  error: string | null;
};

export function useTimer(initialTimer: Timer): UseTimerResult {
  const [timer, setTimer] = useState<Timer>(initialTimer);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isStartingRef = useRef(false);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    setTimer(initialTimer);
  }, [initialTimer]);

  useEffect(() => {
    if (!timer.isRunning) {
      clearTimerInterval();
      return;
    }
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => ({ ...prev, elapsed: prev.elapsed + 1 }));
      }, 1000);
    }
  }, [timer.isRunning, clearTimerInterval]);

  const start = useCallback(async () => {
    if (timer.isRunning || intervalRef.current !== null || isStartingRef.current) return;
    isStartingRef.current = true;
    setTimer(prev => ({ ...prev, isRunning: true }));
    try {
      await timerApi.updateTimer(timer.id, { isRunning: true });
      setError(null);
    } catch {
      setError('Failed to start timer');
    } finally {
      isStartingRef.current = false;
    }
  }, [timer, intervalRef]);

  const pause = useCallback(async () => {
    clearTimerInterval();
    setTimer(prev => ({ ...prev, isRunning: false }));
    try {
      await timerApi.updateTimer(timer.id, { isRunning: false, elapsed: timer.elapsed });
      setError(null);
    } catch {
      setError('Failed to pause timer');
    }
  }, [timer, clearTimerInterval]);

  const reset = useCallback(async () => {
    clearTimerInterval();
    setTimer(prev => ({ ...prev, elapsed: 0, isRunning: false }));
    try {
      await timerApi.updateTimer(timer.id, { elapsed: 0, isRunning: false });
      setError(null);
    } catch {
      setError('Failed to reset timer');
    }
  }, [timer, clearTimerInterval]);

  useEffect(() => {
    return clearTimerInterval;
  }, [clearTimerInterval]);

  return { timer, start, pause, reset, error };
}
