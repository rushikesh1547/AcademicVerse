'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((error) => {
    // We can log this, but for anonymous sign-in, failures are less common unless disabled.
    console.error("Anonymous sign-in error:", error);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password).catch((error) => {
      // This error is expected if the user already exists, which is a possible outcome
      // of our sign-in-then-sign-up logic. We don't need to log it as a critical error.
      if (error.code !== 'auth/email-already-in-use') {
        console.error("Sign up error:", error);
      }
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
    .catch((error) => {
        // The 'auth/invalid-credential' error is thrown for security reasons if the user
        // doesn't exist or the password is wrong. For this prototyping tool, we'll
        // assume a failed sign-in means the user needs to be created.
        console.warn(`Sign-in for ${email} failed (Code: ${error.code}). Attempting to create a new account.`);
        initiateEmailSignUp(authInstance, email, password);
    });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
