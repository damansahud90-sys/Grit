/**
 * Grit — Achievement Badges
 * 7 badges that reward consistent and dedicated productivity.
 */

export const BADGES = [
  {
    id: 'first-flame',
    name: 'First Flame',
    emoji: '🔥',
    description: 'Complete your very first study session.',
    trigger: 'Complete 1 study session',
  },
  {
    id: '7-day-streak',
    name: '7-Day Streak',
    emoji: '⚡',
    description: 'Study every day for 7 consecutive days.',
    trigger: 'Maintain a 7-day study streak',
  },
  {
    id: 'diamond-focus',
    name: 'Diamond Focus',
    emoji: '💎',
    description: 'Log a single focus session of 2 hours or more.',
    trigger: 'Complete a single session ≥ 120 minutes',
  },
  {
    id: 'subject-master',
    name: 'Subject Master',
    emoji: '🎓',
    description: 'Accumulate 50+ hours in any single subject.',
    trigger: 'Log ≥ 50 hours in one subject',
  },
  {
    id: 'century',
    name: 'Century',
    emoji: '💯',
    description: 'Complete 100 study sessions in total.',
    trigger: 'Complete 100 total sessions',
  },
  {
    id: 'mistake-hunter',
    name: 'Mistake Hunter',
    emoji: '🔍',
    description: 'Log 25 mistakes in the mistake journal.',
    trigger: 'Record ≥ 25 mistakes',
  },
  {
    id: 'consistent',
    name: 'Consistent',
    emoji: '🏆',
    description: 'Study for 30 days in a single month.',
    trigger: 'Study ≥ 30 days in any calendar month',
  },
];

/**
 * Evaluates which badges have been earned based on aggregated stats.
 *
 * @param {object} stats
 * @param {number}   stats.totalSessions        - Total number of completed sessions
 * @param {number}   stats.currentStreak         - Current consecutive-day streak
 * @param {number}   stats.longestSessionMinutes - Duration of the longest single session in minutes
 * @param {object}   stats.subjectHours          - Map of subjectKey → total hours (e.g. { em: 52, ec: 10 })
 * @param {number}   stats.totalMistakes         - Total mistake entries logged
 * @param {number}   stats.daysStudiedThisMonth  - Number of distinct days with sessions in the current month
 * @returns {string[]} Array of earned badge IDs
 */
export function checkBadges(stats = {}) {
  const {
    totalSessions = 0,
    currentStreak = 0,
    longestSessionMinutes = 0,
    subjectHours = {},
    totalMistakes = 0,
    daysStudiedThisMonth = 0,
  } = stats;

  const earned = [];

  // First Flame — at least 1 session
  if (totalSessions >= 1) {
    earned.push('first-flame');
  }

  // 7-Day Streak — current streak of 7+
  if (currentStreak >= 7) {
    earned.push('7-day-streak');
  }

  // Diamond Focus — single session ≥ 120 minutes
  if (longestSessionMinutes >= 120) {
    earned.push('diamond-focus');
  }

  // Subject Master — any subject with ≥ 50 hours
  const maxSubjectHours = Math.max(0, ...Object.values(subjectHours));
  if (maxSubjectHours >= 50) {
    earned.push('subject-master');
  }

  // Century — 100+ total sessions
  if (totalSessions >= 100) {
    earned.push('century');
  }

  // Mistake Hunter — 25+ mistakes logged
  if (totalMistakes >= 25) {
    earned.push('mistake-hunter');
  }

  // Consistent — 30+ days studied in current month
  if (daysStudiedThisMonth >= 30) {
    earned.push('consistent');
  }

  return earned;
}
