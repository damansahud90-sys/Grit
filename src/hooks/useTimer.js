/**
 * FocusForge — useTimer Hook
 * Full-featured timer with Pomodoro cycling support.
 *
 * Phases: focus → shortBreak → focus → shortBreak → ... → longBreak (after 4 focus rounds)
 * Tracks pause durations for efficiency calculation.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import useSettingsStore from '../store/useSettingsStore';

/**
 * @returns {{
 *   elapsed: number,
 *   isRunning: boolean,
 *   isPaused: boolean,
 *   phase: 'focus' | 'shortBreak' | 'longBreak',
 *   pomodoroRound: number,
 *   start: () => void,
 *   pause: () => void,
 *   resume: () => void,
 *   stop: () => { totalElapsed: number, focusedTime: number, pausedTime: number, pomodoroRounds: number },
 *   reset: () => void,
 *   pomodoroEnabled: boolean,
 *   togglePomodoro: () => void,
 * }}
 */
export default function useTimer() {
  const pomodoroFocus = useSettingsStore((s) => s.pomodoroFocus);
  const pomodoroShortBreak = useSettingsStore((s) => s.pomodoroShortBreak);
  const pomodoroLongBreak = useSettingsStore((s) => s.pomodoroLongBreak);

  const [elapsed, setElapsed] = useState(0); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState('focus'); // 'focus' | 'shortBreak' | 'longBreak'
  const [pomodoroRound, setPomodoroRound] = useState(1); // 1-based, which focus round we're on
  const [pomodoroEnabled, setPomodoroEnabled] = useState(true);

  // Refs for interval and timing tracking
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalPausedRef = useRef(0); // total paused duration in ms
  const pauseStartRef = useRef(null); // when the current pause started
  const focusTimeRef = useRef(0); // total focused seconds (only during 'focus' phase)

  // Get the current phase duration in seconds
  const getPhaseDuration = useCallback(
    (currentPhase) => {
      switch (currentPhase) {
        case 'focus':
          return pomodoroFocus * 60;
        case 'shortBreak':
          return pomodoroShortBreak * 60;
        case 'longBreak':
          return pomodoroLongBreak * 60;
        default:
          return pomodoroFocus * 60;
      }
    },
    [pomodoroFocus, pomodoroShortBreak, pomodoroLongBreak]
  );

  // Advance to next Pomodoro phase
  const advancePhase = useCallback(() => {
    if (phase === 'focus') {
      // After a focus round, go to break
      if (pomodoroRound % 4 === 0) {
        setPhase('longBreak');
      } else {
        setPhase('shortBreak');
      }
    } else {
      // After any break, start a new focus round
      if (phase === 'longBreak' || phase === 'shortBreak') {
        const nextRound = phase === 'shortBreak' ? pomodoroRound + 1 : pomodoroRound + 1;
        setPomodoroRound(nextRound);
      }
      setPhase('focus');
    }
    setElapsed(0);
  }, [phase, pomodoroRound]);

  // Core tick effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;

          // Track focused time
          if (phase === 'focus') {
            focusTimeRef.current += 1;
          }

          // Check Pomodoro phase completion
          if (pomodoroEnabled) {
            const phaseDuration = getPhaseDuration(phase);
            if (next >= phaseDuration) {
              // Phase complete — schedule advance on next tick to avoid state issues
              setTimeout(() => advancePhase(), 0);
              return phaseDuration; // cap at phase duration
            }
          }

          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, phase, pomodoroEnabled, getPhaseDuration, advancePhase]);

  const start = useCallback(() => {
    setElapsed(0);
    setIsRunning(true);
    setIsPaused(false);
    setPhase('focus');
    setPomodoroRound(1);
    startTimeRef.current = Date.now();
    totalPausedRef.current = 0;
    pauseStartRef.current = null;
    focusTimeRef.current = 0;
  }, []);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
    pauseStartRef.current = Date.now();
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (!isRunning || !isPaused) return;
    if (pauseStartRef.current) {
      totalPausedRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setIsPaused(false);
  }, [isRunning, isPaused]);

  const stop = useCallback(() => {
    // Capture final paused time if currently paused
    if (isPaused && pauseStartRef.current) {
      totalPausedRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }

    const totalElapsedMs = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;
    const totalElapsedSec = Math.floor(totalElapsedMs / 1000);
    const pausedSec = Math.floor(totalPausedRef.current / 1000);
    const focusedSec = focusTimeRef.current;

    setIsRunning(false);
    setIsPaused(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return {
      totalElapsed: totalElapsedSec,
      focusedTime: focusedSec,
      pausedTime: pausedSec,
      pomodoroRounds: pomodoroRound,
    };
  }, [isPaused, pomodoroRound]);

  const reset = useCallback(() => {
    setElapsed(0);
    setIsRunning(false);
    setIsPaused(false);
    setPhase('focus');
    setPomodoroRound(1);
    startTimeRef.current = null;
    totalPausedRef.current = 0;
    pauseStartRef.current = null;
    focusTimeRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const togglePomodoro = useCallback(() => {
    setPomodoroEnabled((prev) => !prev);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    elapsed,
    isRunning,
    isPaused,
    phase,
    pomodoroRound,
    start,
    pause,
    resume,
    stop,
    reset,
    pomodoroEnabled,
    togglePomodoro,
  };
}
