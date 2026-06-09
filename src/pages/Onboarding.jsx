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

const STEPS = ['welcome', 'target'];

export default function Onboarding({ onComplete }) {
  const { userName, updateSetting, addCategory, deleteCategory } = useSettingsStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(userName || '');

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
    updateSetting('dailyTargetHours', dailyHours);

    // Ensure default categories are present
    DEFAULT_CATEGORIES.forEach((c) => {
      deleteCategory(c.key);
      addCategory(c);
    });

    updateSetting('isOnboarded', true);
    onComplete();
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
