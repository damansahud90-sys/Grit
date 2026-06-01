/**
 * FocusForge — useStreak Hook
 * Calculates the current and longest study streaks from session data.
 * A streak is consecutive days (including today) with at least one session.
 */

import { useMemo } from 'react';
import useTaskStore from '../store/useTaskStore';
import { calcStreak } from '../utils/calculations';

/**
 * @returns {{ currentStreak: number, longestStreak: number }}
 */
export default function useStreak() {
  const sessions = useTaskStore((state) => state.sessions);

  const streakData = useMemo(() => {
    const result = calcStreak(sessions);
    return {
      currentStreak: result.current,
      longestStreak: result.longest,
    };
  }, [sessions]);

  return streakData;
}
