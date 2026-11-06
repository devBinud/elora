import { LogBox } from 'react-native';

/**
 * Development only: hides one known false alarm.
 *
 * Importing expo-notifications sets up remote-push token registration, and in
 * Expo Go on Android that logs "Android Push notifications (remote
 * notifications) functionality ... was removed from Expo Go". Elora uses
 * only LOCAL notifications (voice reminders), which work in Expo Go, so the
 * message doesn't apply. It never appears in development or release builds.
 *
 * Loaded first from index.ts so it runs before expo-notifications.
 */
const EXPO_GO_PUSH_WARNING = 'expo-notifications: Android Push notifications (remote notifications)';

if (__DEV__) {
  // Hide it from the in-app error toast...
  LogBox.ignoreLogs([EXPO_GO_PUSH_WARNING]);

  // ...and from the Metro terminal. Every other error is passed through.
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].startsWith(EXPO_GO_PUSH_WARNING)) return;
    originalError(...args);
  };
}
