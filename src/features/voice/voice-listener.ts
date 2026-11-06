import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { voiceSettings } from '@/config/voice-messages';

import { ensureRecordingPermission, listenForVoice } from './voice-activity';

type SpeechRecognitionModule =
  typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

let cachedModule: SpeechRecognitionModule | null | undefined;

/**
 * Loads the speech recognition native module, or returns null where it isn't
 * available. Expo Go doesn't include it, so voice commands need a development
 * build (`npx eas-cli@latest build --profile development --platform android`).
 */
function getRecognitionModule(): SpeechRecognitionModule | null {
  if (cachedModule !== undefined) return cachedModule;
  if (Platform.OS === 'web' || isRunningInExpoGo()) {
    cachedModule = null;
    return cachedModule;
  }
  try {
    // Loaded lazily: importing it in Expo Go would throw, because the native
    // module is missing there.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speechRecognition = require('expo-speech-recognition') as typeof import('expo-speech-recognition');
    cachedModule = speechRecognition.ExpoSpeechRecognitionModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

/**
 * How Elora listens for your reply:
 * - 'words': real speech recognition ("OK", "got it"...). Development build.
 * - 'voice': detects that you spoke (any word). Works in Expo Go.
 * - 'none':  listening unavailable (web).
 */
export type ListenMode = 'words' | 'voice' | 'none';

export function getListenMode(): ListenMode {
  if (Platform.OS === 'web') return 'none';
  return isWordRecognitionAvailable() ? 'words' : 'voice';
}

/** Whether exact word recognition is available on this device and build. */
function isWordRecognitionAvailable(): boolean {
  const recognition = getRecognitionModule();
  if (!recognition) return false;
  try {
    return recognition.isRecognitionAvailable();
  } catch {
    return false;
  }
}

/** Asks for the permissions `mode` needs. Returns true if granted. */
export async function ensureListeningPermission(mode: ListenMode): Promise<boolean> {
  if (mode === 'none') return false;
  if (mode === 'voice') return ensureRecordingPermission();
  const recognition = getRecognitionModule();
  if (!recognition) return false;
  try {
    const current = await recognition.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await recognition.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True if `transcript` contains one of the configured stop words as a whole word. */
export function containsStopWord(transcript: string): boolean {
  const words = voiceSettings.stopWords.map((word) => word.trim()).filter(Boolean);
  if (words.length === 0) return false;
  const pattern = new RegExp(`\\b(${words.map(escapeRegExp).join('|')})\\b`, 'i');
  return pattern.test(transcript);
}

export type ListenOutcome = 'heard' | 'silence';

export type ListenHandle = { result: Promise<ListenOutcome>; cancel: () => void };

/** Listens for your reply in the given mode. */
export function listenForReply(mode: ListenMode, durationMs: number): ListenHandle {
  if (mode === 'words') return listenForStopWord(durationMs);
  if (mode === 'voice') return listenForVoice(durationMs);
  return { result: Promise.resolve('silence'), cancel: () => undefined };
}

/**
 * Listens for up to `durationMs` and resolves 'heard' as soon as a stop word
 * (e.g. "OK") is recognised, otherwise 'silence'.
 */
export function listenForStopWord(durationMs: number): ListenHandle {
  const recognition = getRecognitionModule();
  if (!recognition) {
    return { result: Promise.resolve('silence'), cancel: () => undefined };
  }

  let settle: (outcome: ListenOutcome) => void = () => undefined;
  const result = new Promise<ListenOutcome>((resolve) => {
    let done = false;
    const subscriptions = [
      recognition.addListener('result', (event) => {
        const heard = event.results.some((r) => containsStopWord(r.transcript));
        if (heard) finish('heard');
      }),
      recognition.addListener('end', () => finish('silence')),
      recognition.addListener('error', () => finish('silence')),
    ];
    const timer = setTimeout(() => finish('silence'), durationMs);

    function finish(outcome: ListenOutcome) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      subscriptions.forEach((subscription) => subscription.remove());
      try {
        recognition?.abort();
      } catch {
        // Already stopped.
      }
      resolve(outcome);
    }
    settle = finish;

    try {
      recognition.start({
        lang: voiceSettings.language,
        interimResults: true,
        maxAlternatives: 3,
        continuous: true,
      });
    } catch {
      finish('silence');
    }
  });

  return { result, cancel: () => settle('silence') };
}
