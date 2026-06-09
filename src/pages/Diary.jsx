import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Sun, Moon, Search, Plus, Pin, PinOff, Trash2,
  Shuffle, Filter, X, ChevronDown, ChevronUp
} from 'lucide-react';
import useDiaryStore from '../store/useDiaryStore';
import useSettingsStore from '../store/useSettingsStore';
import { getCategoryColor, getCategoryName } from '../utils/subjects';
import { getToday, formatDate } from '../utils/dateHelpers';
import dayjs from 'dayjs';

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const MOOD_OPTIONS = [
  { key: 'low', emoji: '😴', label: 'Low' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'good', emoji: '😊', label: 'Good' },
  { key: 'focused', emoji: '🔥', label: 'Focused' },
];

const NOTE_COLORS = [
  '#E8A838', '#6B8F71', '#9B8BB4', '#5B8DB8', '#C4622D'
];

export default function Diary() {
  const [activeTab, setActiveTab] = useState('journal');
  const tabs = [
    { key: 'journal', label: '📝 Journal' },
    { key: 'mistakes', label: '❌ Mistake Log' },
    { key: 'notes', label: '📌 Pinned Notes' },
  ];

  return (
    <motion.div
      className="page"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
    >
      <div className="page-header">
        <h1 className="heading-lg" style={{ textAlign: 'center', fontFamily: 'var(--font-heading)' }}>
          Grit
        </h1>
      </div>

      <div className="page-content">
        {/* Tab Switcher */}
        <div className="tab-switcher">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-switcher__tab ${activeTab === tab.key ? 'tab-switcher__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'journal' && <JournalTab key="journal" />}
          {activeTab === 'mistakes' && <MistakeTab key="mistakes" />}
          {activeTab === 'notes' && <NotesTab key="notes" />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Journal Tab ────────────────────────── */
function JournalTab() {
  const { entries, addEntry, updateEntry } = useDiaryStore();
  const today = getToday();
  const todayEntry = entries.find((e) => e.date === today);

  const [morningIntention, setMorningIntention] = useState(todayEntry?.morningIntention || '');
  const [eveningReflection, setEveningReflection] = useState(todayEntry?.eveningReflection || '');
  const [freeText, setFreeText] = useState(todayEntry?.freeText || '');
  const [mood, setMood] = useState(todayEntry?.mood || 'okay');

  const saveEntry = (field, value) => {
    const updates = { [field]: value };
    if (field === 'mood') updates.mood = value;

    if (todayEntry) {
      updateEntry(todayEntry.id, updates);
    } else {
      addEntry({
        date: today,
        morningIntention: field === 'morningIntention' ? value : morningIntention,
        eveningReflection: field === 'eveningReflection' ? value : eveningReflection,
        freeText: field === 'freeText' ? value : freeText,
        mood: field === 'mood' ? value : mood,
      });
    }
  };

  const recentEntries = useMemo(() => {
    return entries
      .filter((e) => e.date !== today)
      .sort((a, b) => (a.date > b.date ? -1 : 1))
      .slice(0, 7);
  }, [entries, today]);

  const todayFormatted = dayjs(today).format('dddd, D MMM');
  const dayQuotes = [
    'A moment of calm before the storm.',
    'Today is a fresh start.',
    'Every expert was once a beginner.',
    'Focus on progress, not perfection.',
    'One step at a time.',
    'Your future self will thank you.',
    'Discipline is choosing what you want most.',
  ];
  const dayQuote = dayQuotes[dayjs(today).day()];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Date */}
      <div style={{ marginBottom: 16 }}>
        <h2 className="heading-md" style={{ fontFamily: 'var(--font-heading)' }}>{todayFormatted}</h2>
        <p className="body-sm" style={{ fontStyle: 'italic', marginTop: 2 }}>{dayQuote}</p>
      </div>

      {/* Morning Intention */}
      <div className="card card--elevated" style={{
        borderLeft: '3px solid var(--accent-sage)',
        padding: 20,
        marginBottom: 16
      }}>
        <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
          <Sun size={18} style={{ color: 'var(--accent-amber)' }} />
          <h3 className="heading-md" style={{ fontSize: '1rem' }}>Morning Intention</h3>
        </div>
        <p className="body-sm" style={{ marginBottom: 10, color: 'var(--text-secondary)' }}>
          What is the one essential concept I need to master today?
        </p>
        <textarea
          className="textarea input--warm"
          placeholder="Tap to write..."
          value={morningIntention}
          onChange={(e) => setMorningIntention(e.target.value)}
          onBlur={() => saveEntry('morningIntention', morningIntention)}
          rows={3}
        />
      </div>

      {/* Evening Reflection */}
      <div className="card card--elevated" style={{
        borderLeft: '3px solid var(--accent-sage)',
        padding: 20,
        marginBottom: 16
      }}>
        <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
          <Moon size={18} style={{ color: 'var(--accent-lavender)' }} />
          <h3 className="heading-md" style={{ fontSize: '1rem' }}>Evening Reflection</h3>
        </div>
        <p className="body-sm" style={{ marginBottom: 10, color: 'var(--text-secondary)' }}>
          Where did I lose focus, and how can I adjust tomorrow?
        </p>
        <textarea
          className="textarea input--warm"
          placeholder="Tap to write..."
          value={eveningReflection}
          onChange={(e) => setEveningReflection(e.target.value)}
          onBlur={() => saveEntry('eveningReflection', eveningReflection)}
          rows={3}
        />
      </div>

      {/* Free Text */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <textarea
          className="textarea input--warm"
          placeholder="Free thoughts, notes, anything..."
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          onBlur={() => saveEntry('freeText', freeText)}
          rows={3}
        />
      </div>

      {/* Mood Selector */}
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <span className="body-sm" style={{ fontWeight: 600, marginBottom: 10, display: 'block' }}>
          How are you feeling?
        </span>
        <div className="flex gap-sm" style={{ justifyContent: 'center' }}>
          {MOOD_OPTIONS.map((m) => (
            <motion.button
              key={m.key}
              className="flex-col flex-center"
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: mood === m.key ? '2px solid var(--accent-amber)' : '2px solid transparent',
                background: mood === m.key ? 'var(--accent-amber-light, rgba(232,168,56,0.1))' : 'transparent',
                cursor: 'pointer',
                minWidth: 60,
              }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setMood(m.key);
                saveEntry('mood', m.key);
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{m.emoji}</span>
              <span className="body-sm" style={{ fontSize: '0.6875rem', marginTop: 4 }}>{m.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Entries */}
      <h3 className="heading-md" style={{ fontFamily: 'var(--font-heading)', marginBottom: 12 }}>
        Recent Entries
      </h3>
      {recentEntries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p className="body-sm">No past entries yet. Start journaling today!</p>
        </div>
      ) : (
        <div className="flex-col gap-xs">
          {recentEntries.map((entry) => {
            const moodObj = MOOD_OPTIONS.find((m) => m.key === entry.mood) || MOOD_OPTIONS[1];
            return (
              <div key={entry.id} className="card" style={{ padding: 16 }}>
                <div className="flex-between items-center">
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {dayjs(entry.date).format('ddd, D MMM')}
                  </span>
                  <span style={{ fontSize: '1.25rem' }}>{moodObj.emoji}</span>
                </div>
                {entry.morningIntention && (
                  <p className="body-sm" style={{ marginTop: 8 }}>
                    <strong>Intention:</strong> {entry.morningIntention}
                  </p>
                )}
                {entry.eveningReflection && (
                  <p className="body-sm" style={{ marginTop: 4 }}>
                    <strong>Reflection:</strong> {entry.eveningReflection}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Mistake Log Tab ────────────────────── */
function MistakeTab() {
  const { mistakes, addMistake, deleteMistake, getRandomMistake } = useDiaryStore();
  const { categories } = useSettingsStore();
  const [showForm, setShowForm] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [randomMistake, setRandomMistake] = useState(null);

  // Form state
  const [description, setDescription] = useState('');

  const filteredMistakes = useMemo(() => {
    let list = [...mistakes].sort((a, b) => (a.date > b.date ? -1 : 1));
    if (filterSubject) {
      list = list.filter((m) => m.subject === filterSubject);
    }
    return list;
  }, [mistakes, filterSubject]);

  const handleAdd = () => {
    if (!description.trim()) return;
    addMistake({
      mistakeDescription: description,
    });
    setDescription('');
    setShowForm(false);
  };

  const handleReviewRandom = () => {
    const m = getRandomMistake();
    setRandomMistake(m);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Actions row */}
      <div className="flex gap-sm" style={{ marginBottom: 16 }}>
        <motion.button
          className="btn btn--primary"
          style={{ flex: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={16} /> Add Mistake
        </motion.button>
        <motion.button
          className="btn btn--secondary"
          style={{ flex: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReviewRandom}
        >
          <Shuffle size={16} /> Random Review
        </motion.button>
      </div>

      {/* Random mistake review */}
      <AnimatePresence>
        {randomMistake && (
          <motion.div
            className="card card--elevated"
            style={{ padding: 20, marginBottom: 16, borderLeft: '3px solid var(--accent-rust)' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex-between items-center" style={{ marginBottom: 8 }}>
              <span style={{ fontWeight: 700, color: 'var(--accent-rust)' }}>🎲 Random Review</span>
              <button className="btn btn--icon" onClick={() => setRandomMistake(null)}>
                <X size={16} />
              </button>
            </div>
            {randomMistake.subject && (
              <span className="badge badge--subject" style={{
                background: `${getCategoryColor(randomMistake.subject)}18`,
                color: getCategoryColor(randomMistake.subject),
                marginBottom: 8,
                display: 'inline-block',
              }}>
                {getCategoryName(randomMistake.subject)}
              </span>
            )}
            <p style={{ fontWeight: 500, marginBottom: 4 }}>{randomMistake.mistakeDescription}</p>
            {randomMistake.rootCause && (
              <p className="body-sm"><strong>Root cause:</strong> {randomMistake.rootCause}</p>
            )}
            {randomMistake.lesson && (
              <p className="body-sm" style={{ color: 'var(--accent-sage)', fontWeight: 500, marginTop: 4 }}>
                💡 {randomMistake.lesson}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="card card--elevated"
            style={{ padding: 20, marginBottom: 16 }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="heading-md" style={{ marginBottom: 12 }}>Log a Mistake</h3>

            <textarea
              className="textarea input--warm"
              placeholder="What went wrong today?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
            />

            <div className="flex gap-sm">
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleAdd}>
                Save
              </button>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Mistakes list */}
      {filteredMistakes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>🎯</p>
          <p className="body-sm">
            {mistakes.length === 0
              ? 'No mistakes logged yet. Learning from errors is the fastest path!'
              : 'No mistakes in this category.'}
          </p>
        </div>
      ) : (
        <div className="flex-col gap-xs">
          {filteredMistakes.map((mistake) => (
            <MistakeCard key={mistake.id} mistake={mistake} onDelete={() => deleteMistake(mistake.id)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function MistakeCard({ mistake, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const subjectColor = getCategoryColor(mistake.subject);

  return (
    <motion.div
      className="card"
      style={{ padding: 16 }}
      layout
    >
      <div className="flex-between items-center" style={{ marginBottom: 6 }}>
        <div className="flex items-center gap-xs">
          {mistake.subject && (
            <span
              className="badge badge--subject"
              style={{ background: `${subjectColor}18`, color: subjectColor }}
            >
              {getCategoryName(mistake.subject)}
            </span>
          )}
          <span className="body-sm">{dayjs(mistake.date).format('D MMM')}</span>
        </div>
        <div className="flex items-center gap-xs">
          <button className="btn btn--icon" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button className="btn btn--icon" onClick={onDelete} style={{ color: 'var(--accent-rust)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <p style={{ fontWeight: 500, fontSize: '0.9375rem' }}>{mistake.mistakeDescription}</p>


    </motion.div>
  );
}

/* ─── Pinned Notes Tab ───────────────────── */
function NotesTab() {
  const { notes, addNote, updateNote, deleteNote, togglePinNote } = useDiaryStore();
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    // Pinned first, then by creation date
    list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return a.createdAt > b.createdAt ? -1 : 1;
    });
    return list;
  }, [notes, search]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    if (editId) {
      updateNote(editId, { title, content });
    } else {
      addNote({ title, content });
    }
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditId(null);
    setShowForm(false);
  };

  const startEdit = (note) => {
    setEditId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setShowForm(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Actions */}
      <div className="flex items-center gap-sm" style={{ marginBottom: 12, justifyContent: 'flex-end' }}>
        <motion.button
          className="btn btn--primary btn--icon"
          style={{ width: 44, height: 44, borderRadius: 12 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <Plus size={20} />
        </motion.button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            className="card card--elevated"
            style={{ padding: 20, marginBottom: 16 }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <h3 className="heading-md" style={{ marginBottom: 12 }}>
              {editId ? 'Edit Note' : 'New Note'}
            </h3>
            <input
              className="input input--warm"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <textarea
              className="textarea input--warm"
              placeholder="Write your note..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
            />



            <div className="flex gap-sm">
              <button className="btn btn--primary" style={{ flex: 1 }} onClick={handleSave}>
                {editId ? 'Update' : 'Save'}
              </button>
              <button className="btn btn--ghost" style={{ flex: 1 }} onClick={resetForm}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📝</p>
          <p className="body-sm">
            {notes.length === 0
              ? 'No notes yet. Capture your quick thoughts and formulas!'
              : 'No notes match your search.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}>
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              className="card"
              style={{
                padding: 14,
                borderTop: `3px solid ${NOTE_COLORS[0]}`,
                cursor: 'pointer',
                position: 'relative',
              }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startEdit(note)}
              layout
            >
              {/* Pin indicator */}
              <div style={{ position: 'absolute', top: 8, right: 8 }}>
                <button
                  className="btn btn--icon"
                  style={{ padding: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePinNote(note.id);
                  }}
                >
                  {note.isPinned
                    ? <Pin size={14} style={{ color: 'var(--accent-amber)' }} />
                    : <PinOff size={14} style={{ color: 'var(--text-light)' }} />
                  }
                </button>
              </div>

              <h4 style={{
                fontWeight: 600,
                fontSize: '0.875rem',
                marginBottom: 6,
                paddingRight: 24,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {note.title || 'Untitled'}
              </h4>

              <p className="body-sm" style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.4,
              }}>
                {note.content || ''}
              </p>

              {/* Delete */}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn--icon"
                  style={{ padding: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note.id);
                  }}
                >
                  <Trash2 size={12} style={{ color: 'var(--text-light)' }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
