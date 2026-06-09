import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Play, Pause, Square, RotateCcw, Clock,
  ChevronDown,
} from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import useTimerStore from '../store/useTimerStore';
import useTimer from '../hooks/useTimer';
import { getCategoryColor, getCategoryName } from '../utils/subjects';
import TimeStepper from '../components/ui/TimeStepper';
import { formatTime, getToday } from '../utils/dateHelpers';
import Modal from '../components/ui/Modal';

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

// Duration chip presets
const DURATION_CHIPS = [
  { label: '15m', seconds: 900 },
  { label: '25m', seconds: 1500 },
  { label: '45m', seconds: 2700 },
  { label: '60m', seconds: 3600 },
  { label: '∞', seconds: null },
];

export default function Focus({ onOpenSettings }) {
  const { tasks, addSession, logMinutes } = useTaskStore();
  const timer = useTimer();
  const {
    elapsed, isRunning, isPaused, duration, taskId,
    start, pause, resume, stop, reset, setDuration, setTaskId,
  } = timer;

  const today = getToday();
  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed'),
    [tasks]
  );

  // Local UI state
  const [selectedDuration, setSelectedDuration] = useState(1500); // default 25m
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [lastSessionDuration, setLastSessionDuration] = useState(0);
  const [lastSessionTaskId, setLastSessionTaskId] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);

  // Sync local selection with store when timer is already running (e.g. navigated back)
  useEffect(() => {
    if (isRunning || isPaused) {
      setSelectedDuration(duration);
      if (taskId) setSelectedTaskId(taskId);
    }
  }, []); // intentionally run once on mount

  const selectedTask = tasks.find((t) => t.id === (isRunning || isPaused ? taskId : selectedTaskId));

  // ─── Timer ring calculations ───────────────────
  const radius = 115;
  const circumference = 2 * Math.PI * radius;

  let displayTime;
  let progressFraction;

  if (duration !== null) {
    // Countdown mode: ring depletes, display shows remaining
    const remaining = Math.max(duration - elapsed, 0);
    displayTime = remaining;
    progressFraction = duration > 0 ? Math.min(elapsed / duration, 1) : 0;
  } else {
    // Count-up mode: ring fills based on elapsed/3600 (1 hour max visual)
    displayTime = elapsed;
    progressFraction = Math.min(elapsed / 3600, 1);
  }

  // In countdown mode the ring starts full and depletes
  // In count-up mode the ring starts empty and fills
  const strokeDashoffset = duration !== null
    ? circumference * (1 - (1 - progressFraction))  // depletes: full → empty
    : circumference * (1 - progressFraction);        // fills: empty → full

  // ─── Auto-show summary when countdown auto-stops ───
  useEffect(() => {
    if (
      !isRunning &&
      !isPaused &&
      lastSessionDuration === 0 &&
      elapsed === 0
    ) {
      // Check if a session was just auto-stopped by the hook
      // We detect this by the store being reset while we had a running timer
    }
  }, [isRunning, isPaused, elapsed, lastSessionDuration]);

  // Watch for auto-stop from countdown completion
  const wasRunningRef = useMemo(() => ({ current: false }), []);
  useEffect(() => {
    if (isRunning || isPaused) {
      wasRunningRef.current = true;
    } else if (wasRunningRef.current) {
      // Timer just stopped (could be auto-stop from countdown)
      wasRunningRef.current = false;
      // If no summary is already showing, and we had meaningful elapsed time
      // the stop handler in handleStop will handle manual stops,
      // so this handles auto-stops from countdown completion
    }
  }, [isRunning, isPaused, wasRunningRef]);

  // ─── Handlers ──────────────────────────────────
  const handleDurationSelect = (seconds) => {
    setSelectedDuration(seconds);
    // If timer is running, update the store's duration in-flight
    if (isRunning || isPaused) {
      setDuration(seconds);
    }
  };

  const handleStart = () => {
    const tid = selectedTaskId || null;
    start(selectedDuration, tid);
  };

  const handleStop = () => {
    const result = stop();
    const finalElapsed = result?.elapsedSeconds || elapsed;
    const finalTaskId = result?.taskId || null;
    setLastSessionDuration(finalElapsed);
    setLastSessionTaskId(finalTaskId);
    setSessionNote('');
    if (finalElapsed > 0) {
      setShowSummary(true);
    }
  };

  const handleSaveSummary = () => {
    const sessionTask = tasks.find((t) => t.id === lastSessionTaskId);
    const durationMinutes = Math.round(lastSessionDuration / 60);

    if (lastSessionDuration > 0) {
      addSession({
        taskId: lastSessionTaskId,
        subject: sessionTask?.subject || '',
        startTime: new Date(Date.now() - lastSessionDuration * 1000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes,
        type: 'timer',
        sessionNote: sessionNote,
        pomodoroRounds: 0,
      });

      // Also log minutes to the task
      if (lastSessionTaskId && durationMinutes > 0) {
        logMinutes(lastSessionTaskId, durationMinutes);
      }
    }

    setShowSummary(false);
    setLastSessionDuration(0);
    setLastSessionTaskId(null);
  };

  const handleManualEntry = () => {
    const totalMinutes = Number(manualHours) * 60 + Number(manualMinutes);
    if (!manualTaskId || totalMinutes <= 0) return;
    const task = tasks.find((t) => t.id === manualTaskId);
    addSession({
      taskId: manualTaskId,
      subject: task?.subject || '',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationMinutes: totalMinutes,
      type: 'manual',
      sessionNote: '',
      pomodoroRounds: 0,
    });
    if (totalMinutes > 0) {
      logMinutes(manualTaskId, totalMinutes);
    }
    setShowManualEntry(false);
    setManualTaskId('');
    setManualHours(0);
    setManualMinutes(0);
  };

  const lastSessionTask = tasks.find((t) => t.id === lastSessionTaskId);

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
            <div className="btn btn--icon"><User size={20} /></div>
            <span className="heading-lg">Grit</span>
          </div>
          <button className="btn btn--icon" onClick={onOpenSettings} aria-label="Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Duration Chips */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 20,
            width: '100%',
          }}
        >
          {DURATION_CHIPS.map((chip) => {
            const isActive = (isRunning || isPaused)
              ? duration === chip.seconds
              : selectedDuration === chip.seconds;
            return (
              <motion.button
                key={chip.label}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleDurationSelect(chip.seconds)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-full)',
                  border: isActive ? 'none' : '1.5px solid var(--border-medium)',
                  background: isActive
                    ? 'var(--accent-amber)'
                    : 'var(--bg-secondary)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {chip.label}
              </motion.button>
            );
          })}
        </div>

        {/* Timer Circle */}
        <div style={{ position: 'relative', width: 260, height: 260, margin: '8px auto' }}>
          <svg width="260" height="260" style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke="var(--bg-secondary)"
              strokeWidth="6"
            />
            {/* Progress */}
            <motion.circle
              cx="130"
              cy="130"
              r={radius}
              fill="none"
              stroke="var(--accent-amber)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          {/* Time display */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '2.75rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {formatTime(displayTime)}
            </div>
            {(isRunning || isPaused) && duration !== null && (
              <div className="body-sm" style={{ marginTop: 2, color: 'var(--text-tertiary)' }}>
                {duration !== null ? 'remaining' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Task Selector */}
        <div style={{ width: '100%', marginTop: 12, marginBottom: 8 }}>
          <div className="card" style={{ padding: '12px 16px' }}>
            <div className="flex items-center gap-sm">
              {selectedTask?.subject && (
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 'var(--radius-full)',
                    background: getCategoryColor(selectedTask.subject),
                    flexShrink: 0,
                  }}
                />
              )}
              <select
                className="select"
                value={isRunning || isPaused ? (taskId || '') : selectedTaskId}
                onChange={(e) => {
                  setSelectedTaskId(e.target.value);
                  if (isRunning || isPaused) {
                    setTaskId(e.target.value || null);
                  }
                }}
                style={{ border: 'none', background: 'transparent', padding: 0, flex: 1 }}
              >
                <option value="">No task (free focus)</option>
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Task info */}
        {selectedTask && (
          <div style={{ textAlign: 'center', marginBottom: 12, marginTop: 4 }}>
            <h2 className="heading-md" style={{ fontSize: '1.125rem', marginBottom: 4 }}>
              {selectedTask.title}
            </h2>
            {selectedTask.subject && (
              <span
                className="badge badge--subject"
                style={{
                  background: `${getCategoryColor(selectedTask.subject)}18`,
                  color: getCategoryColor(selectedTask.subject),
                }}
              >
                {getCategoryName(selectedTask.subject)}
              </span>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-lg" style={{ marginBottom: 24, marginTop: selectedTask ? 0 : 16 }}>
          {/* Stop */}
          <motion.button
            className="flex-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              background: 'none',
              cursor: 'pointer',
            }}
            whileTap={{ scale: 0.85 }}
            onClick={handleStop}
            disabled={!isRunning && !isPaused}
          >
            <Square size={18} />
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            className="flex-center"
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-full)',
              background: 'var(--accent-amber)',
              color: '#fff',
              boxShadow: 'var(--shadow-fab)',
              border: 'none',
              cursor: 'pointer',
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (!isRunning && !isPaused) handleStart();
              else if (isRunning && !isPaused) pause();
              else resume();
            }}
          >
            {isRunning && !isPaused ? (
              <Pause size={24} fill="currentColor" />
            ) : (
              <Play size={24} fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </motion.button>

          {/* Reset */}
          <motion.button
            className="flex-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              background: 'none',
              cursor: 'pointer',
            }}
            whileTap={{ scale: 0.85 }}
            onClick={reset}
          >
            <RotateCcw size={18} />
          </motion.button>
        </div>

        {/* Manual time link */}
        <button
          style={{
            color: 'var(--accent-amber)',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: 12,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setShowManualEntry(true)}
        >
          Add time manually
        </button>
      </div>

      {/* Session Summary Modal */}
      <Modal
        isOpen={showSummary}
        onClose={() => setShowSummary(false)}
        title="Session Complete"
      >
        <div className="flex-col gap-md">
          <div className="card" style={{ textAlign: 'center', padding: 24 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--accent-amber)',
              marginBottom: 4,
            }}>
              {formatTime(lastSessionDuration)}
            </div>
            <div className="body-sm">Time spent this session</div>
          </div>

          {lastSessionTask && (
            <div className="body-sm" style={{ textAlign: 'center' }}>
              Task: <strong>{lastSessionTask.title}</strong>
            </div>
          )}

          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              What did you accomplish?
            </label>
            <textarea
              className="textarea"
              placeholder="Session notes..."
              value={sessionNote}
              onChange={(e) => setSessionNote(e.target.value)}
              rows={3}
              style={{ minHeight: 60 }}
            />
          </div>

          <button className="btn btn--primary btn--lg w-full" onClick={handleSaveSummary}>
            Save Session
          </button>
        </div>
      </Modal>

      {/* Manual Time Entry Modal */}
      <Modal
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        title="Add Time Manually"
      >
        <div className="flex-col gap-md">
          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Task
            </label>
            <select
              className="select"
              value={manualTaskId}
              onChange={(e) => setManualTaskId(e.target.value)}
            >
              <option value="">Select a task...</option>
              {activeTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Duration
            </label>
            <div className="flex gap-md" style={{ justifyContent: 'center' }}>
              <TimeStepper value={manualHours} onChange={setManualHours} min={0} max={23} label="Hours" unit="hrs" />
              <TimeStepper value={manualMinutes} onChange={setManualMinutes} min={0} max={59} step={5} label="Minutes" unit="min" />
            </div>
          </div>

          <button className="btn btn--primary btn--lg w-full" onClick={handleManualEntry}>
            Log Time
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
