import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { create } from 'zustand';

import { voiceMessages } from '@/config/voice-messages';
import { syncNow } from '@/services/synchronization';
import { useAuthStore } from '@/store/auth-store';

import {
  toReminderItem,
  voiceRemindersRepository,
  type VoiceReminderItem,
} from './voice-reminders-repository';

type VoiceRemindersState = {
  /** The signed-in user's reminders, sorted by time. */
  reminders: VoiceReminderItem[];
  loaded: boolean;
};

export const useVoiceRemindersStore = create<VoiceRemindersState>()(() => ({
  reminders: [],
  loaded: false,
}));

const seededKey = (uid: string) => `elora.voice.starterRemindersAdded.${uid}`;

/**
 * Adds the starter reminders from src/config/voice-messages.ts the first time
 * a user opens the app, after checking the cloud so a returning user's own
 * reminders aren't duplicated.
 */
async function addStarterRemindersOnce(uid: string): Promise<void> {
  if (await AsyncStorage.getItem(seededKey(uid))) return;
  await syncNow().catch(() => undefined);
  const existing = await voiceRemindersRepository.list(uid, { limit: 1 });
  if (existing.length === 0) {
    for (const starter of voiceMessages) {
      await voiceRemindersRepository.create(uid, {
        time: starter.time,
        message: starter.message,
        days: starter.days ?? null,
        enabled: starter.enabled !== false,
      });
    }
  }
  await AsyncStorage.setItem(seededKey(uid), '1');
}

/**
 * Keeps `useVoiceRemindersStore` in step with the database for the signed-in
 * user (local edits and changes synced from other devices). Mount once.
 */
export function useVoiceRemindersSync(): void {
  const uid = useAuthStore((s) => s.user?.uid ?? null);

  useEffect(() => {
    if (!uid) {
      useVoiceRemindersStore.setState({ reminders: [], loaded: false });
      return;
    }
    let cancelled = false;
    const load = async () => {
      const rows = await voiceRemindersRepository.list(uid, { orderBy: 'time ASC' });
      if (!cancelled) {
        useVoiceRemindersStore.setState({ reminders: rows.map(toReminderItem), loaded: true });
      }
    };
    void addStarterRemindersOnce(uid)
      .catch(() => undefined)
      .then(load);
    const unsubscribe = voiceRemindersRepository.subscribe(() => void load());
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid]);
}
