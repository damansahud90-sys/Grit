/**
 * Grit — AddTaskModal
 * Unified, simplified task creation modal.
 * Used by Dashboard FAB, Goals FAB, and Focus page.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Plus, X, Flame, Zap } from 'lucide-react';
import useTaskStore from '../store/useTaskStore';
import useSettingsStore from '../store/useSettingsStore';
import Modal from './ui/Modal';

const DURATION_CHIPS = [
  { label: '30m', mins: 30 },
  { label: '1h', mins: 60 },
  { label: '2h', mins: 120 },
];

const PRIORITY_OPTIONS = [
  { key: 'critical', label: 'Critical', icon: <Flame size={12} /> },
  { key: 'high', label: 'High', icon: <Zap size={12} /> },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

const PRIORITY_CLASSES = {
  critical: 'badge--critical',
  high: 'badge--high',
  medium: 'badge--medium',
  low: 'badge--low',
};

/**
 * Smart category detection from title text.
 * Returns category key or empty string.
 */
function detectCategory(title) {
  const t = title.toLowerCase();
  if (/\b(study|learn|read|revision|exam|homework)\b/.test(t)) return 'study';
  if (/\b(work|meeting|email|office|project|deadline)\b/.test(t)) return 'work';
  if (/\b(gym|run|exercise|workout|health|yoga|walk)\b/.test(t)) return 'health';
  return '';
}

export default function AddTaskModal({ isOpen, onClose, onTaskCreated }) {
  const { addTask } = useTaskStore();
  const { categories } = useSettingsStore();
  const titleRef = useRef(null);

  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [customDuration, setCustomDuration] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('medium');
  const [notes, setNotes] = useState('');
  const [subTasks, setSubTasks] = useState([]);
  const [newSubTask, setNewSubTask] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setSelectedDuration(null);
      setCustomDuration('');
      setShowMore(false);
      setSubject('');
      setPriority('medium');
      setNotes('');
      setSubTasks([]);
      setNewSubTask('');
      // Auto-focus title input after modal animation
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Smart category detection on title change
  useEffect(() => {
    if (!showMore) {
      const detected = detectCategory(title);
      if (detected) setSubject(detected);
    }
  }, [title, showMore]);

  const getTargetMinutes = useCallback(() => {
    if (selectedDuration !== null) return selectedDuration;
    if (customDuration) return parseInt(customDuration, 10) || 0;
    return 0;
  }, [selectedDuration, customDuration]);

  const handleAddSubTask = useCallback(() => {
    if (!newSubTask.trim()) return;
    setSubTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newSubTask.trim(), done: false },
    ]);
    setNewSubTask('');
  }, [newSubTask]);

  const handleRemoveSubTask = useCallback((id) => {
    setSubTasks((prev) => prev.filter((st) => st.id !== id));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;

    const targetMinutes = getTargetMinutes();
    const taskData = {
      title: title.trim(),
      type: 'daily',
      subject,
      priority,
      targetMinutes: targetMinutes || 60,
      subTasks,
      notes,
    };

    const newTask = addTask(taskData);
    onTaskCreated?.(newTask);
    onClose();
  }, [title, subject, priority, subTasks, notes, getTargetMinutes, addTask, onTaskCreated, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Task">
      <div className="flex-col gap-md">
        {/* Title input */}
        <div>
          <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
            What do you want to do?
          </label>
          <input
            ref={titleRef}
            className="input input--warm"
            placeholder="e.g., Complete project proposal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Duration chips */}
        <div>
          <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
            How long? <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(optional)</span>
          </label>
          <div className="flex gap-xs flex-wrap items-center">
            {DURATION_CHIPS.map((chip) => (
              <motion.button
                key={chip.label}
                className="badge"
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  outline: selectedDuration === chip.mins ? '2px solid var(--accent-amber)' : 'none',
                  outlineOffset: 2,
                  background: selectedDuration === chip.mins ? 'var(--accent-amber-light, rgba(232,168,56,0.1))' : undefined,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedDuration(selectedDuration === chip.mins ? null : chip.mins);
                  setCustomDuration('');
                }}
              >
                {chip.label}
              </motion.button>
            ))}
            <input
              className="input"
              type="number"
              placeholder="Custom"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value);
                setSelectedDuration(null);
              }}
              style={{ width: 80, padding: '8px 10px', fontSize: '0.8125rem' }}
              min={1}
              max={480}
            />
            {customDuration && (
              <span className="body-sm" style={{ color: 'var(--text-secondary)' }}>min</span>
            )}
          </div>
        </div>

        {/* More options toggle */}
        <button
          className="flex items-center gap-xs"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 0',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
          }}
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          More options
        </button>

        {/* Collapsible more options */}
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="flex-col gap-md">
                {/* Category */}
                <div>
                  <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Category
                  </label>
                  <select
                    className="select"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="">Select category...</option>
                    {categories.map((s) => (
                      <option key={s.key} value={s.key}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Priority
                  </label>
                  <div className="flex gap-xs flex-wrap">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p.key}
                        className={`badge ${PRIORITY_CLASSES[p.key]}`}
                        style={{
                          padding: '8px 14px',
                          cursor: 'pointer',
                          outline: priority === p.key ? '2px solid var(--accent-amber)' : 'none',
                          outlineOffset: 2,
                        }}
                        onClick={() => setPriority(p.key)}
                      >
                        {p.icon} {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Notes
                  </label>
                  <textarea
                    className="textarea"
                    placeholder="Additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    style={{ minHeight: 50 }}
                  />
                </div>

                {/* Sub-tasks */}
                <div>
                  <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                    Sub-tasks
                  </label>
                  {subTasks.map((st) => (
                    <div key={st.id} className="flex items-center gap-sm mb-sm">
                      <span style={{ flex: 1, fontSize: '0.875rem' }}>{st.text}</span>
                      <button
                        className="btn btn--icon"
                        style={{ width: 28, height: 28, padding: 0 }}
                        onClick={() => handleRemoveSubTask(st.id)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {subTasks.length < 10 && (
                    <div className="flex gap-sm">
                      <input
                        className="input"
                        placeholder="Add a sub-task..."
                        value={newSubTask}
                        onChange={(e) => setNewSubTask(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                        style={{ flex: 1 }}
                      />
                      <button className="btn btn--primary btn--sm" onClick={handleAddSubTask}>
                        <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button className="btn btn--primary btn--lg w-full" onClick={handleSubmit}>
          Create Task
        </button>
      </div>
    </Modal>
  );
}
