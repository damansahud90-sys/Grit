import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/ui/BottomNav';
import Modal from './components/ui/Modal';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Focus from './pages/Focus';
import Stats from './pages/Stats';
import Diary from './pages/Diary';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import useSettingsStore from './store/useSettingsStore';
import useTaskStore from './store/useTaskStore';
import useAuth from './hooks/useAuth';
import useFirestoreSync from './hooks/useFirestoreSync';
import TimeStepper from './components/ui/TimeStepper';
import { getToday } from './utils/dateHelpers';
import { Plus, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [timerTaskId, setTimerTaskId] = useState(null);
  const theme = useSettingsStore((s) => s.theme);
  const isOnboarded = useSettingsStore((s) => s.isOnboarded);
  const isGuest = useSettingsStore((s) => s.isGuest);

  // Auth
  const { user, loading: authLoading } = useAuth();

  // Firestore sync (only when authenticated)
  useFirestoreSync(user);

  // Determine app state
  const isAuthenticated = !!user;
  const canAccessApp = isAuthenticated || isGuest;

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Handle start timer from dashboard
  const handleStartTimer = useCallback((taskId) => {
    setTimerTaskId(taskId);
    setActiveTab('focus');
  }, []);

  // Handle guest mode activation
  const handleGuestMode = useCallback(() => {
    // isGuest is set in Login component
    // Will trigger re-render and show onboarding or app
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    // isOnboarded is set in Onboarding component
    // Will trigger re-render
  }, []);

  // Auth loading state
  if (authLoading && !isGuest) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p className="body-sm text-muted" style={{ marginTop: 16 }}>Loading...</p>
      </div>
    );
  }

  // Show login if not authenticated and not guest
  if (!canAccessApp) {
    return <Login onGuestMode={handleGuestMode} />;
  }

  // Show onboarding if first time
  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Render active page
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            key="home"
            onOpenSettings={() => setShowSettings(true)}
            onStartTimer={handleStartTimer}
            onOpenAddTask={() => setShowAddTask(true)}
          />
        );
      case 'goals':
        return <Goals key="goals" onOpenSettings={() => setShowSettings(true)} />;
      case 'focus':
        return <Focus key="focus" initialTaskId={timerTaskId} />;
      case 'stats':
        return <Stats key="stats" />;
      case 'diary':
        return <Diary key="diary" />;
      default:
        return <Dashboard key="home" />;
    }
  };

  return (
    <div className="app-shell">
      {/* Page content area */}
      <div className="app-shell__content">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <Settings
            onClose={() => setShowSettings(false)}
            user={user}
            isGuest={isGuest}
          />
        )}
      </AnimatePresence>

      {/* Quick Add Task Modal */}
      <Modal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Quick Add Task"
      >
        <QuickAddTaskForm onClose={() => setShowAddTask(false)} />
      </Modal>
    </div>
  );
}

/* ─── Quick Add Task Form ───────────────── */
function QuickAddTaskForm({ onClose }) {
  const addTask = useTaskStore((s) => s.addTask);
  const { categories } = useSettingsStore();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [targetHours, setTargetHours] = useState(1);
  const [targetMinutes, setTargetMinutes] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      type: 'daily',
      subject,
      priority,
      targetMinutes: (targetHours * 60) + targetMinutes,
      loggedMinutes: 0,
      targetDate: getToday(),
      subTasks: [],
      status: 'active',
      isRecurring: false,
      recurringInterval: null,
      dependsOn: null,
      notes: '',
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 14 }}>
        <label className="body-sm" style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>
          Task Title *
        </label>
        <input
          className="input input--warm w-full"
          placeholder="e.g., Finish project proposal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="body-sm" style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>
          Category
        </label>
        <select
          className="select w-full"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Select category...</option>
          {categories.map((s) => (
            <option key={s.key} value={s.key}>{s.name}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="body-sm" style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>
          Priority
        </label>
        <div className="flex gap-xs">
          {[
            { key: 'critical', label: '🔴 Critical' },
            { key: 'high', label: '🟠 High' },
            { key: 'medium', label: '🟡 Medium' },
            { key: 'low', label: '🟢 Low' },
          ].map((p) => (
            <button
              key={p.key}
              type="button"
              className={`btn ${priority === p.key ? 'btn--primary' : 'btn--ghost'} btn--sm`}
              style={{ flex: 1, fontSize: '0.6875rem' }}
              onClick={() => setPriority(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label className="body-sm" style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>
          Target Time
        </label>
        <div className="flex gap-md" style={{ justifyContent: 'center' }}>
          <TimeStepper
            value={targetHours}
            onChange={setTargetHours}
            min={0}
            max={12}
            label="Hours"
            unit="hrs"
          />
          <TimeStepper
            value={targetMinutes}
            onChange={setTargetMinutes}
            min={0}
            max={55}
            step={5}
            label="Minutes"
            unit="min"
          />
        </div>
      </div>

      <div className="flex gap-sm">
        <button type="submit" className="btn btn--primary" style={{ flex: 1 }}>
          Add Task
        </button>
        <button type="button" className="btn btn--ghost" style={{ flex: 1 }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
