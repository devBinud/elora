import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AuroraSwitch } from '@/components/aurora/aurora-switch';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import { parseTime, renderMessage } from '../voice-engine';
import type { VoiceReminderItem } from '../voice-reminders-repository';
import { describeDays } from '../weekdays';

type ReminderCardProps = {
  reminder: VoiceReminderItem;
  name: string | undefined;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
};

/**
 * One reminder in the list: time, message and days, an on/off switch, and
 * Edit / Delete actions. Fades in and out, and slides when the list changes.
 */
export function ReminderCard({ reminder, name, onToggle, onEdit, onDelete }: ReminderCardProps) {
  const parsed = parseTime(reminder.time) ?? { hour: 9, minute: 0 };
  const at = new Date();
  at.setHours(parsed.hour, parsed.minute, 0, 0);
  const clock = format(at, 'h:mm');
  const period = format(at, 'a');
  // Follow the switch at once, before the saved value comes back.
  const stored = reminder.enabled !== false;
  const [pending, setPending] = useState<boolean | null>(null);
  if (pending !== null && pending === stored) setPending(null);
  const enabled = pending ?? stored;
  const days = describeDays(reminder.days);

  // Dim smoothly when switched off.
  const dim = useSharedValue(enabled ? 1 : 0.55);
  useEffect(() => {
    dim.set(withTiming(enabled ? 1 : 0.55, { duration: 220 }));
  }, [enabled, dim]);
  const contentStyle = useAnimatedStyle(() => ({ opacity: dim.get() }));

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      layout={LinearTransition.springify().damping(18).stiffness(180)}
      style={styles.card}>
      <View style={styles.main}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`${clock} ${period}, ${days}: ${reminder.message}. Tap to edit.`}
          style={styles.mainPress}>
          <Animated.View style={[styles.mainRow, contentStyle]}>
            <View style={styles.time}>
              <Text style={styles.clock}>{clock}</Text>
              <Text style={styles.period}>{period}</Text>
            </View>
            <View style={styles.text}>
              <Text style={styles.message} numberOfLines={2}>
                {renderMessage(reminder.message, { name, at })}
              </Text>
              <Text style={styles.days}>{days}</Text>
            </View>
          </Animated.View>
        </Pressable>
        <AuroraSwitch
          value={enabled}
          onValueChange={(value) => {
            setPending(value);
            onToggle(value);
          }}
          accessibilityLabel={`Reminder at ${clock} ${period}`}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit reminder at ${clock} ${period}`}
          hitSlop={6}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
          <Pencil size={15} color={aurora.lilac} strokeWidth={2} />
          <Text style={styles.actionText}>Edit</Text>
        </Pressable>
        <View style={styles.actionDivider} />
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete reminder at ${clock} ${period}`}
          hitSlop={6}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}>
          <Trash2 size={15} color={aurora.danger} strokeWidth={2} />
          <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  main: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
  mainPress: { flex: 1 },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingLeft: 16, paddingRight: 12 },
  time: { width: 62 },
  clock: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, fontVariant: ['tabular-nums'] },
  period: { color: aurora.textSubtle, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1 },
  text: { flex: 1 },
  message: { color: aurora.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  days: { color: aurora.lilac, fontFamily: fonts.medium, fontSize: 12, marginTop: 4 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: aurora.glassBorder },
  actions: { flexDirection: 'row' },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
  },
  actionPressed: { backgroundColor: aurora.glassPressed },
  actionDivider: { width: StyleSheet.hairlineWidth, backgroundColor: aurora.glassBorder },
  actionText: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 13, lineHeight: 17, includeFontPadding: false, textAlignVertical: 'center' },
  deleteText: { color: aurora.danger },
});
