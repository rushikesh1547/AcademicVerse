'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((error) => {
    // We can log this, but for anonymous sign-in, failures are less common unless disabled.
    console.error("Anonymous sign-in error:", error);
    toast({
      variant: 'destructive',
      title: 'Anonymous Sign-In Failed',
      description: 'Could not sign you in anonymously. Please try again.',
    });
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password).catch((error) => {
      // This error is expected if the user already exists, which is a possible outcome
      // of our sign-in-then-sign-up logic. We don't need to log it as a critical error.
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: 'This email is already in use. Please log in instead.',
        });
      } else {
        console.error("Sign up error:", error);
        toast({
          variant: 'destructive',
          title: 'Registration Error',
          description: error.message,
        });
      }
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
        if (error.code === 'auth/invalid-credential') {
            toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: 'Invalid email or password. Please try again or sign up.',
            });
        } else {
            console.error("Sign in error:", error);
            toast({
              variant: 'destructive',
              title: 'Login Error',
              description: error.message,
            });
        }
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
