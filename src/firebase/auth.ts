import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { devProxyHost } from '@/config/dev-proxy';
import { TimeoutError, withTimeout } from '@/utils/with-timeout';

import { getFirebaseApp } from './config';

/** Upper bound for a single auth request, so the UI never spins forever. */
const AUTH_TIMEOUT_MS = 25_000;

function logAuth(message: string, detail?: unknown): void {
  if (__DEV__) console.log(`[auth] ${message}`, detail ?? '');
}

let authInstance: Auth | null = null;

/** Returns the Auth instance, persisted to AsyncStorage on native platforms. */
export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (Platform.OS === 'web') {
    authInstance = getAuth(app);
  } else {
    try {
      authInstance = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      // initializeAuth throws if Auth was already initialised (e.g. after a
      // Fast Refresh reload). Fall back to the existing instance.
      authInstance = getAuth(app);
    }
    routeThroughDevProxy(authInstance);
  }
  return authInstance;
}

/**
 * Development only: sends Auth requests through the PC proxy (see
 * src/config/dev-proxy.ts). Firebase Auth builds request URLs as
 * `${apiScheme}://${apiHost}${path}`, so a host with a path prefix routes
 * every call to the matching proxy route.
 */
function routeThroughDevProxy(auth: Auth): void {
  if (!devProxyHost) return;
  const config = auth.config as { apiScheme: string; apiHost: string; tokenApiHost: string };
  config.apiScheme = 'http';
  config.apiHost = `${devProxyHost}/identitytoolkit`;
  config.tokenApiHost = `${devProxyHost}/securetoken`;
  logAuth('routing through dev proxy', devProxyHost);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  logAuth('signing in');
  const credential = await withTimeout(
    signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password),
    AUTH_TIMEOUT_MS,
    'Sign in',
  );
  logAuth('signed in', credential.user.uid);
  return credential.user;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  logAuth('creating account');
  const credential = await withTimeout(
    createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password),
    AUTH_TIMEOUT_MS,
    'Create account',
  );
  logAuth('account created', credential.user.uid);

  // The account exists at this point, so a failed name update must not block
  // sign-up. The name can be set again later from settings.
  const name = displayName.trim();
  if (name) {
    try {
      await withTimeout(
        updateProfile(credential.user, { displayName: name }),
        AUTH_TIMEOUT_MS,
        'Save name',
      );
    } catch (error) {
      logAuth('saving display name failed', error);
    }
  }
  return credential.user;
}

export function sendPasswordReset(email: string): Promise<void> {
  return withTimeout(
    sendPasswordResetEmail(getFirebaseAuth(), email.trim()),
    AUTH_TIMEOUT_MS,
    'Password reset',
  );
}

export function signOutUser(): Promise<void> {
  return signOut(getFirebaseAuth());
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'No internet connection. Check your network and try again.',
  'auth/operation-not-allowed':
    'Email/password sign-in is not enabled for this Firebase project.',
};

/** Converts Firebase auth errors into short, human-readable messages. */
export function describeAuthError(error: unknown): string {
  logAuth('request failed', error);
  if (error instanceof TimeoutError) {
    return "Elora couldn't reach Firebase. Check your internet connection and try again.";
  }
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? `Something went wrong (${error.code}). Please try again.`;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
