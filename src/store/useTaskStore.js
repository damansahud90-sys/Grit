/**
 * FocusForge — Task & Session Store
 * Zustand store with persist middleware for tasks, sessions, and mock scores.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

const useTaskStore = create(
  persist(
    (set, get) => ({
      // ─── State ────────────────────────────────────
      tasks: [],
      sessions: [],
      mockScores: [],

      // ─── Task Actions ─────────────────────────────
      addTask: (taskData) => {
        const task = {
          id: generateId(),
          title: '',
          type: 'daily',
          subject: '',
          priority: 'medium',
          targetMinutes: 60,
          loggedMinutes: 0,
          targetDate: dayjs().format('YYYY-MM-DD'),
          subTasks: [],
          status: 'active',
          isRecurring: false,
          recurringInterval: null,
          dependsOn: null,
          notes: '',
          createdAt: new Date().toISOString(),
          completedAt: null,
          ...taskData,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return task;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      toggleSubTask: (taskId, subTaskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              subTasks: t.subTasks.map((st) =>
                st.id === subTaskId ? { ...st, done: !st.done } : st
              ),
            };
          }),
        }));
      },

      completeTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id === id) {
              const isCompleted = t.status === 'completed';
              return {
                ...t,
                status: isCompleted ? 'active' : 'completed',
                completedAt: isCompleted ? null : new Date().toISOString(),
              };
            }
            return t;
          }),
        }));
      },

      carryForwardTask: (id) => {
        const { tasks } = get();
        const original = tasks.find((t) => t.id === id);
        if (!original) return;

        const newTask = {
          ...original,
          id: generateId(),
          status: 'active',
          targetDate: dayjs().format('YYYY-MM-DD'),
          completedAt: null,
          createdAt: new Date().toISOString(),
          loggedMinutes: 0,
          subTasks: original.subTasks.map((st) => ({ ...st, done: false })),
        };

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'carried' } : t
          ).concat(newTask),
        }));

        return newTask;
      },

      logMinutes: (taskId, minutes) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, loggedMinutes: (t.loggedMinutes || 0) + minutes }
              : t
          ),
        }));
      },

      // ─── Session Actions ──────────────────────────
      addSession: (sessionData) => {
        const session = {
          id: generateId(),
          taskId: null,
          subject: '',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMinutes: 0,
          type: 'timer',
          sessionNote: '',
          pomodoroRounds: 0,
          ...sessionData,
        };
        set((state) => ({ sessions: [...state.sessions, session] }));
        return session;
      },

      // ─── Mock Score Actions ───────────────────────
      addMockScore: (scoreData) => {
        const score = {
          id: generateId(),
          date: dayjs().format('YYYY-MM-DD'),
          mockName: '',
          score: 0,
          percentile: null,
          rank: null,
          ...scoreData,
        };
        set((state) => ({ mockScores: [...state.mockScores, score] }));
        return score;
      },

      getMockScores: () => {
        return get().mockScores.slice().sort((a, b) =>
          a.date > b.date ? -1 : 1
        );
      },

      // ─── Selectors / Derived Data ─────────────────
      getTodayTasks: () => {
        const today = dayjs().format('YYYY-MM-DD');
        return get().tasks.filter(
          (t) => t.targetDate === today && t.status !== 'carried'
        );
      },

      getTasksByType: (type) => {
        return get().tasks.filter((t) => t.type === type);
      },

      getIncompleteTasks: () => {
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        return get().tasks.filter(
          (t) =>
            t.targetDate === yesterday &&
            t.status !== 'completed' &&
            t.status !== 'carried'
        );
      },
    }),
    {
      name: 'grit-tasks',
      version: 1,
    }
  )
);

export default useTaskStore;
