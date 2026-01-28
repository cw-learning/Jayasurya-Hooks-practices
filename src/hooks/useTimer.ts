import { useState, useRef, useCallback, useEffect } from 'react';
import { Timer } from '../types/timer';
import { timerApi } from '../api/timerApi';

export type UseTimerResult = {
  timer: Timer;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  reset: () => Promise<void>;
};

export function useTimer(initialTimer: Timer): UseTimerResult {
  const [timer, setTimer] = useState<Timer>(initialTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timerRef = useRef(initialTimer);
  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  const isRunningRef = useRef(initialTimer.isRunning);
  useEffect(() => {
    isRunningRef.current = timer.isRunning;
  }, [timer.isRunning]);

  const clearTimerInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (isRunningRef.current || intervalRef.current !== null) return;

    setTimer(prev => ({ ...prev, isRunning: true }));

    intervalRef.current = setInterval(() => {
      setTimer(prev => ({ ...prev, elapsed: prev.elapsed + 1 }));
    }, 1000);

    try {
      await timerApi.updateTimer(timerRef.current.id, { isRunning: true });
    } catch (error) {
      console.error('Failed to update timer:', error);
    }
  }, []);

  const pause = useCallback(async () => {
    clearTimerInterval();
    setTimer(prev => ({ ...prev, isRunning: false }));
    const { id, elapsed } = timerRef.current;
    try {
      await timerApi.updateTimer(id, { isRunning: false, elapsed });
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  }, [clearTimerInterval]);

  // Sync timer state from prop when timer object changes
  useEffect(() => {
    setTimer(initialTimer);
  }, [initialTimer]);

  // Reconciler effect: manage interval based on timer state
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

  const reset = useCallback(async () => {
    clearTimerInterval();
    setTimer(prev => ({ ...prev, elapsed: 0, isRunning: false }));
    try {
      await timerApi.updateTimer(timerRef.current.id, { elapsed: 0, isRunning: false });
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  }, [clearTimerInterval]);

  useEffect(() => {
    return clearTimerInterval;
  }, [clearTimerInterval]);

  return { timer, start, pause, reset };
}
