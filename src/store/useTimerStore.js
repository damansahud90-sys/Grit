/**
 * Grit — Timer Store
 * Zustand store with persist middleware for timer state.
 * Uses timestamp-based elapsed calculation so the timer survives
 * navigation, component unmounts, and screen-off scenarios.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useTimerStore = create(
  persist(
    (set, get) => ({
      // ─── Timer State ───────────────────────────────
      isRunning: false,
      isPaused: false,
      startTime: null,       // timestamp when timer started (Date.now())
      pauseTime: null,       // timestamp when paused
      totalPausedMs: 0,      // accumulated pause duration in ms
      duration: null,         // target duration in seconds (null = count-up/infinite)

      // ─── Context ───────────────────────────────────
      taskId: null,           // optional associated task

      // ─── Actions ───────────────────────────────────
      startTimer: (duration = null, taskId = null) => {
        set({
          isRunning: true,
          isPaused: false,
          startTime: Date.now(),
          pauseTime: null,
          totalPausedMs: 0,
          duration,
          taskId,
        });
      },

      pauseTimer: () => {
        const { isRunning, isPaused } = get();
        if (!isRunning || isPaused) return;
        set({
          isPaused: true,
          pauseTime: Date.now(),
        });
      },

      resumeTimer: () => {
        const { isRunning, isPaused, pauseTime, totalPausedMs } = get();
        if (!isRunning || !isPaused) return;
        const additionalPaused = pauseTime ? Date.now() - pauseTime : 0;
        set({
          isPaused: false,
          pauseTime: null,
          totalPausedMs: totalPausedMs + additionalPaused,
        });
      },

      stopTimer: () => {
        const state = get();
        const elapsedSeconds = get().getElapsedSeconds();
        const { taskId } = state;

        // Reset all timer state
        set({
          isRunning: false,
          isPaused: false,
          startTime: null,
          pauseTime: null,
          totalPausedMs: 0,
          duration: null,
          taskId: null,
        });

        return { elapsedSeconds, taskId };
      },

      resetTimer: () => {
        set({
          isRunning: false,
          isPaused: false,
          startTime: null,
          pauseTime: null,
          totalPausedMs: 0,
          duration: null,
          taskId: null,
        });
      },

      setDuration: (seconds) => {
        set({ duration: seconds });
      },

      setTaskId: (id) => {
        set({ taskId: id });
      },

      // ─── Computed ──────────────────────────────────
      getElapsedSeconds: () => {
        const { isRunning, isPaused, startTime, pauseTime, totalPausedMs } = get();

        if (!isRunning && !isPaused) return 0;
        if (!startTime) return 0;

        if (isPaused && pauseTime) {
          // Frozen at the moment of pause
          return Math.floor((pauseTime - startTime - totalPausedMs) / 1000);
        }

        // Currently running
        return Math.floor((Date.now() - startTime - totalPausedMs) / 1000);
      },
    }),
    {
      name: 'grit-timer',
      version: 1,
    }
  )
);

export default useTimerStore;
