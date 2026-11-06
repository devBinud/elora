import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { voiceSettings } from '@/config/voice-messages';

import { getScheduledMessages, renderMessage, WEEKDAYS } from './voice-engine';

const CHANNEL_ID = 'elora-voice';
export const VOICE_NOTIFICATION_KIND = 'elora-voice';

export function isVoiceNotification(content: Notifications.NotificationContent): boolean {
  return content.data?.kind === VOICE_NOTIFICATION_KIND;
}

/**
 * Foreground behaviour: voice messages are spoken by the in-app scheduler,
 * so their notification banner is hidden while the app is open.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isVoice = isVoiceNotification(notification.request.content);
      return {
        shouldShowBanner: !isVoice,
        shouldShowList: true,
        shouldPlaySound: !isVoice,
        shouldSetBadge: false,
      };
    },
  });
}

/**
 * Replaces Elora's scheduled voice notifications with the current contents of
 * `src/config/voice-messages.ts`. Asks for notification permission once.
 */
export async function syncVoiceNotifications(name: string | undefined): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => isVoiceNotification(request.content))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );

  const messages = getScheduledMessages();
  if (!voiceSettings.notifyWhenAppClosed || messages.length === 0) return;

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Elora voice messages',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  for (const message of messages) {
    const at = new Date();
    at.setHours(message.hour, message.minute, 0, 0);
    const text = renderMessage(message.message, { name, at });
    const content: Notifications.NotificationContentInput = {
      title: 'Elora',
      body: text,
      data: { kind: VOICE_NOTIFICATION_KIND, text },
    };

    if (!message.days) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: message.hour,
          minute: message.minute,
          channelId: CHANNEL_ID,
        },
      });
      continue;
    }

    for (const day of message.days) {
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: WEEKDAYS.indexOf(day) + 1, // 1 = Sunday
          hour: message.hour,
          minute: message.minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}
