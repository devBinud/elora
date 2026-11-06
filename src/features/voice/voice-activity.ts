import {
  AudioModule,
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Platform } from 'react-native';

import { voiceSettings } from '@/config/voice-messages';

import type { ListenHandle, ListenOutcome } from './voice-listener';

/**
 * Voice detection that works in Expo Go: records from the microphone with
 * level metering and reports 'heard' when someone speaks noticeably louder
 * than the room's background noise. It detects *a voice*, not specific words;
 * exact "OK" recognition needs a development build (see voice-listener.ts).
 */

const POLL_MS = 100;
/** Readings used to measure the room's background noise first. */
const BASELINE_SAMPLES = 3;
/** Consecutive loud readings needed (filters out clicks and bumps). */
const LOUD_SAMPLES_NEEDED = 2;
/** Never trigger below this level, however quiet the room is. */
const MIN_TRIGGER_DB = -45;

const SENSITIVITY_DB: Record<typeof voiceSettings.listenSensitivity, number> = {
  high: 9,
  medium: 14,
  low: 20,
};

export async function ensureRecordingPermission(): Promise<boolean> {
  try {
    const current = await getRecordingPermissionsAsync();
    if (current.granted) return true;
    return (await requestRecordingPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

function meteringOptions() {
  const preset = RecordingPresets.LOW_QUALITY;
  const platformSpecific =
    Platform.OS === 'ios' ? preset.ios : Platform.OS === 'android' ? preset.android : preset.web;
  return {
    extension: preset.extension,
    sampleRate: preset.sampleRate,
    numberOfChannels: 1,
    bitRate: preset.bitRate,
    ...platformSpecific,
    isMeteringEnabled: true,
  };
}

export function listenForVoice(durationMs: number): ListenHandle {
  let settle: (outcome: ListenOutcome) => void = () => undefined;

  const result = new Promise<ListenOutcome>((resolve) => {
    let done = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let recorder: InstanceType<typeof AudioModule.AudioRecorder> | null = null;
    const levels: number[] = [];
    let loudStreak = 0;

    const finish = (outcome: ListenOutcome) => {
      if (done) return;
      done = true;
      if (poll) clearInterval(poll);
      if (timer) clearTimeout(timer);
      if (__DEV__ && levels.length > 0) {
        const floor = Math.min(...levels).toFixed(0);
        const peak = Math.max(...levels).toFixed(0);
        console.log(`[voice] listened: floor ${floor} dB, peak ${peak} dB -> ${outcome}`);
      }
      const current = recorder;
      recorder = null;
      void (async () => {
        try {
          if (current?.isRecording) await current.stop();
        } catch {
          // Already stopped.
        }
        current?.release();
        await setAudioModeAsync({ allowsRecording: false }).catch(() => undefined);
      })();
      resolve(outcome);
    };
    settle = finish;

    void (async () => {
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        if (done) return;
        // eslint-disable-next-line import/namespace -- AudioModule is an object, not a namespace.
        recorder = new AudioModule.AudioRecorder(meteringOptions());
        await recorder.prepareToRecordAsync();
        if (done) {
          recorder.release();
          return;
        }
        recorder.record();
      } catch (error) {
        if (__DEV__) console.log('[voice] could not start the microphone', error);
        finish('silence');
        return;
      }

      const sensitivity = SENSITIVITY_DB[voiceSettings.listenSensitivity] ?? SENSITIVITY_DB.medium;
      timer = setTimeout(() => finish('silence'), durationMs);
      poll = setInterval(() => {
        const level = recorder?.getStatus().metering;
        if (level === undefined || !Number.isFinite(level)) return;
        levels.push(level);
        if (levels.length <= BASELINE_SAMPLES) return;

        // The quietest moment so far is the room's background noise. Using the
        // minimum (not an average) still works if you start talking at once,
        // because speech has quiet gaps between syllables.
        const noiseFloor = Math.min(...levels);
        const threshold = Math.max(noiseFloor + sensitivity, MIN_TRIGGER_DB);
        loudStreak = level >= threshold ? loudStreak + 1 : 0;
        if (loudStreak >= LOUD_SAMPLES_NEEDED) finish('heard');
      }, POLL_MS);
    })();
  });

  return { result, cancel: () => settle('silence') };
}
