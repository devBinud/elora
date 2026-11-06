/// <reference types="node" />
import { existsSync } from 'node:fs';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Elora app configuration.
 *
 * Values that differ between machines/environments come from environment
 * variables (see .env.example). Nothing secret belongs in this file.
 */
const ANDROID_PACKAGE = process.env.ELORA_ANDROID_PACKAGE ?? 'com.elora.assistant';

// Firebase Android config (download from the Firebase console). On EAS, provide
// it as a file environment variable named GOOGLE_SERVICES_JSON.
const GOOGLE_SERVICES_FILE = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Elora',
  slug: 'elora',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'elora',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: ANDROID_PACKAGE,
  },
  android: {
    package: ANDROID_PACKAGE,
    // Required for FCM push notifications (Phase 4); optional until then.
    googleServicesFile: existsSync(GOOGLE_SERVICES_FILE) ? GOOGLE_SERVICES_FILE : undefined,
    adaptiveIcon: {
      backgroundColor: '#4C1D95',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        // Brand splash: Elora violet with the white wordmark, in light and dark mode.
        // Keep in sync with src/components/aurora/brand-splash.tsx.
        backgroundColor: '#5B21B6',
        image: './assets/images/splash-logo.png',
        imageWidth: 180,
        dark: { backgroundColor: '#5B21B6', image: './assets/images/splash-logo.png' },
      },
    ],
    'expo-sqlite',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        color: '#8B5CF6',
      },
    ],
    [
      'expo-audio',
      { microphonePermission: 'Allow Elora to hear your voice replies to reminders.' },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Allow Elora to use the microphone so you can reply to reminders by voice.',
        speechRecognitionPermission: 'Allow Elora to recognise your voice replies, like “OK”.',
        androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'],
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
