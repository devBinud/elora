export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export type VoiceMessage = {
  /** 24-hour "HH:mm". */
  time: string;
  /** Spoken text. Supports {name}, {greeting} and {time}. */
  message: string;
  /** Days to play on. Omit for every day. */
  days?: Weekday[];
  /** Set to false to pause the message. Defaults to true. */
  enabled?: boolean;
};

export type VoiceSettings = {
  /** Overrides the account name used for {name}. Empty to use the account name. */
  name: string;
  /** Word -> how to say it, e.g. { Binud: 'Beenod' }. Matched as whole words, any case. */
  pronunciations: Record<string, string>;
  language: string;
  rate: number;
  pitch: number;
  notifyWhenAppClosed: boolean;
  repeatUntilStopped: boolean;
  repeatGapSeconds: number;
  listenSensitivity: 'high' | 'medium' | 'low';
  maxRepeats: number;
  stopWords: string[];
  stopReply: string;
};
