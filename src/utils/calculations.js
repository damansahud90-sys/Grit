/**
 * FocusForge — Calculation Utilities
 * Pure functions for analytics, progress tracking, and chart data.
 */

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

/**
 * Calculate daily efficiency as a percentage.
 * @param {number} actualMinutes - Minutes actually studied
 * @param {number} targetMinutes - Target minutes for the day
 * @returns {number} Efficiency percentage (0–100+, uncapped)
 */
export function calcDailyEfficiency(actualMinutes, targetMinutes) {
  if (!targetMinutes || targetMinutes <= 0) return 0;
  return Math.round((actualMinutes / targetMinutes) * 100);
}

/**
 * Calculate session efficiency (focused time vs total elapsed).
 * @param {number} focusedTime - Active focused time in seconds or minutes
 * @param {number} totalTime   - Total elapsed time in same unit
 * @returns {number} Efficiency percentage (0–100)
 */
export function calcSessionEfficiency(focusedTime, totalTime) {
  if (!totalTime || totalTime <= 0) return 0;
  return Math.min(100, Math.round((focusedTime / totalTime) * 100));
}

/**
 * Calculate study streak from session data.
 * Sessions must have a `startTime` or `endTime` field parsable by dayjs.
 * @param {Array} sessions - Array of session objects
 * @returns {{ current: number, longest: number }}
 */
export function calcStreak(sessions) {
  if (!sessions || sessions.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Collect unique study dates, sorted descending
  const dateSet = new Set();
  sessions.forEach((s) => {
    const d = dayjs(s.startTime || s.endTime);
    if (d.isValid()) {
      dateSet.add(d.format('YYYY-MM-DD'));
    }
  });

  const sortedDates = [...dateSet].sort((a, b) => (a > b ? -1 : 1));

  if (sortedDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Calculate current streak (from today backward)
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  let current = 0;
  // Streak is valid if the most recent session day is today or yesterday
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    let checkDate = sortedDates[0] === today ? dayjs() : dayjs().subtract(1, 'day');
    for (const dateStr of sortedDates) {
      if (dateStr === checkDate.format('YYYY-MM-DD')) {
        current++;
        checkDate = checkDate.subtract(1, 'day');
      } else if (dateStr < checkDate.format('YYYY-MM-DD')) {
        break;
      }
    }
  }

  // Calculate longest streak over all dates
  let longest = 1;
  let streak = 1;
  const ascDates = [...sortedDates].sort();
  for (let i = 1; i < ascDates.length; i++) {
    const prev = dayjs(ascDates[i - 1]);
    const curr = dayjs(ascDates[i]);
    if (curr.diff(prev, 'day') === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  longest = Math.max(longest, current);

  return { current, longest };
}

/**
 * Calculate progress percentage.
 * @param {number} logged  - Logged amount (minutes, hours, etc.)
 * @param {number} target  - Target amount in same unit
 * @returns {number} Progress percentage capped at 100
 */
export function calcProgressPercent(logged, target) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((logged / target) * 100));
}

/**
 * Calculate total hours studied for a given subject.
 * @param {Array}  sessions   - Array of session objects
 * @param {string} subjectKey - Subject key to filter by
 * @returns {number} Total hours (rounded to 1 decimal)
 */
export function calcSubjectHours(sessions, subjectKey) {
  if (!sessions || sessions.length === 0) return 0;

  const totalMinutes = sessions
    .filter((s) => s.subject === subjectKey)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  return Math.round((totalMinutes / 60) * 10) / 10;
}

/**
 * Calculate total hours studied on a specific date.
 * @param {Array}  sessions - Array of session objects
 * @param {string} date     - Date string in YYYY-MM-DD format
 * @returns {number} Total hours (rounded to 1 decimal)
 */
export function calcDailyHours(sessions, date) {
  if (!sessions || sessions.length === 0) return 0;

  const targetDate = dayjs(date).format('YYYY-MM-DD');
  const totalMinutes = sessions
    .filter((s) => {
      const sessionDate = dayjs(s.startTime || s.endTime).format('YYYY-MM-DD');
      return sessionDate === targetDate;
    })
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  return Math.round((totalMinutes / 60) * 10) / 10;
}

/**
 * Calculate weekly data for a chart — last 7 days.
 * @param {Array} sessions - Array of session objects
 * @returns {Array<{ date: string, dayLabel: string, hours: number, minutes: number }>}
 */
export function calcWeeklyData(sessions) {
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const day = dayjs().subtract(i, 'day');
    const dateStr = day.format('YYYY-MM-DD');
    const dayLabel = day.format('ddd');

    const totalMinutes = (sessions || [])
      .filter((s) => {
        const sd = dayjs(s.startTime || s.endTime).format('YYYY-MM-DD');
        return sd === dateStr;
      })
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    days.push({
      date: dateStr,
      dayLabel,
      hours: Math.round((totalMinutes / 60) * 10) / 10,
      minutes: totalMinutes,
    });
  }

  return days;
}

/**
 * Generate monthly heatmap data.
 * @param {Array}  sessions - Array of session objects
 * @param {number} year     - Year (e.g. 2026)
 * @param {number} month    - Month (1–12)
 * @returns {Array<{ date: string, day: number, hours: number, intensity: number }>}
 *   intensity is 0–4 based on hours: 0 = none, 1 = light, 2 = moderate, 3 = heavy, 4 = extreme
 */
export function calcMonthlyHeatmap(sessions, year, month) {
  const startOfMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = startOfMonth.daysInMonth();
  const result = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = startOfMonth.date(d).format('YYYY-MM-DD');

    const totalMinutes = (sessions || [])
      .filter((s) => {
        const sd = dayjs(s.startTime || s.endTime).format('YYYY-MM-DD');
        return sd === dateStr;
      })
      .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    const hours = Math.round((totalMinutes / 60) * 10) / 10;

    let intensity = 0;
    if (hours > 0 && hours < 2) intensity = 1;
    else if (hours >= 2 && hours < 4) intensity = 2;
    else if (hours >= 4 && hours < 6) intensity = 3;
    else if (hours >= 6) intensity = 4;

    result.push({ date: dateStr, day: d, hours, intensity });
  }

  return result;
}

/**
 * Calculate hourly distribution of study time for a given date.
 * Useful for visualizing which hours of the day the user studies most.
 * @param {Array}  sessions - Array of session objects
 * @param {string} date     - Date string in YYYY-MM-DD format
 * @returns {Array<{ hour: number, label: string, minutes: number }>} 24 entries for hours 0–23
 */
export function calcHourlyDistribution(sessions, date) {
  const hourly = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${String(i).padStart(2, '0')}:00`,
    minutes: 0,
  }));

  const targetDate = dayjs(date).format('YYYY-MM-DD');

  (sessions || []).forEach((s) => {
    const start = dayjs(s.startTime);
    if (!start.isValid()) return;
    if (start.format('YYYY-MM-DD') !== targetDate) return;

    const startHour = start.hour();
    const duration = s.durationMinutes || 0;

    // Distribute minutes across hours if session spans multiple hours
    let remaining = duration;
    let currentHour = startHour;
    let minuteInHour = start.minute();

    while (remaining > 0 && currentHour < 24) {
      const availableInHour = 60 - minuteInHour;
      const allocated = Math.min(remaining, availableInHour);
      hourly[currentHour].minutes += allocated;
      remaining -= allocated;
      currentHour++;
      minuteInHour = 0;
    }
  });

  return hourly;
}
