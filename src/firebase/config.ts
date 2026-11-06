import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';

import { firebaseEnv, isFirebaseConfigured, missingFirebaseKeys } from '@/config/env';

export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super(
      `Firebase is not configured. Missing: ${missingFirebaseKeys.join(', ')}. ` +
        'Copy .env.example to .env and fill in your Firebase web app config.',
    );
    this.name = 'FirebaseNotConfiguredError';
  }
}

/** Returns the singleton Firebase app, initialising it on first use. */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new FirebaseNotConfiguredError();
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseEnv);
}

export { isFirebaseConfigured };
