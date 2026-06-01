import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Palette, Timer, BookOpen, Database,
  Info, Sun, Moon, Download, Upload, Trash2, ChevronRight,
  Plus, X, Tag, LogOut, Shield, Cloud
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useSettingsStore from '../store/useSettingsStore';
import { getCategoryColor, CATEGORY_COLORS } from '../utils/subjects';
import TimeStepper from '../components/ui/TimeStepper';

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 60 },
};

export default function Settings({ onClose, user, isGuest }) {
  const { signOut } = useAuth();
  const {
    userName, targetDate, targetName, theme, dailyTargetHours,
    pomodoroFocus, pomodoroShortBreak, pomodoroLongBreak,
    categories, categoryTargets,
    updateSetting, updateCategoryTarget, toggleTheme,
    addCategory, updateCategory, deleteCategory,
    exportData, importData,
  } = useSettingsStore();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [editingCatKey, setEditingCatKey] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const json = exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      importData(text);
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    localStorage.removeItem('grit-settings');
    localStorage.removeItem('grit-tasks');
    localStorage.removeItem('grit-diary');
    window.location.reload();
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const key = newCatName.trim().toLowerCase().replace(/\s+/g, '-');
    // Avoid duplicates
    if (categories.some((c) => c.key === key)) return;
    addCategory({ key, name: newCatName.trim(), color: newCatColor, icon: 'tag' });
    setNewCatName('');
    setNewCatColor(CATEGORY_COLORS[0]);
    setShowAddCategory(false);
  };

  const startEditCategory = (cat) => {
    setEditingCatKey(cat.key);
    setEditCatName(cat.name);
    setEditCatColor(cat.color);
  };

  const saveEditCategory = () => {
    if (!editCatName.trim() || !editingCatKey) return;
    updateCategory(editingCatKey, { name: editCatName.trim(), color: editCatColor });
    setEditingCatKey(null);
    setEditCatName('');
    setEditCatColor('');
  };

  return (
    <motion.div
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'var(--bg-primary)',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-sm">
          <motion.button
            className="btn btn--icon"
            whileTap={{ scale: 0.85 }}
            onClick={onClose}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <h1 className="heading-lg">Settings</h1>
        </div>
      </div>

      <div className="page-content">
        {/* Profile Section */}
        <SettingsSection icon={<User size={18} />} title="Profile">
          <SettingsField label="Your Name">
            <input
              className="input input--warm"
              value={userName}
              onChange={(e) => updateSetting('userName', e.target.value)}
              placeholder="Enter your name"
            />
          </SettingsField>
          <SettingsField label="Target Name">
            <input
              className="input input--warm"
              value={targetName}
              onChange={(e) => updateSetting('targetName', e.target.value)}
              placeholder="e.g., CPA Exam, Product Launch"
            />
          </SettingsField>
          <SettingsField label="Target Date">
            <input
              className="input input--warm"
              type="date"
              value={targetDate}
              onChange={(e) => updateSetting('targetDate', e.target.value)}
            />
          </SettingsField>
          <SettingsField label="Daily Goal">
            <TimeStepper
              value={dailyTargetHours}
              onChange={(v) => updateSetting('dailyTargetHours', v)}
              min={1}
              max={16}
              label="Daily Goal"
              unit="hours"
            />
          </SettingsField>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection icon={<Palette size={18} />} title="Appearance">
          <div className="flex-between items-center" style={{ padding: '12px 0' }}>
            <div className="flex items-center gap-sm">
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span style={{ fontWeight: 500 }}>Dark Mode</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className="toggle-switch__slider"></span>
            </label>
          </div>
        </SettingsSection>

        {/* Pomodoro Config */}
        <SettingsSection icon={<Timer size={18} />} title="Pomodoro Timer">
          <div className="flex gap-md" style={{ justifyContent: 'center' }}>
            <TimeStepper
              value={pomodoroFocus}
              onChange={(v) => updateSetting('pomodoroFocus', v)}
              min={5}
              max={120}
              step={5}
              label="Focus"
              unit="min"
            />
            <TimeStepper
              value={pomodoroShortBreak}
              onChange={(v) => updateSetting('pomodoroShortBreak', v)}
              min={1}
              max={30}
              label="Short Break"
              unit="min"
            />
            <TimeStepper
              value={pomodoroLongBreak}
              onChange={(v) => updateSetting('pomodoroLongBreak', v)}
              min={5}
              max={60}
              step={5}
              label="Long Break"
              unit="min"
            />
          </div>
        </SettingsSection>

        {/* Category Manager */}
        <SettingsSection icon={<Tag size={18} />} title="Categories">
          <div className="flex-col gap-xs">
            {categories.map((cat) => (
              <div key={cat.key}>
                {editingCatKey === cat.key ? (
                  <div className="flex-col gap-xs" style={{
                    padding: 12,
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    <input
                      className="input input--warm"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                      placeholder="Category name"
                      autoFocus
                    />
                    <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                      {CATEGORY_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: c,
                            border: editCatColor === c
                              ? '3px solid var(--text-primary)'
                              : '2px solid transparent',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          onClick={() => setEditCatColor(c)}
                        />
                      ))}
                    </div>
                    <div className="flex gap-xs">
                      <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={saveEditCategory}>
                        Save
                      </button>
                      <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={() => setEditingCatKey(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-between items-center" style={{ padding: '8px 0' }}>
                    <button
                      className="flex items-center gap-sm"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => startEditCategory(cat)}
                    >
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: cat.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{cat.name}</span>
                    </button>
                    <button
                      className="btn btn--icon"
                      style={{ color: 'var(--text-light)' }}
                      onClick={() => deleteCategory(cat.key)}
                      aria-label={`Delete ${cat.name}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add category inline form */}
          <AnimatePresence>
            {showAddCategory ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}
              >
                <input
                  className="input input--warm"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name"
                  autoFocus
                  style={{ marginBottom: 10 }}
                />
                <div className="flex gap-xs" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: c,
                        border: newCatColor === c
                          ? '3px solid var(--text-primary)'
                          : '2px solid transparent',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onClick={() => setNewCatColor(c)}
                    />
                  ))}
                </div>
                <div className="flex gap-xs">
                  <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={handleAddCategory}>
                    Add
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCatName('');
                      setNewCatColor(CATEGORY_COLORS[0]);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                className="btn btn--ghost w-full"
                style={{ marginTop: 8 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAddCategory(true)}
              >
                <Plus size={16} /> Add Category
              </motion.button>
            )}
          </AnimatePresence>
        </SettingsSection>

        {/* Category Hour Targets */}
        <SettingsSection icon={<BookOpen size={18} />} title="Category Hour Targets">
          <motion.button
            className="btn btn--ghost w-full"
            style={{ justifyContent: 'space-between' }}
            onClick={() => setShowSubjects(!showSubjects)}
            whileTap={{ scale: 0.98 }}
          >
            <span>{showSubjects ? 'Hide categories' : 'Configure category targets'}</span>
            <ChevronRight
              size={16}
              style={{
                transform: showSubjects ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            />
          </motion.button>

          {showSubjects && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex-col gap-sm"
              style={{ marginTop: 12 }}
            >
              {categories.map((cat) => (
                <div key={cat.key} className="flex-between items-center" style={{ padding: '8px 0' }}>
                  <div className="flex items-center gap-sm">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: getCategoryColor(cat.key),
                        flexShrink: 0,
                      }}
                    />
                    <span className="body-sm" style={{ fontWeight: 500 }}>{cat.name}</span>
                  </div>
                  <TimeStepper
                    value={categoryTargets[cat.key] || 0}
                    onChange={(v) => updateCategoryTarget(cat.key, v)}
                    min={0}
                    max={500}
                    step={5}
                    unit="hrs"
                  />
                </div>
              ))}
            </motion.div>
          )}
        </SettingsSection>

        {/* Data Management */}
        <SettingsSection icon={<Database size={18} />} title="Data">
          <div className="flex-col gap-sm" style={{ padding: '8px 0' }}>
            <motion.button
              className="btn btn--secondary w-full"
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              style={{ justifyContent: 'flex-start', gap: 10 }}
            >
              <Download size={16} />
              Export Data (JSON)
            </motion.button>

            <motion.button
              className="btn btn--secondary w-full"
              whileTap={{ scale: 0.97 }}
              onClick={() => fileInputRef.current?.click()}
              style={{ justifyContent: 'flex-start', gap: 10 }}
            >
              <Upload size={16} />
              Import Data (JSON)
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />

            {!showClearConfirm ? (
              <motion.button
                className="btn btn--danger w-full"
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowClearConfirm(true)}
                style={{ justifyContent: 'flex-start', gap: 10 }}
              >
                <Trash2 size={16} />
                Clear All Data
              </motion.button>
            ) : (
              <div className="card" style={{
                padding: 16,
                border: '2px solid var(--accent-rust)',
                background: 'rgba(196,98,45,0.05)',
              }}>
                <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--accent-rust)' }}>
                  ⚠️ Are you sure? This will permanently delete ALL your data.
                </p>
                <div className="flex gap-sm">
                  <button className="btn btn--danger" style={{ flex: 1 }} onClick={handleClearAll}>
                    Yes, delete everything
                  </button>
                  <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setShowClearConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>

        {/* Account */}
        <SettingsSection icon={<Shield size={18} />} title="Account">
          {user ? (
            <div style={{ padding: '8px 0' }}>
              <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--accent-amber-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: 'var(--accent-amber)', fontSize: '1rem',
                }}>
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  {user.displayName && <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.displayName}</p>}
                  <p className="body-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-xs" style={{ marginBottom: 12 }}>
                <Cloud size={14} style={{ color: 'var(--accent-sage)' }} />
                <span className="body-sm" style={{ color: 'var(--accent-sage)', fontWeight: 500 }}>
                  Data synced to cloud
                </span>
              </div>
              <motion.button
                className="btn btn--secondary w-full"
                whileTap={{ scale: 0.97 }}
                onClick={signOut}
                style={{ justifyContent: 'flex-start', gap: 10 }}
              >
                <LogOut size={16} />
                Sign Out
              </motion.button>
            </div>
          ) : isGuest ? (
            <div style={{ padding: '8px 0', textAlign: 'center' }}>
              <p className="body-sm" style={{ marginBottom: 12 }}>
                You're using Grit as a guest. Sign up to sync your data across devices.
              </p>
              <motion.button
                className="btn btn--primary w-full"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  updateSetting('isGuest', false);
                  onClose();
                }}
              >
                Create Account
              </motion.button>
            </div>
          ) : null}
        </SettingsSection>

        {/* About */}
        <SettingsSection icon={<Info size={18} />} title="About">
          <div style={{ padding: '12px 0', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: 4 }}>
              Grit
            </h3>
            <p className="body-sm" style={{ fontStyle: 'italic', marginBottom: 8 }}>
              "Small steps. Big wins."
            </p>
            <p className="body-sm">Version 2.0.0</p>
            <p className="body-sm" style={{ marginTop: 4, color: 'var(--text-light)' }}>
              Your personal productivity journal.
            </p>
          </div>
        </SettingsSection>

        {/* Bottom spacing */}
        <div style={{ height: 32 }} />
      </div>
    </motion.div>
  );
}

function SettingsSection({ icon, title, children }) {
  return (
    <div className="card card--elevated" style={{ padding: 20, marginBottom: 12 }}>
      <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
        <span style={{ color: 'var(--accent-amber)' }}>{icon}</span>
        <h2 className="heading-md" style={{ fontSize: '1rem' }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SettingsField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="body-sm" style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
