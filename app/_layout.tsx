import {
  DarkTheme,
  ThemeProvider,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandSplash } from '@/components/aurora/brand-splash';
import { AppText } from '@/components/common';
import { CenteredMessage } from '@/components/layout/centered-message';
import { isFirebaseConfigured, missingFirebaseKeys } from '@/config/env';
import { runNetworkProbe } from '@/dev/network-probe';
import { useAppBootstrap } from '@/hooks/use-app-bootstrap';
import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';
import { useAppFonts } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync();

/** The launch screen stays at least this long, so the logo never just flashes. */
const MIN_SPLASH_MS = 900;

export default function RootLayout() {
  const { ready, error } = useAppBootstrap();
  const status = useAuthStore((s) => s.status);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const fontsReady = useAppFonts();

  const isLoaded =
    fontsReady &&
    (!isFirebaseConfigured || error !== null || (ready && status !== 'initializing'));

  const [minSplashDone, setMinSplashDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);
  const showSplash = !isLoaded || !minSplashDone;

  // Fallback: hide the native splash once loaded, even if BrandSplash's
  // onShown didn't fire.
  useEffect(() => {
    if (isLoaded) void SplashScreen.hideAsync();
  }, [isLoaded]);

  useEffect(() => {
    runNetworkProbe();
  }, []);

  // Elora's screens are always dark (aurora), so navigation uses a dark theme
  // to avoid white flashes during screen transitions.
  const navigationTheme = useMemo<NavTheme>(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: aurora.lilac,
        background: aurora.background,
        card: aurora.background,
        text: aurora.text,
        border: aurora.glassBorder,
        notification: aurora.danger,
      },
    }),
    [],
  );

  let content: React.ReactNode;
  if (!isFirebaseConfigured) {
    content = <FirebaseSetupNotice />;
  } else if (error) {
    content = (
      <CenteredMessage
        title="Elora couldn't start"
        message={`The local database failed to open: ${error.message}`}
      />
    );
  } else if (!isLoaded) {
    content = null; // Splash screen is still visible.
  } else {
    const isSignedIn = status === 'signedIn';
    content = (
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: aurora.background },
          headerTintColor: aurora.text,
          headerTitleStyle: { fontWeight: '600' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: aurora.background },
        }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen
            name="article/[id]"
            options={{ headerShown: false, animation: 'ios_from_right' }}
          />
          <Stack.Screen name="reminders/index" options={{ headerShown: false, animation: 'ios_from_right' }} />
          <Stack.Screen name="reminders/[id]" options={{ headerShown: false, animation: 'ios_from_right' }} />
          <Stack.Screen
            name="entry/[id]"
            options={{ headerShown: false, animation: 'ios_from_right' }}
          />
          <Stack.Protected guard={isAdmin}>
            <Stack.Screen name="admin" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack.Protected>

        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="light" />
        {content}
        {/* Same picture as the native splash; it takes over, then fades into the app. */}
        <BrandSplash visible={showSplash} onShown={() => void SplashScreen.hideAsync()} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function FirebaseSetupNotice() {
  return (
    <CenteredMessage
      title="Connect Firebase"
      message="Elora needs your Firebase project settings before it can start.">
      <AppText variant="caption" tone="muted" align="center">
        1. Copy .env.example to .env{'\n'}
        2. Fill in the values from Firebase console, then Project settings, then Your apps{'\n'}
        3. Restart the dev server with: npx expo start --clear
      </AppText>
      <AppText variant="caption" tone="subtle" align="center">
        Missing: {missingFirebaseKeys.join(', ')}
      </AppText>
    </CenteredMessage>
  );
}
