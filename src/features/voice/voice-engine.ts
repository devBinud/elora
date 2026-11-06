import { format } from 'date-fns';
import * as Speech from 'expo-speech';
import { create } from 'zustand';

import { voiceSettings } from '@/config/voice-messages';
import { greetingFor } from '@/utils/date';

import type { VoiceMessage } from './types';
import type { VoiceReminderItem } from './voice-reminders-repository';
import { useVoiceRemindersStore } from './voice-reminders-store';
import { WEEKDAYS } from './weekdays';

export { WEEKDAYS };

/** Whether Elora is currently speaking (drives the assistant's animated mouth). */
export const useSpeakingStore = create<{ speaking: boolean }>()(() => ({ speaking: false }));

function setSpeaking(speaking: boolean): void {
  if (useSpeakingStore.getState().speaking !== speaking) useSpeakingStore.setState({ speaking });
}

export type ScheduledVoiceMessage = VoiceMessage & { id: string; hour: number; minute: number };

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Parses "HH:mm" into hour and minute, or null if invalid. */
export function parseTime(time: string): { hour: number; minute: number } | null {
  const match = TIME_PATTERN.exec(time.trim());
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

/**
 * The user's enabled voice reminders (set up in the app), with parsed times.
 * Defaults to the live list in `useVoiceRemindersStore`.
 */
export function getScheduledMessages(
  reminders: VoiceReminderItem[] = useVoiceRemindersStore.getState().reminders,
): ScheduledVoiceMessage[] {
  const result: ScheduledVoiceMessage[] = [];
  for (const reminder of reminders) {
    if (reminder.enabled === false || !reminder.message.trim()) continue;
    const time = parseTime(reminder.time);
    if (!time) continue;
    result.push({ ...reminder, ...time });
  }
  return result;
}

export function runsOn(message: VoiceMessage, date: Date): boolean {
  return !message.days || message.days.includes(WEEKDAYS[date.getDay()]);
}

/** Fills in {name}, {greeting} and {time}, and tidies spacing when the name is unknown. */
export function renderMessage(text: string, context: { name?: string | null; at: Date }): string {
  return text
    .replaceAll('{name}', context.name ?? '')
    .replaceAll('{greeting}', greetingFor(context.at))
    .replaceAll('{time}', format(context.at, 'h:mm a'))
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** The next time `message` plays after `from`, or null if it never does. */
export function nextOccurrence(message: ScheduledVoiceMessage, from: Date): Date | null {
  for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
    const candidate = new Date(from);
    candidate.setDate(from.getDate() + dayOffset);
    candidate.setHours(message.hour, message.minute, 0, 0);
    if (candidate > from && runsOn(message, candidate)) return candidate;
  }
  return null;
}

/** Messages that play today, in time order, with their time today. */
export function todaysVoiceMessages(
  now: Date,
  reminders?: VoiceReminderItem[],
): { message: ScheduledVoiceMessage; at: Date }[] {
  return getScheduledMessages(reminders)
    .filter((message) => runsOn(message, now))
    .map((message) => {
      const at = new Date(now);
      at.setHours(message.hour, message.minute, 0, 0);
      return { message, at };
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** The soonest upcoming message, for display. */
export function nextVoiceMessage(
  from: Date,
  reminders?: VoiceReminderItem[],
): { message: ScheduledVoiceMessage; at: Date } | null {
  let best: { message: ScheduledVoiceMessage; at: Date } | null = null;
  for (const message of getScheduledMessages(reminders)) {
    const at = nextOccurrence(message, from);
    if (at && (!best || at < best.at)) best = { message, at };
  }
  return best;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Swaps words for their spoken spelling from `voiceSettings.pronunciations`. */
export function applyPronunciations(text: string): string {
  let result = text;
  for (const [word, spoken] of Object.entries(voiceSettings.pronunciations)) {
    if (!word.trim()) continue;
    result = result.replace(new RegExp(`\\b${escapeRegExp(word.trim())}\\b`, 'gi'), spoken);
  }
  return result;
}

/**
 * Speaks `text` with the configured voice. With `interrupt`, anything
 * currently being spoken stops first; otherwise the text is queued.
 */
export function speak(text: string, options: { interrupt?: boolean } = {}): void {
  if (options.interrupt) void Speech.stop();
  Speech.speak(applyPronunciations(text), {
    language: voiceSettings.language,
    rate: voiceSettings.rate,
    pitch: voiceSettings.pitch,
    onStart: () => setSpeaking(true),
    onDone: () => setSpeaking(false),
    onStopped: () => setSpeaking(false),
    onError: () => setSpeaking(false),
  });
}

/** Speaks `text` and resolves when it finishes, is stopped, or fails. */
export function speakAndWait(text: string): Promise<void> {
  return new Promise((resolve) => {
    Speech.speak(applyPronunciations(text), {
      language: voiceSettings.language,
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      onStart: () => setSpeaking(true),
      onDone: () => {
        setSpeaking(false);
        resolve();
      },
      onStopped: () => {
        setSpeaking(false);
        resolve();
      },
      onError: () => {
        setSpeaking(false);
        resolve();
      },
    });
  });
}

/** Stops anything Elora is currently saying. */
export function stopSpeaking(): void {
  void Speech.stop();
  setSpeaking(false);
}

/**
 * The name Elora uses: `voiceSettings.name` if set, otherwise the first word
 * of the account's display name (e.g. "Binud" from "Binud P").
 */
export function firstNameOf(displayName: string | null | undefined): string | undefined {
  const configured = voiceSettings.name.trim();
  if (configured) return configured;
  return displayName?.trim().split(/\s+/)[0] || undefined;
}
