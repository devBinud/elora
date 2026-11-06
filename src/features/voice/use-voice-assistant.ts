import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuthStore } from '@/store/auth-store';

import { startReminder } from './reminder-session';
import { firstNameOf, getScheduledMessages, renderMessage, runsOn } from './voice-engine';
import { useVoiceRemindersStore, useVoiceRemindersSync } from './voice-reminders-store';
import {
  configureNotificationHandler,
  isVoiceNotification,
  syncVoiceNotifications,
} from './voice-notifications';

const CHECK_INTERVAL_MS = 15_000;
/** A message still plays if the app opens up to this long after its time. */
const GRACE_MS = 2 * 60_000;
const SPOKEN_KEY = 'elora.voice.spokenToday';

/** Notification taps already read aloud (survives re-mounts, not app restarts). */
const handledResponses = new Set<string>();

configureNotificationHandler();

/**
 * Runs Elora's voice messages from `src/config/voice-messages.ts`:
 * speaks them on time while the app is open, schedules notifications for when
 * it is closed, and reads a message aloud when its notification is tapped.
 * Mount once, inside the signed-in area.
 */
export function useVoiceAssistant(): void {
  useVoiceRemindersSync();
  const name = useAuthStore((s) => firstNameOf(s.user?.displayName));
  const reminders = useVoiceRemindersStore((s) => s.reminders);
  const loaded = useVoiceRemindersStore((s) => s.loaded);
  // Re-run the scheduler and notifications whenever reminders change.
  const messagesSignature = JSON.stringify(reminders);

  // Speak due messages while the app is in the foreground.
  useEffect(() => {
    let cancelled = false;
    let spoken = new Set<string>();
    const spokenLoaded = AsyncStorage.getItem(SPOKEN_KEY)
      .then((raw) => {
        if (raw) spoken = new Set(JSON.parse(raw) as string[]);
      })
      .catch(() => undefined);

    const check = async () => {
      await spokenLoaded;
      if (cancelled || AppState.currentState !== 'active') return;
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');

      for (const message of getScheduledMessages()) {
        if (!runsOn(message, now)) continue;
        const at = new Date(now);
        at.setHours(message.hour, message.minute, 0, 0);
        const lateBy = now.getTime() - at.getTime();
        if (lateBy < 0 || lateBy > GRACE_MS) continue;

        const key = `${today}|${message.id}`;
        if (spoken.has(key)) continue;

        spoken = new Set([...spoken].filter((k) => k.startsWith(today)));
        spoken.add(key);
        void AsyncStorage.setItem(SPOKEN_KEY, JSON.stringify([...spoken]));
        startReminder({
          id: message.id,
          text: renderMessage(message.message, { name, at }),
          timeLabel: format(at, 'h:mm a'),
        });
      }
    };

    void check();
    const interval = setInterval(() => void check(), CHECK_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    return () => {
      cancelled = true;
      clearInterval(interval);
      subscription.remove();
    };
  }, [name, messagesSignature]);

  // Keep the closed-app notifications in step with the messages file.
  useEffect(() => {
    // Wait for the first load, so notifications aren't cleared before reminders arrive.
    if (!loaded) return;
    syncVoiceNotifications(name).catch((error: unknown) => {
      if (__DEV__) console.warn('[voice] Could not schedule notifications', error);
    });
  }, [name, messagesSignature, loaded]);

  // Read a voice notification aloud when the user taps it.
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response) return;
    const { content, identifier } = response.notification.request;
    const responseKey = `${identifier}|${response.notification.date}`;
    if (!isVoiceNotification(content) || handledResponses.has(responseKey)) return;
    handledResponses.add(responseKey);
    const text = typeof content.data?.text === 'string' ? content.data.text : content.body;
    if (text) {
      startReminder({
        id: identifier,
        text,
        timeLabel: format(response.notification.date, 'h:mm a'),
      });
    }
  }, [response]);
}
