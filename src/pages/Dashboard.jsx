import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Clock, CheckCircle2, Zap, Play, Check, User,
} from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import useSettingsStore from '../store/useSettingsStore';
import { getGreeting, getToday, formatDuration } from '../utils/dateHelpers';
import { getCategoryColor, getCategoryName } from '../utils/subjects';
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
  const { userName, dailyTargetHours } = useSettingsStore();
  const { currentStreak } = useStreak();
  const today = getToday();

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
        {/* 1. Greeting + Streak — compact single line */}
        <div className="flex items-center gap-sm" style={{ padding: '4px 0' }}>
          <h1 className="heading-lg" style={{ flex: 1, fontSize: '1.25rem' }}>
            {greeting}{userName ? `, ${userName}` : ''}!
          </h1>
          {currentStreak > 0 && (
            <span
              className="flex items-center gap-xs"
              style={{
                background: 'var(--accent-amber-light, rgba(232,168,56,0.1))',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                fontSize: '0.875rem',
                color: 'var(--accent-amber)',
                flexShrink: 0,
              }}
            >
              🔥 {currentStreak} day streak
            </span>
          )}
        </div>

        {/* 2. Quick Stats — 3 compact cards */}
        <div className="flex gap-sm">
          {[
            { icon: <Clock size={18} />, value: `${hoursStudied.toFixed(1)}h`, label: 'Hours' },
            { icon: <CheckCircle2 size={18} />, value: `${completedCount}/${todayTasks.length}`, label: 'Tasks' },
            { icon: <Zap size={18} />, value: `${efficiency}%`, label: 'Efficiency' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="card card--elevated"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '12px 6px',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.1 }}
            >
              <span style={{ color: 'var(--accent-amber)' }}>{stat.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{stat.value}</span>
              <span className="body-sm" style={{ fontSize: '0.6875rem' }}>{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* 3. Today's Tasks */}
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
                          toggleTaskDone(task.id);
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

        {/* 4. Quick Focus Button */}
        <motion.button
          className="btn btn--primary btn--lg w-full"
          style={{
            padding: '18px 24px',
            fontSize: '1.0625rem',
            fontWeight: 700,
            gap: 10,
            borderRadius: 'var(--radius-md)',
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onStartTimer && onStartTimer()}
        >
          <Play size={20} fill="currentColor" />
          Start Focusing
        </motion.button>
      </div>

      <FloatingActionButton onClick={onOpenAddTask} />
    </motion.div>
  );
}
