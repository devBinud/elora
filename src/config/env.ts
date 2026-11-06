/**
 * Typed access to public environment variables.
 *
 * Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so each variable must
 * be referenced with its full literal name (no dynamic lookups).
 */
export const firebaseEnv = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
} as const;

export const functionsRegion = process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'asia-south1';

const REQUIRED_FIREBASE_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'] as const;

export const missingFirebaseKeys: string[] = REQUIRED_FIREBASE_KEYS.filter(
  (key) => !firebaseEnv[key],
);

export const isFirebaseConfigured = missingFirebaseKeys.length === 0;
