import { UserCollections } from '@/constants/collections';
import type { EntitySchema, SyncableEntity } from '@/database/schemas/entity-schema';
import { defineSyncableRepository } from '@/services/synchronization';

import type { VoiceMessage, Weekday } from './types';
import { WEEKDAYS } from './weekdays';

/** A voice reminder the user set up in the app. */
export type VoiceReminder = SyncableEntity & {
  /** 24-hour "HH:mm". */
  time: string;
  /** Spoken text; supports {name}, {greeting} and {time}. */
  message: string;
  /** Days to play on, or null for every day. */
  days: Weekday[] | null;
  enabled: boolean;
};

export const voiceReminderSchema: EntitySchema<VoiceReminder> = {
  table: 'voice_reminders',
  collection: UserCollections.reminders,
  fields: {
    time: { column: 'time', type: 'text' },
    message: { column: 'message', type: 'text' },
    days: { column: 'days', type: 'json' },
    enabled: { column: 'enabled', type: 'boolean' },
  },
};

/**
 * Local-first storage for voice reminders, synced to Firestore. Importing
 * this module registers it with the sync engine.
 */
export const voiceRemindersRepository = defineSyncableRepository(voiceReminderSchema);

/** A reminder as the voice engine uses it. */
export type VoiceReminderItem = VoiceMessage & { id: string };

/** Converts a stored reminder (with possibly missing fields) to an engine item. */
export function toReminderItem(reminder: VoiceReminder): VoiceReminderItem {
  const days = Array.isArray(reminder.days)
    ? reminder.days.filter((day): day is Weekday => WEEKDAYS.includes(day))
    : null;
  return {
    id: reminder.id,
    time: reminder.time ?? '09:00',
    message: reminder.message ?? '',
    days: days && days.length > 0 && days.length < 7 ? days : undefined,
    enabled: reminder.enabled !== false,
  };
}
