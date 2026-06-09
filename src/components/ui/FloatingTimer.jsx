/**
 * Grit — FloatingTimer
 * A small pill/chip that appears at the top of the screen when the timer
 * is running and the user is NOT on the Focus tab.
 * Tapping it navigates the user back to the Focus tab.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTimerStore from '../../store/useTimerStore';

/**
 * Format seconds into a compact time string.
 * Shows MM:SS if under an hour, HH:MM:SS if over.
 */
function formatCompactTime(totalSeconds) {
  if (!totalSeconds || totalSeconds < 0) return '00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) {
    return [
      String(h).padStart(2, '0'),
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ].join(':');
  }
  return [String(m).padStart(2, '0'), String(s).padStart(2, '0')].join(':');
}

export default function FloatingTimer({ onTap }) {
  const isRunning = useTimerStore((s) => s.isRunning);
  const isPaused = useTimerStore((s) => s.isPaused);
  const getElapsedSeconds = useTimerStore((s) => s.getElapsedSeconds);

  const [elapsed, setElapsed] = useState(0);

  // Tick every second to keep the pill display updated
  useEffect(() => {
    if (!isRunning) return;

    setElapsed(getElapsedSeconds());
    const id = setInterval(() => {
      setElapsed(getElapsedSeconds());
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning, isPaused, getElapsedSeconds]);

  const visible = isRunning || isPaused;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={onTap}
          initial={{ opacity: 0, y: -40, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--accent-amber), #e09530)',
            color: '#fff',
            fontSize: '0.8125rem',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            letterSpacing: '0.02em',
          }}
        >
          {/* Pulse dot when actively running (not paused) */}
          {isRunning && !isPaused && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 7,
                height: 7,
                borderRadius: 'var(--radius-full)',
                background: '#fff',
                flexShrink: 0,
              }}
            />
          )}
          {isPaused && (
            <span style={{ fontSize: '0.75rem' }}>⏸</span>
          )}
          <span>⏱ {formatCompactTime(elapsed)}</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
