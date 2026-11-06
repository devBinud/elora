import type { VoiceMessage, VoiceSettings } from '@/features/voice/types';

/**
 * ==========================================================================
 *  ELORA VOICE SETTINGS
 * ==========================================================================
 *
 * Reminders are now managed in the app: More → Voice reminders (add, edit,
 * pick days, switch on/off). They save on the device and sync to your account.
 *
 * `voiceMessages` below are only the STARTER reminders, added once the first
 * time you sign in (if you have none yet). Editing them later has no effect
 * on reminders you already have; use the app instead.
 *
 * `voiceSettings` (further down) still controls how Elora sounds: your name,
 * pronunciations, language, speed, repeating and the reply after "OK".
 *
 * Message placeholders: {name} (your first name), {greeting} ("Good morning"
 * / "Good afternoon" / "Good evening") and {time} (e.g. "9:00 PM").
 */
export const voiceMessages: VoiceMessage[] = [
  { time: '08:00', message: '{greeting} {name}! Time to start your day.' },
  { time: '13:30', message: 'Hello {name}, how are you? Have you had your lunch?' },
  { time: '17:00', message: 'Hi {name}, take a short break and drink some water.' },
  { time: '21:00', message: '{greeting} {name}. How was your day?' },
  {
    time: '07:00',
    message: 'Good morning {name}. It is the weekend, enjoy your day!',
    days: ['sat', 'sun'],
    enabled: false,
  },
];

/** How Elora's voice sounds. */
export const voiceSettings: VoiceSettings = {
  /** What Elora calls you ({name}). Leave empty ('') to use your account name. */
  name: 'Binud',
  /**
   * How Elora should *say* certain words. The text on screen stays the same;
   * only the voice changes. Spell it the way it sounds, e.g. Binud -> Beenod.
   */
  pronunciations: {
    Binud: 'Beenod',
  },
  /** Accent/language, e.g. 'en-IN' (Indian English), 'en-US', 'en-GB', 'hi-IN'. */
  language: 'en-IN',
  /** Speaking speed. 1 is normal; 0.8 is slower, 1.2 is faster. */
  rate: 0.95,
  /** Voice pitch. 1 is normal. */
  pitch: 1.05,
  /** Show a notification at each time when the app is closed. */
  notifyWhenAppClosed: true,

  /** Keep repeating a reminder until you stop it (tap "OK, got it" or say "OK"). */
  repeatUntilStopped: true,
  /** Pause between repeats, in seconds. Elora listens for your "OK" during this pause. */
  repeatGapSeconds: 3,
  /**
   * How easily your voice is picked up in Expo Go: 'high' (quiet voice is enough),
   * 'medium', or 'low' (only a clear, loud "OK"; use in noisy rooms).
   */
  listenSensitivity: 'medium',
  /** Give up after repeating this many times. */
  maxRepeats: 10,
  /** Saying any of these stops the reminder. */
  stopWords: ['ok', 'okay', 'got it', 'stop', 'done', 'thank you'],
  /** What Elora replies when you stop a reminder. */
  stopReply: 'Ok boss, take care.',
};
