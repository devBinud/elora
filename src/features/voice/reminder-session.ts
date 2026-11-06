import { create } from 'zustand';

import { voiceSettings } from '@/config/voice-messages';

import { speak, speakAndWait, stopSpeaking } from './voice-engine';
import {
  ensureListeningPermission,
  getListenMode,
  listenForReply,
  type ListenHandle,
  type ListenMode,
} from './voice-listener';

export type ActiveReminder = {
  id: string;
  text: string;
  /** e.g. "1:30 PM", shown in the reminder screen. */
  timeLabel: string;
  /** How many times it has been spoken so far. */
  repeat: number;
  /** Total times it will be spoken if nobody stops it. */
  maxRepeats: number;
  /** True while Elora is listening for "OK". */
  listening: boolean;
  /** How Elora listens for your reply ('words', 'voice', or 'none' if unavailable). */
  listenMode: ListenMode;
};

type ReminderSessionState = {
  active: ActiveReminder | null;
};

export const useReminderSession = create<ReminderSessionState>()(() => ({ active: null }));

function update(changes: Partial<ActiveReminder>): void {
  useReminderSession.setState((state) =>
    state.active ? { active: { ...state.active, ...changes } } : state,
  );
}

let sessionToken = 0;
let currentListen: ListenHandle | null = null;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Starts a reminder: Elora says `text`, then pauses and listens for a stop
 * word, and repeats until stopped (button or voice) or `maxRepeats` is hit.
 */
export function startReminder(reminder: { id: string; text: string; timeLabel: string }): void {
  const token = ++sessionToken;
  currentListen?.cancel();
  currentListen = null;
  stopSpeaking();

  const maxRepeats = voiceSettings.repeatUntilStopped ? Math.max(1, voiceSettings.maxRepeats) : 1;
  const listenMode = getListenMode();
  useReminderSession.setState({
    active: { ...reminder, repeat: 0, maxRepeats, listening: false, listenMode },
  });

  void runReminderLoop(token, reminder.text, maxRepeats, listenMode);
}

async function runReminderLoop(
  token: number,
  text: string,
  maxRepeats: number,
  listenMode: ListenMode,
): Promise<void> {
  const isCurrent = () => token === sessionToken;
  const canListen = listenMode !== 'none' && (await ensureListeningPermission(listenMode));
  if (!canListen) update({ listenMode: 'none' });
  const gapMs = Math.max(1.5, voiceSettings.repeatGapSeconds) * 1000;

  for (let repeat = 1; repeat <= maxRepeats; repeat++) {
    if (!isCurrent()) return;
    update({ repeat, listening: false });
    await speakAndWait(text);
    if (!isCurrent()) return;
    if (repeat === maxRepeats) break;

    if (canListen) {
      update({ listening: true });
      currentListen = listenForReply(listenMode, gapMs);
      const outcome = await currentListen.result;
      currentListen = null;
      if (!isCurrent()) return;
      update({ listening: false });
      if (outcome === 'heard') {
        acknowledgeReminder();
        return;
      }
    } else {
      await wait(gapMs);
    }
  }

  // Nobody stopped it: close quietly after the last repeat.
  if (isCurrent()) useReminderSession.setState({ active: null });
}

/** Stops the current reminder and replies, e.g. "Ok boss, take care." */
export function acknowledgeReminder(): void {
  if (!useReminderSession.getState().active) return;
  sessionToken++;
  currentListen?.cancel();
  currentListen = null;
  useReminderSession.setState({ active: null });
  speak(voiceSettings.stopReply, { interrupt: true });
}
