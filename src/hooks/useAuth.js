// ═══════════════════════════════════════════════════════
//  Grit — useAuth Hook
//  Wraps Firebase Authentication with a clean React API
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
} from 'firebase/auth';
import { auth } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

const googleProvider = new GoogleAuthProvider();

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes & handle redirect result
  useEffect(() => {
    // Check if we just came back from a Google Redirect
    getRedirectResult(auth).catch((err) => {
      console.error('Redirect sign-in error:', err);
      setError(getErrorMessage(err.code));
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Friendly error messages
  const getErrorMessage = (code) => {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered. Try signing in.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    return messages[code] || 'Something went wrong. Please try again.';
  };

  // Sign up with email/password
  const signUp = useCallback(async (email, password, displayName) => {
    setError(null);
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      return result.user;
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with email/password
  const signIn = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Sign in with Google (using Native Google Sign-In for Capacitor, fall back to Redirect for Web)
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await GoogleSignIn.signIn({
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '314917536663-414ev8tjiiqldq37pmca5nmfb4644rt3.apps.googleusercontent.com',
        });
        const credential = GoogleAuthProvider.credential(result.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
      } else {
        await signInWithRedirect(auth, googleProvider);
        // Result will be handled by getRedirectResult in useEffect
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      setError(getErrorMessage(err.code || err.message));
      setLoading(false);
      throw err;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError: () => setError(null),
  };
}
