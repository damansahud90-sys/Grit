// ═══════════════════════════════════════════════════════
//  Grit — Login / Sign Up Page
//  Beautiful auth page with Cozy Café aesthetic
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Flame } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import useSettingsStore from '../store/useSettingsStore';

export default function Login({ onGuestMode }) {
  const { signIn, signUp, signInWithGoogle, resetPassword, error, loading, clearError } = useAuth();
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (mode === 'reset') {
      if (!email.trim()) {
        setLocalError('Please enter your email.');
        return;
      }
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch { /* error handled by hook */ }
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setLocalError('Please enter your name.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords don\'t match.');
        return;
      }
      try {
        await signUp(email, password, name);
        updateSetting('userName', name);
        updateSetting('isGuest', false);
      } catch { /* error handled by hook */ }
    } else {
      try {
        await signIn(email, password);
        updateSetting('isGuest', false);
      } catch { /* error handled by hook */ }
    }
  };

  const handleGoogle = async () => {
    clearError();
    try {
      const user = await signInWithGoogle();
      if (user.displayName) {
        updateSetting('userName', user.displayName);
      }
      updateSetting('isGuest', false);
    } catch { /* error handled by hook */ }
  };

  const handleGuest = () => {
    updateSetting('isGuest', true);
    updateSetting('isOnboarded', false);
    onGuestMode();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError('');
    setResetSent(false);
    clearError();
  };

  const displayError = localError || error;

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-decoration" />

      <motion.div
        className="login-container"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="login-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="login-logo__icon">
            <Flame size={32} />
          </div>
          <h1 className="login-logo__title">Grit</h1>
          <p className="login-logo__tagline">Small steps. Big wins.</p>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          className="login-card"
          layout
        >
          {/* Tab Switcher */}
          {mode !== 'reset' && (
            <div className="login-tabs">
              <button
                className={`login-tabs__tab ${mode === 'signin' ? 'login-tabs__tab--active' : ''}`}
                onClick={() => switchMode('signin')}
              >
                Sign In
              </button>
              <button
                className={`login-tabs__tab ${mode === 'signup' ? 'login-tabs__tab--active' : ''}`}
                onClick={() => switchMode('signup')}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Error display */}
          <AnimatePresence>
            {displayError && (
              <motion.div
                className="login-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {displayError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset password success */}
          <AnimatePresence>
            {resetSent && (
              <motion.div
                className="login-success"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                Password reset email sent! Check your inbox.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              className="login-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'reset' ? (
                <>
                  <p className="body-sm" style={{ textAlign: 'center', marginBottom: 16 }}>
                    Enter your email and we'll send you a reset link.
                  </p>
                  <div className="login-input-group">
                    <Mail size={18} className="login-input-icon" />
                    <input
                      className="login-input"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                  <motion.button
                    className="btn btn--primary w-full btn--lg"
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </motion.button>
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => switchMode('signin')}
                  >
                    ← Back to Sign In
                  </button>
                </>
              ) : (
                <>
                  {/* Name field (sign up only) */}
                  {mode === 'signup' && (
                    <motion.div
                      className="login-input-group"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <User size={18} className="login-input-icon" />
                      <input
                        className="login-input"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                      />
                    </motion.div>
                  )}

                  {/* Email */}
                  <div className="login-input-group">
                    <Mail size={18} className="login-input-icon" />
                    <input
                      className="login-input"
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="login-input-group">
                    <Lock size={18} className="login-input-icon" />
                    <input
                      className="login-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      required
                    />
                    <button
                      type="button"
                      className="login-input-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Confirm password (sign up only) */}
                  {mode === 'signup' && (
                    <motion.div
                      className="login-input-group"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <Lock size={18} className="login-input-icon" />
                      <input
                        className="login-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                    </motion.div>
                  )}

                  {/* Forgot password */}
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="login-link login-link--right"
                      onClick={() => switchMode('reset')}
                    >
                      Forgot password?
                    </button>
                  )}

                  {/* Submit */}
                  <motion.button
                    className="btn btn--primary w-full btn--lg"
                    type="submit"
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                  >
                    {loading ? (
                      <span className="login-spinner" />
                    ) : (
                      <>
                        {mode === 'signup' ? 'Create Account' : 'Sign In'}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </motion.button>

                  {/* Divider */}
                  <div className="login-divider">
                    <span>or</span>
                  </div>

                  {/* Google Sign In */}
                  <motion.button
                    className="btn btn--secondary w-full btn--lg login-google-btn"
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </motion.button>
                </>
              )}
            </motion.form>
          </AnimatePresence>
        </motion.div>

        {/* Guest mode */}
        <motion.button
          className="login-guest-btn"
          onClick={handleGuest}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Continue as Guest
          <span className="body-sm" style={{ display: 'block', fontSize: '0.6875rem', opacity: 0.7, marginTop: 2 }}>
            Data saved locally only
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
