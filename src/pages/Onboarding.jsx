// ═══════════════════════════════════════════════════════
//  Grit — Onboarding Flow
//  3-step welcome for first-time users
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, ArrowRight, ArrowLeft, Check, Plus, X } from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';
import { DEFAULT_CATEGORIES, CATEGORY_COLORS } from '../utils/subjects';
import TimeStepper from '../components/ui/TimeStepper';

const STEPS = ['welcome', 'categories', 'target'];

export default function Onboarding({ onComplete }) {
  const { userName, updateSetting, addCategory, deleteCategory } = useSettingsStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(userName || '');

  // Category management
  const [selectedCategories, setSelectedCategories] = useState(
    DEFAULT_CATEGORIES.map((c) => ({ ...c }))
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[5]);

  // Target settings
  const [targetName, setTargetName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [dailyHours, setDailyHours] = useState(6);

  const currentStep = STEPS[step];

  const handleNext = () => {
    if (step === 0) {
      updateSetting('userName', name);
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = () => {
    // Save all settings
    updateSetting('userName', name);
    updateSetting('targetName', targetName);
    updateSetting('targetDate', targetDate);
    updateSetting('dailyTargetHours', dailyHours);

    // Clear default categories and set selected ones
    DEFAULT_CATEGORIES.forEach((c) => deleteCategory(c.key));
    selectedCategories.forEach((c) => addCategory(c));

    updateSetting('isOnboarded', true);
    onComplete();
  };

  const addCustomCategory = () => {
    if (!newCatName.trim()) return;
    const key = newCatName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (selectedCategories.find((c) => c.key === key)) return;
    setSelectedCategories([
      ...selectedCategories,
      { key, name: newCatName.trim(), color: newCatColor, icon: 'folder' },
    ]);
    setNewCatName('');
    setShowAddForm(false);
  };

  const removeCategory = (key) => {
    setSelectedCategories(selectedCategories.filter((c) => c.key !== key));
  };

  const togglePresetCategory = (preset) => {
    const exists = selectedCategories.find((c) => c.key === preset.key);
    if (exists) {
      removeCategory(preset.key);
    } else {
      setSelectedCategories([...selectedCategories, { ...preset }]);
    }
  };

  return (
    <div className="onboarding-page">
      <motion.div
        className="onboarding-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Progress dots */}
        <div className="onboarding-progress">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={`onboarding-dot ${i <= step ? 'onboarding-dot--active' : ''}`}
              animate={{ scale: i === step ? 1.3 : 1 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Welcome */}
          {currentStep === 'welcome' && (
            <motion.div
              key="welcome"
              className="onboarding-step"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="onboarding-icon">
                <Flame size={48} />
              </div>
              <h1 className="heading-xl" style={{ textAlign: 'center', marginBottom: 8 }}>
                Welcome to Grit
              </h1>
              <p className="body-text text-muted text-center" style={{ marginBottom: 32 }}>
                Your personal productivity journal. Let's set things up.
              </p>

              <div style={{ width: '100%', maxWidth: 320 }}>
                <label className="body-sm" style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  What should we call you?
                </label>
                <input
                  className="input input--warm"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  style={{ fontSize: '1.125rem', padding: '14px 18px' }}
                />
              </div>
            </motion.div>
          )}

          {/* Step 2: Categories */}
          {currentStep === 'categories' && (
            <motion.div
              key="categories"
              className="onboarding-step"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="heading-lg text-center" style={{ marginBottom: 4 }}>
                What do you focus on?
              </h2>
              <p className="body-sm text-muted text-center" style={{ marginBottom: 24 }}>
                Pick categories or create your own. You can change these later.
              </p>

              {/* Preset toggles */}
              <div className="onboarding-categories">
                {DEFAULT_CATEGORIES.map((preset) => {
                  const isSelected = selectedCategories.find((c) => c.key === preset.key);
                  return (
                    <motion.button
                      key={preset.key}
                      className={`onboarding-cat-chip ${isSelected ? 'onboarding-cat-chip--active' : ''}`}
                      style={{
                        borderColor: isSelected ? preset.color : 'var(--border-medium)',
                        background: isSelected ? `${preset.color}15` : 'transparent',
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePresetCategory(preset)}
                    >
                      <span
                        className="onboarding-cat-dot"
                        style={{ background: preset.color }}
                      />
                      {preset.name}
                      {isSelected && <Check size={14} style={{ color: preset.color }} />}
                    </motion.button>
                  );
                })}

                {/* Custom categories added */}
                {selectedCategories
                  .filter((c) => !DEFAULT_CATEGORIES.find((d) => d.key === c.key))
                  .map((cat) => (
                    <motion.div
                      key={cat.key}
                      className="onboarding-cat-chip onboarding-cat-chip--active"
                      style={{
                        borderColor: cat.color,
                        background: `${cat.color}15`,
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <span className="onboarding-cat-dot" style={{ background: cat.color }} />
                      {cat.name}
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => removeCategory(cat.key)}
                      >
                        <X size={14} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    </motion.div>
                  ))}
              </div>

              {/* Add custom */}
              {showAddForm ? (
                <motion.div
                  className="card"
                  style={{ padding: 16, marginTop: 16 }}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <input
                    className="input input--warm"
                    placeholder="Category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    autoFocus
                    style={{ marginBottom: 10 }}
                  />
                  <div className="flex flex-wrap gap-xs" style={{ marginBottom: 12 }}>
                    {CATEGORY_COLORS.map((color) => (
                      <motion.button
                        key={color}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: color,
                          border: newCatColor === color ? '3px solid var(--text-primary)' : '2px solid transparent',
                          cursor: 'pointer',
                        }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setNewCatColor(color)}
                      />
                    ))}
                  </div>
                  <div className="flex gap-sm">
                    <button className="btn btn--primary btn--sm" style={{ flex: 1 }} onClick={addCustomCategory}>
                      Add
                    </button>
                    <button className="btn btn--ghost btn--sm" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  className="btn btn--ghost w-full"
                  style={{ marginTop: 12 }}
                  onClick={() => setShowAddForm(true)}
                  whileTap={{ scale: 0.97 }}
                >
                  <Plus size={16} /> Add Custom Category
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Step 3: Target */}
          {currentStep === 'target' && (
            <motion.div
              key="target"
              className="onboarding-step"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="heading-lg text-center" style={{ marginBottom: 4 }}>
                Set your goal
              </h2>
              <p className="body-sm text-muted text-center" style={{ marginBottom: 24 }}>
                Optional — you can always set this later.
              </p>

              <div style={{ width: '100%', maxWidth: 320 }}>
                <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                  Goal Name
                </label>
                <input
                  className="input input--warm"
                  placeholder="e.g., CPA Exam, Product Launch, Marathon"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  style={{ marginBottom: 16 }}
                />

                <label className="body-sm" style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>
                  Target Date
                </label>
                <input
                  className="input input--warm"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{ marginBottom: 24 }}
                />

                <label className="body-sm" style={{ fontWeight: 600, marginBottom: 12, display: 'block', textAlign: 'center' }}>
                  Daily Target Hours
                </label>
                <div className="flex-center">
                  <TimeStepper
                    value={dailyHours}
                    onChange={setDailyHours}
                    min={1}
                    max={16}
                    label=""
                    unit="hours / day"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="onboarding-nav">
          {step > 0 ? (
            <motion.button
              className="btn btn--ghost"
              onClick={handleBack}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={18} /> Back
            </motion.button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <motion.button
              className="btn btn--primary btn--lg"
              onClick={handleNext}
              whileTap={{ scale: 0.97 }}
            >
              Next <ArrowRight size={18} />
            </motion.button>
          ) : (
            <motion.button
              className="btn btn--primary btn--lg"
              onClick={handleFinish}
              whileTap={{ scale: 0.97 }}
            >
              Let's Go! <Flame size={18} />
            </motion.button>
          )}
        </div>

        {/* Skip */}
        {step < STEPS.length - 1 && (
          <button
            className="login-link"
            style={{ marginTop: 8, textAlign: 'center' }}
            onClick={handleFinish}
          >
            Skip setup
          </button>
        )}
      </motion.div>
    </div>
  );
}
