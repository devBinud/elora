import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getLocalDb } from '@/database/sqlite';
// Registers synced features with the sync engine (import for side effects).
import '@/features/journal/journal-repository';
import '@/features/voice/voice-reminders-repository';
import { useAuthListener } from '@/features/auth/use-auth-listener';
import { startNetworkMonitor } from '@/services/connectivity/network-monitor';
import { refreshPendingCount, syncNow } from '@/services/synchronization';
import { useAuthStore } from '@/store/auth-store';

type BootstrapState = { ready: boolean; error: Error | null };

/**
 * Starts the app's long-lived services:
 * - opens the local database and runs migrations,
 * - listens to Firebase Auth,
 * - watches connectivity,
 * - syncs on sign-in, on reconnect and when the app returns to the foreground.
 */
export function useAppBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({ ready: false, error: null });
  const uid = useAuthStore((s) => s.user?.uid ?? null);

  useAuthListener();

  useEffect(() => {
    getLocalDb()
      .then(() => setState({ ready: true, error: null }))
      .catch((error: unknown) =>
        setState({
          ready: false,
          error: error instanceof Error ? error : new Error(String(error)),
        }),
      );
  }, []);

  useEffect(() => startNetworkMonitor(() => void syncNow()), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void syncNow();
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!uid || !state.ready) return;
    void refreshPendingCount();
    void syncNow();
  }, [uid, state.ready]);

  return state;
}
