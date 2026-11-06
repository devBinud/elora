/**
 * The Firebase JS SDK ships `getReactNativePersistence` in its React Native
 * build (selected at runtime by Metro's "react-native" export condition), but
 * the public `firebase/auth` typings don't declare it. This augmentation adds
 * the missing declaration.
 */
import 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
