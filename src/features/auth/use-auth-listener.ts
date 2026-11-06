import { useEffect } from 'react';

import { isFirebaseConfigured } from '@/config/env';
import { subscribeToAuthChanges } from '@/firebase/auth';
import { fetchIsAdmin } from '@/firebase/firestore';
import { useAuthStore } from '@/store/auth-store';

/**
 * Mirrors Firebase Auth state into the auth store and resolves admin access.
 * Mount once, at the root of the app.
 */
export function useAuthListener(): void {
  useEffect(() => {
    if (!isFirebaseConfigured) {
      useAuthStore.getState().setSignedOut();
      return;
    }

    let currentUid: string | null = null;
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (__DEV__) console.log('[auth] state changed:', user ? user.uid : 'signed out');
      const store = useAuthStore.getState();
      if (!user) {
        currentUid = null;
        store.setSignedOut();
        return;
      }

      currentUid = user.uid;
      store.setSignedIn({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
      });

      void fetchIsAdmin(user.uid).then((isAdmin) => {
        // Ignore stale results if the user changed while we were waiting.
        if (currentUid === user.uid) useAuthStore.getState().setIsAdmin(isAdmin);
      });
    });

    return unsubscribe;
  }, []);
}
