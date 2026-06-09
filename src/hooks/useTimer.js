/**
 * Grit — useTimer Hook
 * Thin wrapper around the timer Zustand store.
 * Provides a ticking `elapsed` value for UI re-rendering, handles
 * visibility-change recalculation, and auto-stops countdown timers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useTimerStore from '../store/useTimerStore';

/**
 * @returns {{
 *   elapsed: number,
 *   isRunning: boolean,
 *   isPaused: boolean,
 *   duration: number|null,
 *   taskId: string|null,
 *   start: (durationSeconds?: number|null, taskId?: string|null) => void,
 *   pause: () => void,
 *   resume: () => void,
 *   stop: () => { elapsedSeconds: number, taskId: string|null },
 *   reset: () => void,
 *   setDuration: (seconds: number|null) => void,
 *   setTaskId: (id: string|null) => void,
 * }}
 */
export default function useTimer() {
  const isRunning = useTimerStore((s) => s.isRunning);
  const isPaused = useTimerStore((s) => s.isPaused);
  const duration = useTimerStore((s) => s.duration);
  const taskId = useTimerStore((s) => s.taskId);
  const getElapsedSeconds = useTimerStore((s) => s.getElapsedSeconds);

  const startTimer = useTimerStore((s) => s.startTimer);
  const pauseTimer = useTimerStore((s) => s.pauseTimer);
  const resumeTimer = useTimerStore((s) => s.resumeTimer);
  const stopTimer = useTimerStore((s) => s.stopTimer);
  const resetTimer = useTimerStore((s) => s.resetTimer);
  const setDurationStore = useTimerStore((s) => s.setDuration);
  const setTaskIdStore = useTimerStore((s) => s.setTaskId);

  const [elapsed, setElapsed] = useState(() => getElapsedSeconds());

  // Ref to track whether we've already auto-stopped this countdown
  const autoStoppedRef = useRef(false);

  // Reset the auto-stop flag when a new timer starts
  useEffect(() => {
    if (isRunning) {
      autoStoppedRef.current = false;
    }
  }, [isRunning]);

  // ─── Tick every second to update local elapsed ───
  useEffect(() => {
    if (!isRunning && !isPaused) {
      setElapsed(0);
      return;
    }

    // Immediately sync
    setElapsed(getElapsedSeconds());

    if (isPaused) return; // No ticking while paused

    const id = setInterval(() => {
      setElapsed(getElapsedSeconds());
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, isPaused, getElapsedSeconds]);

  // ─── Auto-stop when countdown completes ───
  useEffect(() => {
    if (
      isRunning &&
      !isPaused &&
      duration !== null &&
      elapsed >= duration &&
      !autoStoppedRef.current
    ) {
      autoStoppedRef.current = true;
      // Defer to next tick to avoid state-update-in-render
      setTimeout(() => {
        stopTimer();
      }, 0);
    }
  }, [isRunning, isPaused, duration, elapsed, stopTimer]);

  // ─── Visibility change: recalculate when app comes back ───
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        setElapsed(getElapsedSeconds());
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, getElapsedSeconds]);

  // ─── Stable action wrappers ───
  const start = useCallback(
    (durationSeconds = null, tid = null) => {
      startTimer(durationSeconds, tid);
    },
    [startTimer]
  );

  const pause = useCallback(() => pauseTimer(), [pauseTimer]);
  const resume = useCallback(() => resumeTimer(), [resumeTimer]);
  const stop = useCallback(() => stopTimer(), [stopTimer]);
  const reset = useCallback(() => resetTimer(), [resetTimer]);
  const setDuration = useCallback((s) => setDurationStore(s), [setDurationStore]);
  const setTaskId = useCallback((id) => setTaskIdStore(id), [setTaskIdStore]);

  return {
    elapsed,
    isRunning,
    isPaused,
    duration,
    taskId,
    start,
    pause,
    resume,
    stop,
    reset,
    setDuration,
    setTaskId,
  };
}
