import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, User, Clock, MoreVertical, ChevronRight, ChevronDown,
  Plus, X, Check, Calendar, Flame, Zap, AlertTriangle, Trash2, Edit3,
} from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import useSettingsStore from '../store/useSettingsStore';
import { getCategoryColor, getCategoryName } from '../utils/subjects';
import { formatDuration, getToday } from '../utils/dateHelpers';
import dayjs from 'dayjs';
import { calcProgressPercent } from '../utils/calculations';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import Modal from '../components/ui/Modal';
import AddTaskModal from '../components/AddTaskModal';

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const TAB_OPTIONS = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const PRIORITY_OPTIONS = [
  { key: 'critical', label: 'Critical', icon: <Flame size={12} /> },
  { key: 'high', label: 'High', icon: <Zap size={12} /> },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export default function Goals({ onOpenSettings }) {
  const { tasks, updateTask, deleteTask, toggleSubTask, carryForwardTask } = useTaskStore();
  const { categories } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('daily');
  const [showAddModal, setShowAddModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showCarryModal, setShowCarryModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const today = getToday();
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  // Carry-forward tasks
  const carryForwardTasks = useMemo(
    () => tasks.filter(
      (t) => t.targetDate === yesterday && t.status === 'active' && t.type === 'daily'
    ),
    [tasks, yesterday]
  );

  // Filtered tasks
  const filteredTasks = useMemo(
    () => tasks.filter((t) => t.type === activeTab && t.status !== 'completed'),
    [tasks, activeTab]
  );

  // Edit form state (lightweight — only for editing existing tasks)
  const [editForm, setEditForm] = useState({});

  const handleEdit = (task) => {
    setEditForm({
      title: task.title,
      type: task.type,
      subject: task.subject || '',
      priority: task.priority || 'medium',
      targetMinutes: task.targetMinutes || 0,
      notes: task.notes || '',
    });
    setEditingTask(task);
    setMenuOpenId(null);
  };

  const handleSaveEdit = () => {
    if (!editForm.title?.trim() || !editingTask) return;
    updateTask(editingTask.id, {
      title: editForm.title.trim(),
      type: editForm.type,
      subject: editForm.subject,
      priority: editForm.priority,
      targetMinutes: editForm.targetMinutes,
      notes: editForm.notes,
    });
    setEditingTask(null);
  };

  const handleDelete = (id) => {
    deleteTask(id);
    setMenuOpenId(null);
  };

  const handleCarryForward = () => {
    carryForwardTasks.forEach((t) => carryForwardTask(t.id));
    setShowCarryModal(false);
  };

  const getPriorityClass = (priority) => {
    const map = { critical: 'badge--critical', high: 'badge--high', medium: 'badge--medium', low: 'badge--low' };
    return map[priority] || 'badge--medium';
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'critical') return <Flame size={10} />;
    if (priority === 'high') return <Zap size={10} />;
    return null;
  };

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

      <div className="page-content">
        {/* Carry-forward banner */}
        {carryForwardTasks.length > 0 && (
          <motion.div
            className="card"
            style={{
              background: 'linear-gradient(135deg, var(--accent-amber-light), rgba(232,168,56,0.05))',
              border: '1px solid rgba(232,168,56,0.3)',
              padding: '12px 16px',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-between">
              <div className="flex items-center gap-sm">
                <Clock size={16} style={{ color: 'var(--accent-amber)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                  {carryForwardTasks.length} task{carryForwardTasks.length > 1 ? 's' : ''} from yesterday {carryForwardTasks.length > 1 ? 'are' : 'is'} incomplete. Carry forward?
                </span>
              </div>
              <button
                className="btn btn--sm btn--secondary"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  borderColor: 'var(--accent-amber)',
                  color: 'var(--accent-amber)',
                }}
                onClick={() => setShowCarryModal(true)}
              >
                REVIEW
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab Switcher */}
        <div className="tab-switcher">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-switcher__tab ${activeTab === tab.key ? 'tab-switcher__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Goal Cards */}
        {filteredTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <AlertTriangle size={32} style={{ color: 'var(--text-light)', marginBottom: 8 }} />
            <p className="body-sm">No {activeTab} goals yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="flex-col gap-md">
            {filteredTasks.map((task, idx) => {
              const progress = calcProgressPercent(task.loggedMinutes || 0, task.targetMinutes || 0);
              const subjectColor = getCategoryColor(task.subject);
              const isExpanded = expandedId === task.id;

              return (
                <motion.div
                  key={task.id}
                  className="card card--elevated"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ padding: 20, position: 'relative' }}
                >
                  {/* Header badges + menu */}
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <div className="flex gap-xs flex-wrap">
                      <span className={`badge ${getPriorityClass(task.priority)}`}>
                        {getPriorityIcon(task.priority)}
                        {(task.priority || 'Medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                      </span>
                      {task.subject && (
                        <span
                          className="badge badge--subject"
                          style={{
                            background: `${subjectColor}18`,
                            color: subjectColor,
                          }}
                        >
                          {getCategoryName(task.subject)}
                        </span>
                      )}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        className="btn btn--icon"
                        style={{ width: 32, height: 32, padding: 0 }}
                        onClick={() => setMenuOpenId(menuOpenId === task.id ? null : task.id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      <AnimatePresence>
                        {menuOpenId === task.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-md)',
                              boxShadow: 'var(--shadow-elevated)',
                              minWidth: 140,
                              zIndex: 50,
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              className="flex items-center gap-sm w-full"
                              style={{
                                padding: '10px 14px',
                                fontSize: '0.875rem',
                                textAlign: 'left',
                              }}
                              onClick={() => handleEdit(task)}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button
                              className="flex items-center gap-sm w-full"
                              style={{
                                padding: '10px 14px',
                                fontSize: '0.875rem',
                                color: 'var(--accent-rust)',
                                textAlign: 'left',
                              }}
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="heading-md" style={{ fontSize: '1.0625rem', marginBottom: 8 }}>
                    {task.title}
                  </h3>

                  {/* Time progress */}
                  <div className="flex-between" style={{ marginBottom: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                    }}>
                      {formatDuration(task.loggedMinutes || 0)} / {formatDuration(task.targetMinutes || 0)}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{progress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="progress-bar" style={{ marginBottom: 12 }}>
                    <motion.div
                      className="progress-bar__fill"
                      style={{ background: subjectColor || 'var(--accent-amber)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>

                  {/* SubTasks */}
                  {task.subTasks && task.subTasks.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                      <button
                        className="flex items-center gap-xs"
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          fontWeight: 500,
                          padding: '4px 0',
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : task.id)}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {task.subTasks.length} Sub-tasks
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                          >
                            {task.subTasks.map((st) => (
                              <div
                                key={st.id}
                                className="flex items-center gap-sm"
                                style={{ padding: '6px 0' }}
                              >
                                <motion.button
                                  className="flex-center"
                                  style={{
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    border: st.done
                                      ? 'none'
                                      : '2px solid var(--border-medium)',
                                    background: st.done ? 'var(--accent-sage)' : 'transparent',
                                    color: '#fff',
                                    flexShrink: 0,
                                  }}
                                  whileTap={{ scale: 0.8 }}
                                  onClick={() => toggleSubTask(task.id, st.id)}
                                >
                                  {st.done && <Check size={10} strokeWidth={3} />}
                                </motion.button>
                                <span
                                  style={{
                                    fontSize: '0.8125rem',
                                    textDecoration: st.done ? 'line-through' : 'none',
                                    color: st.done ? 'var(--text-light)' : 'var(--text-primary)',
                                  }}
                                >
                                  {st.text}
                                </span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Target date */}
                  {task.targetDate && (
                    <div
                      className="flex items-center gap-xs"
                      style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 8 }}
                    >
                      <Calendar size={14} />
                      {task.targetDate === today
                        ? `Today`
                        : new Date(task.targetDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <FloatingActionButton onClick={() => setShowAddModal(true)} />

      {/* Add Task Modal (unified component) */}
      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTaskCreated={() => {}}
      />

      {/* Lightweight Edit Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Edit Goal"
      >
        <div className="flex-col gap-md">
          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Title
            </label>
            <input
              className="input"
              value={editForm.title || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              autoFocus
            />
          </div>

          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Type
            </label>
            <div className="tab-switcher">
              {TAB_OPTIONS.map((t) => (
                <button
                  key={t.key}
                  className={`tab-switcher__tab ${editForm.type === t.key ? 'tab-switcher__tab--active' : ''}`}
                  onClick={() => setEditForm((f) => ({ ...f, type: t.key }))}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Category
            </label>
            <select
              className="select"
              value={editForm.subject || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
            >
              <option value="">Select category...</option>
              {categories.map((s) => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Priority
            </label>
            <div className="flex gap-xs flex-wrap">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  className={`badge ${getPriorityClass(p.key)}`}
                  style={{
                    padding: '8px 14px',
                    cursor: 'pointer',
                    outline: editForm.priority === p.key ? '2px solid var(--accent-amber)' : 'none',
                    outlineOffset: 2,
                  }}
                  onClick={() => setEditForm((f) => ({ ...f, priority: p.key }))}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </div>

          {editForm.notes !== undefined && (
            <div>
              <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Notes
              </label>
              <textarea
                className="textarea"
                value={editForm.notes || ''}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                style={{ minHeight: 60 }}
              />
            </div>
          )}

          <button className="btn btn--primary btn--lg w-full" onClick={handleSaveEdit}>
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Carry Forward Modal */}
      <Modal
        isOpen={showCarryModal}
        onClose={() => setShowCarryModal(false)}
        title="Carry Forward Tasks"
      >
        <p className="body-sm mb-md">
          These tasks from yesterday are incomplete. Tap "Carry Forward" to move them to today.
        </p>
        {carryForwardTasks.map((task) => (
          <div key={task.id} className="card mb-sm" style={{ padding: '12px 16px' }}>
            <div className="flex-between">
              <span style={{ fontWeight: 500 }}>{task.title}</span>
              {task.subject && (
                <span
                  className="badge badge--subject"
                  style={{
                    background: `${getCategoryColor(task.subject)}18`,
                    color: getCategoryColor(task.subject),
                  }}
                >
                  {getCategoryName(task.subject)}
                </span>
              )}
            </div>
          </div>
        ))}
        <button className="btn btn--primary w-full mt-md" onClick={handleCarryForward}>
          Carry Forward All
        </button>
      </Modal>
    </motion.div>
  );
}
