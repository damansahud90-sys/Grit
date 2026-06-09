import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/ui/BottomNav';
import AddTaskModal from './components/AddTaskModal';
import FloatingTimer from './components/ui/FloatingTimer';
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
        return <Focus key="focus" onOpenSettings={() => setShowSettings(true)} />;
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
      {/* Floating timer pill — visible when timer is running and not on Focus tab */}
      {activeTab !== 'focus' && (
        <FloatingTimer onTap={() => setActiveTab('focus')} />
      )}

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
      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
      />
    </div>
  );
}

/* ─── Quick Add Task Form ───────────────── */

