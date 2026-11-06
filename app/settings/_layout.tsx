import { Stack } from 'expo-router';

import { aurora } from '@/theme/aurora';

/** Settings pages draw their own aurora header (with a back button). */
export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'ios_from_right',
        contentStyle: { backgroundColor: aurora.background },
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
