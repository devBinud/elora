import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unknown';

/**
 * Current notification permission, refreshed when the app returns to the
 * foreground (e.g. after the user changes it in system Settings).
 */
export function useNotificationPermission() {
  const [status, setStatus] = useState<NotificationPermission>('unknown');
  const [canAskAgain, setCanAskAgain] = useState(true);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') return;
    const result = await Notifications.getPermissionsAsync();
    setStatus(result.status as NotificationPermission);
    setCanAskAgain(result.canAskAgain);
  }, []);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  /** Shows the system prompt, or opens Settings if Android won't ask again. */
  const enable = useCallback(async () => {
    if (canAskAgain) {
      const result = await Notifications.requestPermissionsAsync();
      setStatus(result.status as NotificationPermission);
      setCanAskAgain(result.canAskAgain);
      if (result.status === 'granted' || result.canAskAgain) return;
    }
    await Linking.openSettings();
  }, [canAskAgain]);

  return { status, enable, openSettings: () => Linking.openSettings() };
}
