/**
 * FocusForge — Date Helper Utilities
 * All date operations powered by dayjs.
 */

import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isToday_plugin from 'dayjs/plugin/isToday';
import isBetween from 'dayjs/plugin/isBetween';
import relativeTime from 'dayjs/plugin/relativeTime';
import weekday from 'dayjs/plugin/weekday';

dayjs.extend(isoWeek);
dayjs.extend(isToday_plugin);
dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(weekday);

/**
 * Format a date using dayjs.
 * @param {string|Date|dayjs.Dayjs} date - Date to format
 * @param {string} [format='MMM D, YYYY'] - dayjs format string
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'MMM D, YYYY') {
  return dayjs(date).format(format);
}

/**
 * Get today's date as YYYY-MM-DD.
 * @returns {string}
 */
export function getToday() {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Get the number of days until a target date.
 * Returns 0 if the target is today, negative if past.
 * @param {string|Date} targetDate
 * @returns {number}
 */
export function getDaysUntil(targetDate) {
  const target = dayjs(targetDate).startOf('day');
  const today = dayjs().startOf('day');
  return target.diff(today, 'day');
}

/**
 * Get a time-of-day greeting.
 * @returns {string} 'Good morning', 'Good afternoon', or 'Good evening'
 */
export function getGreeting() {
  const hour = dayjs().hour();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Check if a date is today.
 * @param {string|Date|dayjs.Dayjs} date
 * @returns {boolean}
 */
export function isToday(date) {
  return dayjs(date).isToday();
}

/**
 * Check if a date falls within the current ISO week.
 * @param {string|Date|dayjs.Dayjs} date
 * @returns {boolean}
 */
export function isThisWeek(date) {
  const d = dayjs(date);
  const startOfWeek = dayjs().startOf('isoWeek');
  const endOfWeek = dayjs().endOf('isoWeek');
  return d.isBetween(startOfWeek, endOfWeek, 'day', '[]');
}

/**
 * Get the last 7 days as an array (today going back 6 days).
 * @returns {Array<{ date: string, dayLabel: string, dayShort: string, isToday: boolean }>}
 */
export function getWeekDays() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = dayjs().subtract(i, 'day');
    days.push({
      date: d.format('YYYY-MM-DD'),
      dayLabel: d.format('dddd'),
      dayShort: d.format('ddd'),
      isToday: i === 0,
    });
  }
  return days;
}

/**
 * Get all day objects for a calendar month grid.
 * Includes leading days from the previous month and trailing days from next month
 * to fill complete weeks (starting on Monday).
 * @param {number} year  - e.g. 2026
 * @param {number} month - 1–12
 * @returns {Array<{ date: string, day: number, isCurrentMonth: boolean, isToday: boolean, dayOfWeek: number }>}
 */
export function getMonthDays(year, month) {
  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInMonth = firstDay.daysInMonth();
  const todayStr = dayjs().format('YYYY-MM-DD');

  // ISO weekday: Monday=1 ... Sunday=7
  const startDayOfWeek = firstDay.isoWeekday(); // 1-7

  const days = [];

  // Leading days from previous month
  const prevMonth = firstDay.subtract(1, 'month');
  const prevDaysInMonth = prevMonth.daysInMonth();
  for (let i = startDayOfWeek - 1; i > 0; i--) {
    const d = prevDaysInMonth - i + 1;
    const dateStr = prevMonth.date(d).format('YYYY-MM-DD');
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      dayOfWeek: prevMonth.date(d).isoWeekday(),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = firstDay.date(d).format('YYYY-MM-DD');
    days.push({
      date: dateStr,
      day: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      dayOfWeek: firstDay.date(d).isoWeekday(),
    });
  }

  // Trailing days from next month to complete the grid (total should be multiple of 7)
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    const nextMonth = firstDay.add(1, 'month');
    for (let d = 1; d <= remaining; d++) {
      const dateStr = nextMonth.date(d).format('YYYY-MM-DD');
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        dayOfWeek: nextMonth.date(d).isoWeekday(),
      });
    }
  }

  return days;
}

/**
 * Format a duration in minutes into a human-readable string.
 * @param {number} minutes
 * @returns {string} e.g. '2h 30m', '45m', '0m'
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format elapsed seconds into HH:MM:SS for timer display.
 * @param {number} seconds
 * @returns {string} e.g. '01:25:03'
 */
export function formatTime(seconds) {
  if (!seconds || seconds < 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':');
}
