// ═══════════════════════════════════════════════════════
//  Grit — Firestore Sync Hook
//  Syncs Zustand stores ↔ Firestore when authenticated
// ═══════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import useSettingsStore from '../store/useSettingsStore';
import useTaskStore from '../store/useTaskStore';
import useDiaryStore from '../store/useDiaryStore';

const DEBOUNCE_MS = 2000;

export default function useFirestoreSync(user) {
  const debounceTimers = useRef({});
  const hasSynced = useRef(false);

  // Pull data from Firestore on login
  useEffect(() => {
    if (!user || hasSynced.current) return;

    const pullFromFirestore = async () => {
      try {
        // Pull settings
        const settingsDoc = await getDoc(doc(db, 'users', user.uid, 'data', 'settings'));
        if (settingsDoc.exists()) {
          const remoteSettings = settingsDoc.data();
          const store = useSettingsStore.getState();
          // Merge: remote wins for most fields, keep local theme preference
          Object.keys(remoteSettings).forEach((key) => {
            if (key !== 'theme' && typeof store[key] !== 'function') {
              store.updateSetting(key, remoteSettings[key]);
            }
          });
        }

        // Pull tasks
        const tasksDoc = await getDoc(doc(db, 'users', user.uid, 'data', 'tasks'));
        if (tasksDoc.exists()) {
          const remoteTasks = tasksDoc.data();
          const store = useTaskStore.getState();
          // Merge: combine remote and local tasks, deduplicate by ID
          if (remoteTasks.tasks) {
            const localIds = new Set(store.tasks.map((t) => t.id));
            const newTasks = remoteTasks.tasks.filter((t) => !localIds.has(t.id));
            if (newTasks.length > 0) {
              useTaskStore.setState({ tasks: [...store.tasks, ...newTasks] });
            }
          }
          if (remoteTasks.sessions) {
            const localIds = new Set(store.sessions.map((s) => s.id));
            const newSessions = remoteTasks.sessions.filter((s) => !localIds.has(s.id));
            if (newSessions.length > 0) {
              useTaskStore.setState({ sessions: [...store.sessions, ...newSessions] });
            }
          }
          if (remoteTasks.mockScores) {
            const localIds = new Set(store.mockScores.map((m) => m.id));
            const newScores = remoteTasks.mockScores.filter((m) => !localIds.has(m.id));
            if (newScores.length > 0) {
              useTaskStore.setState({ mockScores: [...store.mockScores, ...newScores] });
            }
          }
        }

        // Pull diary
        const diaryDoc = await getDoc(doc(db, 'users', user.uid, 'data', 'diary'));
        if (diaryDoc.exists()) {
          const remoteDiary = diaryDoc.data();
          const store = useDiaryStore.getState();
          if (remoteDiary.entries) {
            const localIds = new Set(store.entries.map((e) => e.id));
            const newEntries = remoteDiary.entries.filter((e) => !localIds.has(e.id));
            if (newEntries.length > 0) {
              useDiaryStore.setState({ entries: [...store.entries, ...newEntries] });
            }
          }
          if (remoteDiary.mistakes) {
            const localIds = new Set(store.mistakes.map((m) => m.id));
            const newMistakes = remoteDiary.mistakes.filter((m) => !localIds.has(m.id));
            if (newMistakes.length > 0) {
              useDiaryStore.setState({ mistakes: [...store.mistakes, ...newMistakes] });
            }
          }
          if (remoteDiary.notes) {
            const localIds = new Set(store.notes.map((n) => n.id));
            const newNotes = remoteDiary.notes.filter((n) => !localIds.has(n.id));
            if (newNotes.length > 0) {
              useDiaryStore.setState({ notes: [...store.notes, ...newNotes] });
            }
          }
        }

        hasSynced.current = true;
      } catch (err) {
        console.error('Firestore pull failed:', err);
      }
    };

    pullFromFirestore();
  }, [user]);

  // Push data to Firestore on state changes (debounced)
  useEffect(() => {
    if (!user) return;

    const pushToFirestore = (collection, getData) => {
      clearTimeout(debounceTimers.current[collection]);
      debounceTimers.current[collection] = setTimeout(async () => {
        try {
          const data = getData();
          await setDoc(doc(db, 'users', user.uid, 'data', collection), data);
        } catch (err) {
          console.error(`Firestore push (${collection}) failed:`, err);
        }
      }, DEBOUNCE_MS);
    };

    // Subscribe to store changes
    const unsubSettings = useSettingsStore.subscribe(() => {
      const state = useSettingsStore.getState();
      const { updateSetting, addCategory, updateCategory, deleteCategory, toggleTheme, exportData, importData, clearAllData, ...data } = state;
      pushToFirestore('settings', () => data);
    });

    const unsubTasks = useTaskStore.subscribe(() => {
      const { tasks, sessions, mockScores } = useTaskStore.getState();
      pushToFirestore('tasks', () => ({ tasks, sessions, mockScores }));
    });

    const unsubDiary = useDiaryStore.subscribe(() => {
      const { entries, mistakes, notes } = useDiaryStore.getState();
      pushToFirestore('diary', () => ({ entries, mistakes, notes }));
    });

    return () => {
      unsubSettings();
      unsubTasks();
      unsubDiary();
      // Clear any pending debounce timers
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, [user]);

  return { hasSynced: hasSynced.current };
}
