import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import {
  Settings, User, TrendingUp, TrendingDown, Minus, Plus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import useTaskStore from '../store/useTaskStore';
import useSettingsStore from '../store/useSettingsStore';
import {
  calcDailyEfficiency, calcWeeklyData, calcMonthlyHeatmap,
  calcHourlyDistribution, calcSubjectHours,
} from '../utils/calculations';
import { getCategoryColor, getCategoryName } from '../utils/subjects';
import Modal from '../components/ui/Modal';

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const HEATMAP_COLORS = ['var(--bg-secondary)', '#FEF3C7', '#FDE68A', '#F59E0B', '#D97706'];

export default function Stats({ onOpenSettings }) {
  const { sessions, mockScores, addMockScore } = useTaskStore();
  const { dailyTargetHours, categoryTargets, categories } = useSettingsStore();

  const [showMockModal, setShowMockModal] = useState(false);
  const [mockForm, setMockForm] = useState({ name: '', score: '', percentile: '', rank: '' });

  const today = dayjs().format('YYYY-MM-DD');
  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  // Calculated data
  const hourlyData = useMemo(() => calcHourlyDistribution(sessions, today), [sessions, today]);
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.startTime && s.startTime.startsWith(today)),
    [sessions, today]
  );
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const efficiency = calcDailyEfficiency(todayMinutes, dailyTargetHours * 60);
  const weeklyData = useMemo(() => {
    const data = calcWeeklyData(sessions);
    return data.map(d => ({ ...d, day: d.dayLabel, actual: d.hours, target: dailyTargetHours }));
  }, [sessions, dailyTargetHours]);
  const heatmapData = useMemo(() => {
    const data = calcMonthlyHeatmap(sessions, currentYear, currentMonth);
    return data.map(d => ({ ...d, level: d.intensity, dayOfWeek: dayjs(d.date).day() }));
  }, [sessions, currentYear, currentMonth]);
  const subjectHours = useMemo(() => {
    const result = {};
    categories.forEach(s => {
      result[s.key] = calcSubjectHours(sessions, s.key);
    });
    return result;
  }, [sessions, categories]);

  // Calculate real efficiency delta (this week vs last week)
  const efficiencyDelta = useMemo(() => {
    const startOfThisWeek = dayjs().startOf('week');
    const startOfLastWeek = startOfThisWeek.subtract(7, 'day');
    const endOfLastWeek = startOfThisWeek.subtract(1, 'day');

    const thisWeekSessions = sessions.filter((s) => {
      if (!s.startTime) return false;
      const d = dayjs(s.startTime);
      return d.isAfter(startOfThisWeek.subtract(1, 'day')) || d.isSame(startOfThisWeek, 'day');
    });
    const lastWeekSessions = sessions.filter((s) => {
      if (!s.startTime) return false;
      const d = dayjs(s.startTime);
      return (d.isAfter(startOfLastWeek.subtract(1, 'day')) || d.isSame(startOfLastWeek, 'day'))
        && (d.isBefore(endOfLastWeek.add(1, 'day')) || d.isSame(endOfLastWeek, 'day'));
    });

    const thisWeekMin = thisWeekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const lastWeekMin = lastWeekSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

    if (lastWeekMin === 0) return null;
    return Math.round(((thisWeekMin - lastWeekMin) / lastWeekMin) * 100);
  }, [sessions]);

  // Heatmap grid layout
  const firstDayOfWeek = heatmapData.length > 0 ? heatmapData[0].dayOfWeek : 0;
  const paddedHeatmap = [
    ...Array.from({ length: firstDayOfWeek }, (_, i) => ({
      date: '',
      day: '',
      hours: 0,
      level: -1,
      dayOfWeek: i,
    })),
    ...heatmapData,
  ];

  const handleAddMock = () => {
    if (!mockForm.name || !mockForm.score) return;
    addMockScore({
      name: mockForm.name,
      score: Number(mockForm.score),
      percentile: mockForm.percentile ? Number(mockForm.percentile) : null,
      rank: mockForm.rank || '',
    });
    setMockForm({ name: '', score: '', percentile: '', rank: '' });
    setShowMockModal(false);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '0.75rem',
          boxShadow: 'var(--shadow-soft)',
        }}
      >
        <p style={{ fontWeight: 600 }}>{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value} {p.name === 'minutes' ? 'min' : 'hrs'}
          </p>
        ))}
      </div>
    );
  };

  // Filter categories that have recorded hours
  const activeCategories = categories.filter((cat) => (subjectHours[cat.key] || 0) > 0);

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
        {/* Daily Rhythm */}
        <div className="card card--elevated" style={{ padding: 20 }}>
          <h3 className="heading-md" style={{ marginBottom: 16 }}>Daily Rhythm</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="minutes" name="minutes" fill="var(--accent-amber)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency */}
        <div className="card card--elevated" style={{ padding: 20 }}>
          <h3 className="heading-md" style={{ marginBottom: 16 }}>Efficiency</h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 0',
          }}>
            {/* SVG Donut */}
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="70" cy="70" r="58"
                  fill="none"
                  stroke="var(--bg-secondary)"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="70" cy="70" r="58"
                  fill="none"
                  stroke="var(--accent-amber)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 58}
                  initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - efficiency / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}
              >
                <span
                  className="heading-xl"
                  style={{ color: 'var(--accent-amber)', fontSize: '2.5rem' }}
                >
                  {efficiency}
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>%</span>
              </div>
            </div>
            <span className="body-sm" style={{ marginTop: 4 }}>Focus Score</span>
            {efficiencyDelta !== null ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 14px',
                  background: efficiencyDelta >= 0 ? 'var(--accent-sage-light)' : 'rgba(196,98,45,0.1)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: efficiencyDelta >= 0 ? 'var(--accent-sage)' : 'var(--accent-rust)',
                  marginTop: 12,
                }}
              >
                {efficiencyDelta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {efficiencyDelta >= 0 ? '+' : ''}{efficiencyDelta}% from last week
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginTop: 12,
                }}
              >
                <Minus size={12} /> —
              </span>
            )}
          </div>
        </div>

        {/* Weekly Flow */}
        <div className="card card--elevated" style={{ padding: 20 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 className="heading-md">Weekly Flow</h3>
            <div className="flex items-center gap-md">
              <div className="flex items-center gap-xs">
                <span style={{
                  width: 8, height: 8, borderRadius: 'var(--radius-full)',
                  background: 'var(--accent-amber)',
                }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Actual</span>
              </div>
              <div className="flex items-center gap-xs">
                <span style={{
                  width: 8, height: 8, borderRadius: 'var(--radius-full)',
                  background: 'var(--border-medium)',
                }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Target</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={12} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actual" name="Actual" fill="var(--accent-amber)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="target" name="Target" fill="var(--border-medium)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Heatmap */}
        <div className="card card--elevated" style={{ padding: 20 }}>
          <h3 className="heading-md" style={{ marginBottom: 16 }}>Monthly Heatmap</h3>
          {/* Day of week labels */}
          <div style={{ display: 'flex', marginBottom: 4 }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.625rem',
                color: 'var(--text-light)',
                fontWeight: 600,
              }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
          }}>
            {paddedHeatmap.map((cell, i) => (
              <motion.div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  background: cell.level === -1 ? 'transparent' : HEATMAP_COLORS[cell.level] || HEATMAP_COLORS[0],
                  color: cell.level >= 3 ? '#fff' : cell.level >= 1 ? '#78350F' : 'var(--text-light)',
                }}
                whileHover={{ scale: 1.1 }}
                title={cell.date ? `${cell.date}: ${cell.hours}h` : ''}
              >
                {cell.day}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Subject Progress */}
        <div className="card card--elevated" style={{ padding: 20 }}>
          <h3 className="heading-md" style={{ marginBottom: 16 }}>Subject Progress</h3>
          {activeCategories.length === 0 ? (
            <p className="body-sm" style={{ textAlign: 'center', padding: 16 }}>
              No category hours recorded yet.
            </p>
          ) : (
            activeCategories.map((cat) => {
              const hours = subjectHours[cat.key] || 0;
              const target = categoryTargets?.[cat.key] || 50;
              const pct = Math.min(Math.round((hours / target) * 100), 100);
              const circumference = 2 * Math.PI * 16;

              return (
                <div
                  key={cat.key}
                  className="flex items-center gap-md"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  {/* Mini ring */}
                  <div style={{ width: 44, height: 44, flexShrink: 0 }}>
                    <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="22" cy="22" r="16"
                        fill="none"
                        stroke="var(--bg-secondary)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="22" cy="22" r="16"
                        fill="none"
                        stroke={getCategoryColor(cat.key)}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - pct / 100)}
                      />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {getCategoryName(cat.key)}
                    </div>
                    <div className="body-sm" style={{ fontSize: '0.75rem' }}>
                      {hours.toFixed(1)}h / {target}h — {pct}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Mock Test Score Log */}
        <div className="card card--elevated" style={{ padding: 20 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 className="heading-md">Mock Test Scores</h3>
            <button
              className="btn btn--sm btn--primary"
              onClick={() => setShowMockModal(true)}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          {mockScores.length === 0 ? (
            <p className="body-sm" style={{ textAlign: 'center', padding: 16 }}>
              No mock scores logged yet.
            </p>
          ) : (
            <div>
              {mockScores.map((score) => (
                <div
                  key={score.id}
                  className="flex-between"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{score.name}</div>
                    <div className="body-sm" style={{ fontSize: '0.75rem' }}>{score.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: 'var(--accent-amber)',
                    }}>
                      {score.score}
                    </div>
                    {score.percentile && (
                      <div className="body-sm" style={{ fontSize: '0.6875rem' }}>
                        {score.percentile}%ile
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Mock Score Modal */}
      <Modal
        isOpen={showMockModal}
        onClose={() => setShowMockModal(false)}
        title="Add Mock Score"
      >
        <div className="flex-col gap-md">
          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Mock Test Name
            </label>
            <input
              className="input"
              placeholder="e.g., Practice Test 1"
              value={mockForm.name}
              onChange={(e) => setMockForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="flex gap-sm">
            <div style={{ flex: 1 }}>
              <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Score
              </label>
              <input
                className="input"
                type="number"
                placeholder="Marks"
                value={mockForm.score}
                onChange={(e) => setMockForm((f) => ({ ...f, score: e.target.value }))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                Percentile
              </label>
              <input
                className="input"
                type="number"
                placeholder="%"
                value={mockForm.percentile}
                onChange={(e) => setMockForm((f) => ({ ...f, percentile: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
              Rank (optional)
            </label>
            <input
              className="input"
              placeholder="Self-assessed rank"
              value={mockForm.rank}
              onChange={(e) => setMockForm((f) => ({ ...f, rank: e.target.value }))}
            />
          </div>
          <button className="btn btn--primary btn--lg w-full" onClick={handleAddMock}>
            Save Score
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
