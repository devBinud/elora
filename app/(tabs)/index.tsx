import { useIsFocused } from '@react-navigation/native';
import { format, isSameDay, isTomorrow } from 'date-fns';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  BellRing,
  CalendarClock,
  Check,
  Hourglass,
  Play,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AssistantOrb,
  AuroraBackground,
  GlassCard,
  GradientButton,
  IconBubble,
} from '@/components/aurora';
import {
  firstNameOf,
  nextVoiceMessage,
  renderMessage,
  speak,
  todaysVoiceMessages,
  useSpeakingStore,
} from '@/features/voice/voice-engine';
import { APP_HEADER_BAR_HEIGHT, AppHeader } from '@/components/aurora/app-header';
import { startReminder } from '@/features/voice/reminder-session';
import { useVoiceRemindersStore } from '@/features/voice/voice-reminders-store';
import { useNow } from '@/hooks/use-now';
import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';
import { formatLongDate, greetingFor } from '@/utils/date';

/** "in 25 min", "at 9:00 PM", "tomorrow 8:00 AM", "Sat 7:00 AM" */
function describeWhen(at: Date, now: Date): string {
  const minutes = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (minutes < 60) return `in ${Math.max(minutes, 1)} min`;
  if (isSameDay(at, now)) return format(at, 'h:mm a');
  if (isTomorrow(at)) return `tomorrow ${format(at, 'h:mm a')}`;
  return format(at, 'EEE h:mm a');
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isFocused = useIsFocused();
  const now = useNow();
  const displayName = useAuthStore((s) => s.user?.displayName);
  const firstName = firstNameOf(displayName);
  const speaking = useSpeakingStore((s) => s.speaking);
  const reminders = useVoiceRemindersStore((s) => s.reminders);
  const next = nextVoiceMessage(now, reminders);
  const nextText = next ? renderMessage(next.message.message, { name: firstName, at: next.at }) : '';
  const today = todaysVoiceMessages(now, reminders);
  const openReminders = () => router.push('/reminders');
  const remaining = today.filter(({ at }) => at > now).length;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  return (
    <View style={styles.root}>
      <AuroraBackground />
      {/* Light status bar text while Home (always dark) is on screen. */}
      {isFocused ? <StatusBar style="light" /> : null}

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + APP_HEADER_BAR_HEIGHT + 8 },
        ]}>
        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={styles.date}>{formatLongDate(now)}</Text>
          <Text style={styles.greeting}>
            {greetingFor(now)}
            {firstName ? ',' : ''}
          </Text>
          {firstName ? <Text style={styles.name}>{firstName}</Text> : null}
        </View>

        {/* Assistant orb: tap to hear Elora */}
        <Pressable
          onPress={() =>
            speak(`${greetingFor(new Date())}${firstName ? ` ${firstName}` : ''}. How can I help you today?`, {
              interrupt: true,
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Hear Elora"
          style={styles.orbArea}>
          <AssistantOrb size={240} idPrefix="hero" speaking={speaking} />
          <View style={styles.askPill}>
            <Volume2 size={15} color={aurora.lilac} strokeWidth={1.9} />
            <Text style={styles.askText}>Tap to hear Elora</Text>
          </View>
          <Text style={styles.prompt}>How can I help you today?</Text>
        </Pressable>

        {/* Next voice message (from src/config/voice-messages.ts) */}
        <GlassCard
          onPress={
            next
              ? () =>
                  startReminder({
                    id: next.message.id,
                    text: nextText,
                    timeLabel: format(next.at, 'h:mm a'),
                  })
              : undefined
          }
          accessibilityLabel={next ? `Next reminder: ${nextText}. Tap to try it.` : 'No reminders scheduled'}>
          <View style={styles.row}>
            <IconBubble icon={BellRing} />
            <View style={styles.flex}>
              <Text style={styles.overline}>
                Next reminder{next ? ` · ${describeWhen(next.at, now)}` : ''}
              </Text>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {next ? nextText : 'Nothing scheduled'}
              </Text>
              <Text style={styles.cardBody}>
                {next
                  ? 'Tap to try it: Elora repeats it until you say “OK”.'
                  : 'Tap “Manage reminders” below to add one.'}
              </Text>
            </View>
            {next ? <Volume2 size={18} color={aurora.textSubtle} /> : null}
          </View>
        </GlassCard>

        {/* Today at a glance */}
        <View style={styles.tiles}>
          <GlassCard style={styles.tile}>
            <IconBubble icon={CalendarClock} size={38} />
            <Text style={styles.tileValue}>{today.length}</Text>
            <Text style={styles.overline}>Reminders today</Text>
          </GlassCard>
          <GlassCard style={styles.tile}>
            <IconBubble icon={Hourglass} size={38} />
            <Text style={styles.tileValue}>{remaining}</Text>
            <Text style={styles.overline}>Still to come</Text>
          </GlassCard>
        </View>

        {/* Today's voice reminders */}
        <GlassCard style={styles.listCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.overline}>Today&apos;s voice reminders</Text>
            <Text style={styles.sectionMeta}>
              {today.length === 0 ? '' : remaining === 0 ? 'All done' : `${remaining} left`}
            </Text>
          </View>

          {today.length === 0 ? (
            <Text style={[styles.cardBody, styles.emptyText]}>
              No voice reminders today.
            </Text>
          ) : (
            today.map(({ message, at }, index) => {
              const text = renderMessage(message.message, { name: firstName, at });
              const isDone = at <= now;
              const isNext = next?.message.id === message.id && isSameDay(next.at, now);
              const period = format(at, 'a');
              return (
                <Pressable
                  key={message.id}
                  onPress={() => speak(text, { interrupt: true })}
                  accessibilityRole="button"
                  accessibilityLabel={`${format(at, 'h:mm a')}: ${text}. ${isDone ? 'Played.' : 'Upcoming.'} Tap to hear it.`}
                  style={({ pressed }) => [
                    styles.reminderRow,
                    index > 0 && styles.reminderDivider,
                    isNext && styles.reminderNext,
                    pressed && styles.reminderPressed,
                  ]}>
                  <View style={styles.reminderTime}>
                    <Text style={[styles.reminderClock, isDone && styles.dim]}>{format(at, 'h:mm')}</Text>
                    <Text style={styles.reminderPeriod}>{period}</Text>
                  </View>
                  <Text style={[styles.reminderText, isDone && styles.dim]} numberOfLines={2}>
                    {text}
                  </Text>
                  {isDone ? (
                    <Check size={16} color={aurora.textSubtle} />
                  ) : isNext ? (
                    <View style={styles.nextBadge}>
                      <Text style={styles.nextBadgeText}>Next</Text>
                    </View>
                  ) : (
                    <Play size={15} color={aurora.lilac} />
                  )}
                </Pressable>
              );
            })
          )}
        </GlassCard>

        <GradientButton
          title="Manage reminders"
          icon={SlidersHorizontal}
          variant="glass"
          onPress={openReminders}
        />
        <Text style={styles.footnote}>Tap any reminder to hear it now.</Text>
      </Animated.ScrollView>

      {/* Sticky header, drawn above the scrolling content */}
      <AppHeader scrollY={scrollY} />
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 36, gap: 16 },

  greetingBlock: { marginTop: 4 },
  date: {
    color: aurora.lilac,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  greeting: { color: aurora.text, fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  name: {
    color: aurora.lilac,
    fontFamily: fonts.lightItalic,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.4,
  },

  orbArea: { alignItems: 'center', marginTop: 4, marginBottom: 8 },
  askPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: aurora.accentTint,
    borderColor: aurora.accentBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  askText: { color: aurora.text, fontFamily: fonts.medium, fontSize: 14, lineHeight: 18, includeFontPadding: false, textAlignVertical: 'center' },
  prompt: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 14, marginTop: 12 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  overline: {
    color: aurora.textSubtle,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 16, marginTop: 3 },
  cardBody: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 2 },

  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, gap: 8 },
  tileValue: {
    color: aurora.text,
    fontFamily: fonts.light,
    fontSize: 34,
    lineHeight: 42,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },

  listCard: { paddingBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionMeta: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 12 },
  emptyText: { marginVertical: 10 },

  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: 16,
  },
  reminderDivider: { borderTopColor: aurora.glassBorder, borderTopWidth: StyleSheet.hairlineWidth },
  reminderNext: { backgroundColor: aurora.accentTint, borderTopColor: 'transparent' },
  reminderPressed: { backgroundColor: aurora.glassPressed },
  reminderTime: { width: 54 },
  reminderClock: {
    color: aurora.text,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  reminderPeriod: { color: aurora.textSubtle, fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1 },
  reminderText: { flex: 1, color: aurora.text, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  dim: { color: aurora.textSubtle },
  nextBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: aurora.violet,
  },
  nextBadgeText: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4, includeFontPadding: false, textAlignVertical: 'center' },

  footnote: {
    color: aurora.textSubtle,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
