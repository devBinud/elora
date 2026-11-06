import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Clock, MessageSquareText, Trash2, Volume2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuroraBackground, AuroraTextField, GlassCard, GradientButton } from '@/components/aurora';
import { AuroraSwitch } from '@/components/aurora/aurora-switch';
import type { Weekday } from '@/features/voice/types';
import { firstNameOf, parseTime, renderMessage, speak } from '@/features/voice/voice-engine';
import { toReminderItem, voiceRemindersRepository } from '@/features/voice/voice-reminders-repository';
import { DAY_PRESETS, describeDays, WEEKDAYS } from '@/features/voice/weekdays';
import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

/** Ready-made messages to start from. */
const TEMPLATES = [
  'Hi {name}, time to drink some water.',
  '{name}, time to take your medicine.',
  '{greeting} {name}! Time to start your day.',
  'Hello {name}, have you had your lunch?',
  'Time for a short walk and a stretch, {name}.',
  '{greeting} {name}. How was your day?',
];

const DAY_LETTER: Record<Weekday, string> = {
  sun: 'S',
  mon: 'M',
  tue: 'T',
  wed: 'W',
  thu: 'T',
  fri: 'F',
  sat: 'S',
};

const pad = (value: number) => String(value).padStart(2, '0');

export default function ReminderEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const uid = useAuthStore((s) => s.user?.uid ?? null);
  const name = useAuthStore((s) => firstNameOf(s.user?.displayName));
  const isNew = id === 'new';

  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [message, setMessage] = useState('');
  const [days, setDays] = useState<Weekday[]>(WEEKDAYS);
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(isNew);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIosPicker, setShowIosPicker] = useState(false);

  // Load an existing reminder once.
  useEffect(() => {
    if (isNew || !uid) return;
    let cancelled = false;
    void voiceRemindersRepository.getById(uid, id).then((stored) => {
      if (cancelled) return;
      if (!stored) {
        setMissing(true);
        return;
      }
      const item = toReminderItem(stored);
      const time = parseTime(item.time) ?? { hour: 9, minute: 0 };
      setHour(time.hour);
      setMinute(time.minute);
      setMessage(item.message);
      setDays(item.days ?? WEEKDAYS);
      setEnabled(item.enabled !== false);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, isNew, uid]);

  const at = new Date();
  at.setHours(hour, minute, 0, 0);
  const preview = renderMessage(message || TEMPLATES[0], { name, at });

  const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'ios') setShowIosPicker(false);
    if (event.type !== 'set' || !date) return;
    setHour(date.getHours());
    setMinute(date.getMinutes());
  };

  const pickTime = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: at, mode: 'time', is24Hour: false, onChange: onTimeChange });
    } else {
      setShowIosPicker((value) => !value);
    }
  };

  const toggleDay = (day: Weekday) => {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  };

  const save = async () => {
    if (!uid) return;
    if (!message.trim()) {
      setError('Write what Elora should say.');
      return;
    }
    if (days.length === 0) {
      setError('Pick at least one day.');
      return;
    }
    setError(null);
    setSaving(true);
    const fields = {
      time: `${pad(hour)}:${pad(minute)}`,
      message: message.trim(),
      days: days.length === 7 ? null : WEEKDAYS.filter((d) => days.includes(d)),
      enabled,
    };
    try {
      if (isNew) await voiceRemindersRepository.create(uid, fields);
      else await voiceRemindersRepository.update(uid, id, fields);
      router.back();
    } catch {
      setError("Couldn't save the reminder. Please try again.");
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this reminder?', 'Elora will stop reminding you at this time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (uid) void voiceRemindersRepository.remove(uid, id).finally(() => router.back());
        },
      },
    ]);
  };

  if (missing) {
    return (
      <View style={[styles.root, styles.center]}>
        <AuroraBackground />
        <StatusBar style="light" />
        <Text style={styles.missing}>This reminder no longer exists.</Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.link}>Back to reminders</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <AuroraBackground />
      <StatusBar style="light" />

      <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
        <RoundButton label="Back" onPress={() => router.back()}>
          <ChevronLeft size={22} color={aurora.text} strokeWidth={2} />
        </RoundButton>
        <Text style={styles.barTitle}>{isNew ? 'New reminder' : 'Edit reminder'}</Text>
        {isNew ? (
          <View style={styles.barSpacer} />
        ) : (
          <RoundButton label="Delete reminder" onPress={confirmDelete}>
            <Trash2 size={18} color={aurora.danger} strokeWidth={2} />
          </RoundButton>
        )}
      </View>

      {loaded ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
            {/* Time */}
            <Pressable
              onPress={pickTime}
              accessibilityRole="button"
              accessibilityLabel={`Time ${format(at, 'h:mm a')}. Tap to change.`}
              style={({ pressed }) => [styles.timeCard, pressed && styles.timeCardPressed]}>
              <Text style={styles.sectionLabel}>Remind me at</Text>
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{format(at, 'h:mm')}</Text>
                <Text style={styles.timePeriod}>{format(at, 'a')}</Text>
              </View>
              <View style={styles.timeHint}>
                <Clock size={14} color={aurora.lilac} strokeWidth={2} />
                <Text style={styles.timeHintText}>Tap to change the time</Text>
              </View>
            </Pressable>
            {Platform.OS === 'ios' && showIosPicker ? (
              <DateTimePicker value={at} mode="time" display="spinner" themeVariant="dark" onChange={onTimeChange} />
            ) : null}

            {/* Message */}
            <AuroraTextField
              label="What should Elora say?"
              icon={MessageSquareText}
              value={message}
              onChangeText={setMessage}
              placeholder={TEMPLATES[0]}
              multiline
              maxLength={300}
              hint="Use {name} for your name and {greeting} for good morning / afternoon / evening."
            />
            <View style={styles.pills}>
              {TEMPLATES.map((template) => (
                <Pressable
                  key={template}
                  onPress={() => setMessage(template)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use: ${renderMessage(template, { name, at })}`}
                  style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
                  <Text style={styles.pillText} numberOfLines={1}>
                    {renderMessage(template, { name, at })}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Days */}
            <GlassCard style={styles.daysCard}>
              <View style={styles.daysHeader}>
                <Text style={styles.sectionLabel}>Repeat</Text>
                <Text style={styles.daysSummary}>{days.length ? describeDays(days) : 'No days'}</Text>
              </View>
              <View style={styles.dayRow}>
                {WEEKDAYS.map((day) => {
                  const on = days.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => toggleDay(day)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={day}
                      style={[styles.dayDot, on && styles.dayDotOn]}>
                      <Text style={[styles.dayText, on && styles.dayTextOn]}>{DAY_LETTER[day]}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.presetRow}>
                {DAY_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.label}
                    onPress={() => setDays(preset.days)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.preset, pressed && styles.pillPressed]}>
                    <Text style={styles.presetText}>{preset.label}</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>

            {/* On / off */}
            <GlassCard>
              <View style={styles.switchRow}>
                <View style={styles.flex}>
                  <Text style={styles.switchTitle}>Reminder on</Text>
                  <Text style={styles.switchBody}>Turn off to pause it without deleting.</Text>
                </View>
                <AuroraSwitch value={enabled} onValueChange={setEnabled} accessibilityLabel="Reminder on" />
              </View>
            </GlassCard>

            {error ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <GradientButton
              title="Hear it"
              icon={Volume2}
              variant="glass"
              onPress={() => speak(preview, { interrupt: true })}
            />
            <GradientButton title="Save reminder" loading={saving} onPress={() => void save()} />
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}

function RoundButton({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.roundButton, pressed && styles.roundButtonPressed]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  missing: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 16 },
  link: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 14 },

  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  barTitle: { flex: 1, textAlign: 'center', color: aurora.text, fontFamily: fonts.semibold, fontSize: 16 },
  barSpacer: { width: 40 },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.glass,
    borderColor: 'rgba(216, 180, 254, 0.22)',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  roundButtonPressed: { backgroundColor: aurora.glassPressed },

  content: { paddingHorizontal: 20, paddingTop: 12, gap: 18 },
  sectionLabel: {
    color: aurora.textSubtle,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  timeCard: {
    alignItems: 'center',
    paddingVertical: 22,
    borderRadius: 24,
    backgroundColor: aurora.accentTint,
    borderColor: aurora.accentBorder,
    borderWidth: 1,
    boxShadow: '0 0 24px rgba(139, 92, 246, 0.25)',
  },
  timeCardPressed: { opacity: 0.85 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 },
  timeText: { color: aurora.text, fontFamily: fonts.light, fontSize: 56, lineHeight: 66, fontVariant: ['tabular-nums'] },
  timePeriod: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 18, letterSpacing: 1 },
  timeHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  timeHintText: { color: aurora.textMuted, fontFamily: fonts.medium, fontSize: 12 },

  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -6 },
  pill: {
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  pillPressed: { backgroundColor: aurora.glassPressed },
  pillText: { color: aurora.textMuted, fontFamily: fonts.medium, fontSize: 12 },

  daysCard: { gap: 14 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  daysSummary: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 13 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: 1,
  },
  dayDotOn: { backgroundColor: aurora.violet, borderColor: aurora.accentBorder },
  dayText: { color: aurora.textMuted, fontFamily: fonts.semibold, fontSize: 13 },
  dayTextOn: { color: aurora.text },
  presetRow: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  presetText: { color: aurora.text, fontFamily: fonts.medium, fontSize: 12 },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 15 },
  switchBody: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  errorBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: aurora.dangerTint,
    borderColor: aurora.dangerBorder,
    borderWidth: 1,
  },
  errorText: { color: aurora.danger, fontFamily: fonts.medium, fontSize: 13 },
});
