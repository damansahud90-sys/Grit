import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Clock, CheckCircle2, Zap, Play, Check, User,
  Compass, ChevronRight
} from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import useSettingsStore from '../store/useSettingsStore';
import useDiaryStore from '../store/useDiaryStore';
import { getGreeting, getDaysUntil, getToday, formatDuration } from '../utils/dateHelpers';
import { getCategoryColor, getCategoryName } from '../utils/subjects';
import { getTodayQuote } from '../utils/quotes';
import { calcDailyEfficiency } from '../utils/calculations';
import useStreak from '../hooks/useStreak';
import FloatingActionButton from '../components/ui/FloatingActionButton';

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export default function Dashboard({ onOpenSettings, onStartTimer, onOpenAddTask }) {
  const { tasks, sessions } = useTaskStore();
  const { userName, targetDate, targetName, dailyTargetHours } = useSettingsStore();
  const { entries, addEntry, updateEntry } = useDiaryStore();
  const { currentStreak } = useStreak();
  const quote = getTodayQuote();
  const today = getToday();

  // Daily intention
  const todayEntry = entries.find((e) => e.date === today);
  const [intention, setIntention] = useState(todayEntry?.morningIntention || '');

  const handleIntentionBlur = () => {
    if (!intention.trim()) return;
    if (todayEntry) {
      updateEntry(todayEntry.id, { morningIntention: intention });
    } else {
      addEntry({ morningIntention: intention, date: today });
    }
  };

  // Target countdown
  const daysUntil = targetDate ? getDaysUntil(targetDate) : null;
  const totalDays = getDaysUntil('2025-02-01') !== null
    ? Math.abs(getDaysUntil('2025-02-01')) + (daysUntil || 365)
    : 730;
  const progressPercent = daysUntil !== null
    ? Math.max(0, Math.min(100, ((totalDays - daysUntil) / totalDays) * 100))
    : 0;

  // Today's tasks
  const todayTasks = useMemo(
    () => tasks.filter((t) => t.type === 'daily' && t.targetDate === today),
    [tasks, today]
  );

  // Quick stats
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.startTime && s.startTime.startsWith(today)),
    [sessions, today]
  );
  const hoursStudied = useMemo(
    () => todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60,
    [todaySessions]
  );
  const completedCount = todayTasks.filter((t) => t.status === 'completed').length;
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const efficiency = calcDailyEfficiency(todayMinutes, dailyTargetHours * 60);

  const greeting = getGreeting();

  const toggleTaskDone = useTaskStore((s) => s.completeTask);

  return (
    <motion.div
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex-between">
          <div className="flex items-center gap-sm">
            <div className="btn btn--icon">
              <User size={20} />
            </div>
            <span className="heading-lg">Grit</span>
          </div>
          <button className="btn btn--icon" onClick={onOpenSettings} aria-label="Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Greeting */}
        <div>
          <h1 className="heading-lg">{greeting}{userName ? `, ${userName}` : ''}.</h1>
          <p className="body-sm" style={{ fontStyle: 'italic', marginTop: 2 }}>
            "Small steps. Big wins."
          </p>
        </div>

        {/* Target Countdown Card */}
        {targetDate ? (
          <motion.div
            className="card card--elevated"
            style={{
              background: 'linear-gradient(135deg, var(--accent-amber), #D49520)',
              border: 'none',
              color: '#fff',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              opacity: 0.9,
            }}>
              {targetName || 'Your Goal'}
            </span>
            <div style={{ marginTop: 4 }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '3.5rem',
                fontWeight: 700,
                lineHeight: 1.1,
              }}>
                {daysUntil !== null ? daysUntil : '—'}
              </span>
              <span style={{
                fontSize: '1.25rem',
                fontWeight: 500,
                marginLeft: 4,
              }}>
                Days
              </span>
            </div>
            <div style={{
              marginTop: 16,
              height: 6,
              background: 'rgba(255,255,255,0.3)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}>
              <motion.div
                style={{
                  height: '100%',
                  background: '#fff',
                  borderRadius: 'var(--radius-full)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="card card--elevated"
            style={{
              background: 'linear-gradient(135deg, var(--accent-amber), #D49520)',
              border: 'none',
              color: '#fff',
              textAlign: 'center',
              padding: 24,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              opacity: 0.9,
            }}>
              Set your target date in Settings to see a countdown here.
            </span>
          </motion.div>
        )}

        {/* Streak Card */}
        <motion.div
          className="card card--elevated"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24 }}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{
            fontSize: '2.5rem',
            background: 'var(--accent-amber-light)',
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            🔥
          </div>
          <span className="heading-md" style={{ marginTop: 8 }}>
            {currentStreak} Day Streak
          </span>
          <span className="body-sm" style={{ marginTop: 2 }}>
            {currentStreak > 0 ? 'Keep the momentum going.' : 'Start studying to build a streak!'}
          </span>
        </motion.div>

        {/* Quick Stats Row */}
        <div className="flex gap-sm">
          {[
            { icon: <Clock size={20} />, value: `${hoursStudied.toFixed(1)}h`, label: 'Studied' },
            { icon: <CheckCircle2 size={20} />, value: `${completedCount}/${todayTasks.length}`, label: 'Tasks' },
            { icon: <Zap size={20} />, value: `${efficiency}%`, label: 'Efficiency' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="card card--elevated"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '16px 8px',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.2 }}
            >
              <span style={{ color: 'var(--accent-amber)' }}>{stat.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{stat.value}</span>
              <span className="body-sm" style={{ fontSize: '0.6875rem' }}>{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Daily Intention Box */}
        <div className="card card--elevated" style={{ padding: 20 }}>
          <div className="flex items-center gap-sm mb-sm">
            <Compass size={18} style={{ color: 'var(--accent-amber)' }} />
            <span className="heading-md" style={{ fontSize: '1rem' }}>Daily Intention</span>
          </div>
          <textarea
            className="textarea input--warm"
            placeholder="What is your #1 goal today?"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            onBlur={handleIntentionBlur}
            rows={2}
            style={{ minHeight: 60 }}
          />
        </div>

        {/* Today's Tasks */}
        <div>
          <h3 className="heading-md mb-sm">Today's Tasks</h3>
          {todayTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <p className="body-sm">No tasks for today. Add one to get started!</p>
            </div>
          ) : (
            <div className="flex-col gap-xs">
              {todayTasks.map((task, idx) => {
                const isCompleted = task.status === 'completed';
                const subjectColor = getCategoryColor(task.subject);
                return (
                  <motion.div
                    key={task.id}
                    className="card"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ padding: '14px 16px' }}
                  >
                    <div className="flex items-center gap-sm">
                      {/* Checkbox */}
                      <motion.button
                        className="flex-center"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          border: isCompleted
                            ? 'none'
                            : '2px solid var(--border-medium)',
                          background: isCompleted
                            ? 'var(--accent-sage)'
                            : 'transparent',
                          color: '#fff',
                          flexShrink: 0,
                        }}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => {
                          if (!isCompleted) toggleTaskDone(task.id);
                        }}
                      >
                        {isCompleted && <Check size={14} strokeWidth={3} />}
                      </motion.button>

                      {/* Task content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontWeight: 500,
                            fontSize: '0.9375rem',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? 'var(--text-light)' : 'var(--text-primary)',
                          }}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-xs" style={{ marginTop: 4 }}>
                          {task.subject && (
                            <span
                              className="badge badge--subject"
                              style={{
                                background: `${subjectColor}18`,
                                color: subjectColor,
                              }}
                            >
                              {getCategoryName(task.subject)}
                            </span>
                          )}
                          {task.targetMinutes > 0 && (
                            <span className="badge">
                              {formatDuration(task.targetMinutes)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Play button */}
                      {!isCompleted && (
                        <motion.button
                          className="flex-center"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-full)',
                            background: 'var(--accent-amber)',
                            color: '#fff',
                            flexShrink: 0,
                          }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => onStartTimer && onStartTimer(task.id)}
                          aria-label={`Start timer for ${task.title}`}
                        >
                          <Play size={16} fill="currentColor" />
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quote of the Day */}
        <div className="card" style={{ textAlign: 'center', borderLeft: '3px solid var(--accent-amber)', padding: 20 }}>
          <p className="body-sm" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>
            "{quote.text}"
          </p>
          <p style={{
            marginTop: 8,
            fontSize: '0.75rem',
            color: 'var(--text-light)',
            fontWeight: 600,
          }}>
            — {quote.author}
          </p>
        </div>
      </div>

      <FloatingActionButton onClick={onOpenAddTask} />
    </motion.div>
  );
}
