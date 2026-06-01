/**
 * FocusForge — Diary, Mistakes & Notes Store
 * Zustand store with persist middleware for journal entries,
 * mistake tracking, and pinned notes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const useDiaryStore = create(
  persist(
    (set, get) => ({
      // ─── State ────────────────────────────────────
      entries: [],
      mistakes: [],
      notes: [],

      // ─── Journal Entry Actions ────────────────────
      addEntry: (entryData) => {
        const entry = {
          id: generateId(),
          date: dayjs().format('YYYY-MM-DD'),
          morningIntention: '',
          eveningReflection: '',
          freeText: '',
          mood: 'okay',
          createdAt: new Date().toISOString(),
          ...entryData,
        };
        set((state) => ({ entries: [...state.entries, entry] }));
        return entry;
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      getEntryByDate: (date) => {
        const dateStr = dayjs(date).format('YYYY-MM-DD');
        return get().entries.find((e) => e.date === dateStr) || null;
      },

      getRecentEntries: (count = 7) => {
        return get()
          .entries.slice()
          .sort((a, b) => (a.date > b.date ? -1 : 1))
          .slice(0, count);
      },

      // ─── Mistake Actions ──────────────────────────
      addMistake: (mistakeData) => {
        const mistake = {
          id: generateId(),
          subject: '',
          mistakeDescription: '',
          rootCause: '',
          lesson: '',
          date: dayjs().format('YYYY-MM-DD'),
          ...mistakeData,
        };
        set((state) => ({ mistakes: [...state.mistakes, mistake] }));
        return mistake;
      },

      deleteMistake: (id) => {
        set((state) => ({
          mistakes: state.mistakes.filter((m) => m.id !== id),
        }));
      },

      getMistakesBySubject: (subjectKey) => {
        if (!subjectKey) return get().mistakes;
        return get().mistakes.filter((m) => m.subject === subjectKey);
      },

      getRandomMistake: () => {
        const { mistakes } = get();
        if (mistakes.length === 0) return null;
        const index = Math.floor(Math.random() * mistakes.length);
        return mistakes[index];
      },

      // ─── Pinned Notes Actions ─────────────────────
      addNote: (noteData) => {
        const note = {
          id: generateId(),
          title: '',
          content: '',
          color: '#E8A838',
          isPinned: false,
          createdAt: new Date().toISOString(),
          ...noteData,
        };
        set((state) => ({ notes: [...state.notes, note] }));
        return note;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },

      togglePinNote: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned } : n
          ),
        }));
      },

      searchNotes: (query) => {
        if (!query || query.trim() === '') return get().notes;
        const q = query.toLowerCase().trim();
        return get().notes.filter(
          (n) =>
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.content && n.content.toLowerCase().includes(q))
        );
      },
    }),
    {
      name: 'grit-diary',
      version: 1,
    }
  )
);

export default useDiaryStore;
