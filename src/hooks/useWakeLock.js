/**
 * FocusForge — useWakeLock Hook
 * Uses the Screen Wake Lock API to prevent the screen from sleeping
 * during active timer sessions.
 *
 * Falls back gracefully on browsers that don't support the API.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * @returns {{
 *   isLocked: boolean,
 *   requestWakeLock: () => Promise<void>,
 *   releaseWakeLock: () => Promise<void>,
 * }}
 */
export default function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef(null);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API is not supported in this browser.');
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsLocked(true);

      // Listen for the lock being released (e.g., tab becomes hidden)
      wakeLockRef.current.addEventListener('release', () => {
        setIsLocked(false);
        wakeLockRef.current = null;
      });
    } catch (err) {
      console.warn('Wake Lock request failed:', err.message);
      setIsLocked(false);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn('Wake Lock release failed:', err.message);
      }
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  // Re-acquire the wake lock when the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isLocked && !wakeLockRef.current) {
        // The lock was auto-released when the tab was hidden; re-acquire it
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
            wakeLockRef.current.addEventListener('release', () => {
              setIsLocked(false);
              wakeLockRef.current = null;
            });
            setIsLocked(true);
          }
        } catch (err) {
          console.warn('Wake Lock re-acquisition failed:', err.message);
          setIsLocked(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLocked]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, []);

  return { isLocked, requestWakeLock, releaseWakeLock };
}
