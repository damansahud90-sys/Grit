/**
 * Grit — Settings Store
 * Zustand store with persist middleware for all user preferences.
 * Includes data export/import across all stores.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_CATEGORIES } from '../utils/subjects';

const useSettingsStore = create(
  persist(
    (set, get) => ({
      // ─── State ────────────────────────────────────
      userName: '',
      targetDate: '',
      targetName: '',
      theme: 'light',
      pomodoroFocus: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      dailyTargetHours: 8,
      categoryTargets: {},
      categories: DEFAULT_CATEGORIES,
      notificationsEnabled: true,
      isOnboarded: false,
      isGuest: false,

      // ─── Actions ──────────────────────────────────
      updateSetting: (key, value) => {
        set((state) => {
          // Apply theme side-effect
          if (key === 'theme') {
            document.documentElement.setAttribute('data-theme', value);
          }
          return { [key]: value };
        });
      },

      updateCategoryTarget: (categoryKey, hours) => {
        set((state) => ({
          categoryTargets: {
            ...state.categoryTargets,
            [categoryKey]: hours,
          },
        }));
      },

      addCategory: (cat) => {
        set((state) => ({
          categories: [...state.categories, cat],
        }));
      },

      updateCategory: (key, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.key === key ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCategory: (key) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.key !== key),
        }));
      },

      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', newTheme);
          return { theme: newTheme };
        });
      },

      /**
       * Export all app data (settings + tasks + diary) as a JSON string.
       * Reads from localStorage directly to collect all persisted stores.
       * @returns {string} JSON string of all store data
       */
      exportData: () => {
        const exportPayload = {
          version: 1,
          exportedAt: new Date().toISOString(),
          settings: null,
          tasks: null,
          diary: null,
        };

        try {
          const settingsRaw = localStorage.getItem('grit-settings');
          if (settingsRaw) exportPayload.settings = JSON.parse(settingsRaw);

          const tasksRaw = localStorage.getItem('grit-tasks');
          if (tasksRaw) exportPayload.tasks = JSON.parse(tasksRaw);

          const diaryRaw = localStorage.getItem('grit-diary');
          if (diaryRaw) exportPayload.diary = JSON.parse(diaryRaw);
        } catch (err) {
          console.error('Export failed:', err);
        }

        return JSON.stringify(exportPayload, null, 2);
      },

      /**
       * Import data from a JSON string, restoring all stores.
       * @param {string} jsonString - Previously exported JSON
       * @returns {boolean} true if import succeeded
       */
      importData: (jsonString) => {
        try {
          const data = typeof jsonString === 'string'
            ? JSON.parse(jsonString)
            : jsonString;

          if (!data || data.version === undefined) {
            console.error('Invalid import data: missing version');
            return false;
          }

          if (data.settings) {
            localStorage.setItem(
              'grit-settings',
              JSON.stringify(data.settings)
            );
          }

          if (data.tasks) {
            localStorage.setItem(
              'grit-tasks',
              JSON.stringify(data.tasks)
            );
          }

          if (data.diary) {
            localStorage.setItem(
              'grit-diary',
              JSON.stringify(data.diary)
            );
          }

          // Reload the page to hydrate all stores from localStorage
          window.location.reload();
          return true;
        } catch (err) {
          console.error('Import failed:', err);
          return false;
        }
      },
    }),
    {
      name: 'grit-settings',
      version: 1,
      onRehydrate: () => {
        return (state) => {
          // Apply persisted theme on rehydration
          if (state?.theme) {
            document.documentElement.setAttribute('data-theme', state.theme);
          }
        };
      },
    }
  )
);

export default useSettingsStore;
