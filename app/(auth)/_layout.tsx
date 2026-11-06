import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);

  // The root layout's Stack.Protected already hides these screens once signed
  // in. This is a fallback so a signed-in user is never left on a login form.
  if (status === 'signedIn') return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: aurora.background },
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
