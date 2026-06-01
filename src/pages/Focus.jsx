import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Play, Pause, Square, RotateCcw, Clock,
  ChevronDown,
} from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import useSettingsStore from '../store/useSettingsStore';
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

export default function Focus({ onOpenSettings, initialTaskId }) {
  const { tasks, addSession } = useTaskStore();
  const { pomodoroFocus, pomodoroShortBreak } = useSettingsStore();
  const timer = useTimer();
  const {
    elapsed, isRunning, isPaused, phase, pomodoroRound,
    start, pause, resume, stop, reset, pomodoroEnabled, togglePomodoro,
  } = timer;

  const today = getToday();
  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed'),
    [tasks]
  );

  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId || '');
  const [showSummary, setShowSummary] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [lastSessionDuration, setLastSessionDuration] = useState(0);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualHours, setManualHours] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(0);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  // Timer ring calculations
  const radius = 115;
  const circumference = 2 * Math.PI * radius;
  let maxSeconds = 3600; // default 1 hour for count-up
  if (pomodoroEnabled) {
    if (phase === 'focus') maxSeconds = pomodoroFocus * 60;
    else if (phase === 'shortBreak') maxSeconds = pomodoroShortBreak * 60;
    else maxSeconds = 15 * 60; // long break
  }
  const progressFraction = pomodoroEnabled
    ? Math.min(elapsed / maxSeconds, 1)
    : Math.min(elapsed / maxSeconds, 1);
  const strokeDashoffset = circumference * (1 - progressFraction);

  const handleStart = () => {
    if (!selectedTaskId) return;
    start();
  };

  const handleStop = () => {
    const result = stop();
    const finalElapsed = result?.totalElapsed || elapsed;
    setLastSessionDuration(finalElapsed);
    setSessionNote('');
    setShowSummary(true);
  };

  const handleSaveSummary = () => {
    if (selectedTask && lastSessionDuration > 0) {
      addSession({
        taskId: selectedTask.id,
        subject: selectedTask.subject,
        startTime: new Date(Date.now() - lastSessionDuration * 1000).toISOString(),
        endTime: new Date().toISOString(),
        durationMinutes: Math.round(lastSessionDuration / 60),
        type: 'timer',
        sessionNote: sessionNote,
        pomodoroRounds: pomodoroEnabled ? pomodoroRound : 0,
      });
    }
    setShowSummary(false);
    setLastSessionDuration(0);
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
    setShowManualEntry(false);
    setManualTaskId('');
    setManualHours(0);
    setManualMinutes(0);
  };

  const phaseLabel = phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break';

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
        {/* Task Selector */}
        <div style={{ width: '100%', marginBottom: 8 }}>
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
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: 0, flex: 1 }}
              >
                <option value="">Select a task...</option>
                {activeTasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timer Circle */}
        <div style={{ position: 'relative', width: 260, height: 260, margin: '16px auto' }}>
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
              fontFamily: 'var(--font-mono)',
              fontSize: '2.75rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Task info */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2 className="heading-md" style={{ fontSize: '1.25rem', marginBottom: 6 }}>
            {selectedTask ? selectedTask.title : 'Select a task'}
          </h2>
          {selectedTask?.subject && (
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
          {pomodoroEnabled && isRunning && (
            <div className="body-sm" style={{ marginTop: 6 }}>
              {phaseLabel} • Round {pomodoroRound}/4
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-lg" style={{ marginBottom: 24 }}>
          {/* Stop */}
          <motion.button
            className="flex-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--border-medium)',
              color: 'var(--text-secondary)',
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
            }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (!isRunning && !isPaused) handleStart();
              else if (isRunning && !isPaused) pause();
              else resume();
            }}
            disabled={!selectedTaskId}
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
            }}
            whileTap={{ scale: 0.85 }}
            onClick={reset}
          >
            <RotateCcw size={18} />
          </motion.button>
        </div>

        {/* Pomodoro Mode Card */}
        <div className="card" style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          marginBottom: 16,
        }}>
          <div className="flex items-center gap-sm">
            <Clock size={18} style={{ color: 'var(--accent-amber)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>Pomodoro Mode</div>
              <div className="body-sm" style={{ fontSize: '0.75rem' }}>
                {pomodoroFocus}m focus, {pomodoroShortBreak}m break
              </div>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={pomodoroEnabled}
              onChange={togglePomodoro}
            />
            <span className="toggle-switch__slider" />
          </label>
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

          {selectedTask && (
            <div className="body-sm" style={{ textAlign: 'center' }}>
              Total on <strong>{selectedTask.title}</strong>:{' '}
              {Math.round((selectedTask.loggedMinutes || 0) + lastSessionDuration / 60)}m
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
