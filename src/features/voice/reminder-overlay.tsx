import { Mic, Volume2 } from 'lucide-react-native';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssistantOrb, AuroraBackground, GradientButton } from '@/components/aurora';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import { acknowledgeReminder, useReminderSession } from './reminder-session';
import { useSpeakingStore } from './voice-engine';

/**
 * Full-screen reminder shown while Elora repeats a voice reminder. Stop it
 * with the button, the back button, or by saying "OK" during a pause (in Expo
 * Go any spoken reply is detected; a development build recognises the words).
 */
export function ReminderOverlay() {
  const active = useReminderSession((s) => s.active);
  const speaking = useSpeakingStore((s) => s.speaking);
  const insets = useSafeAreaInsets();

  const canListen = active !== null && active.listenMode !== 'none';
  let status = 'Tap the button to stop';
  if (active?.listening) status = 'Listening… say “OK” now';
  else if (canListen) status = 'Say “OK” after Elora speaks, or tap below';

  return (
    <Modal
      visible={active !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={acknowledgeReminder}>
      <View style={styles.root}>
        <AuroraBackground />
        <View
          style={[
            styles.content,
            { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
          ]}>
          <View style={styles.header}>
            <Text style={styles.overline}>Reminder · {active?.timeLabel}</Text>
            {active && active.maxRepeats > 1 ? (
              <Text style={styles.repeat}>
                Repeating {active.repeat} of {active.maxRepeats}
              </Text>
            ) : null}
          </View>

          <View style={styles.center}>
            <AssistantOrb size={220} idPrefix="reminder" speaking={speaking} />
            <Text style={styles.message} accessibilityRole="header">
              {active?.text}
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={[styles.statusPill, active?.listening && styles.statusPillListening]}>
              {active?.listening ? (
                <Mic size={15} color={aurora.text} strokeWidth={2} />
              ) : (
                <Volume2 size={15} color={aurora.lilac} strokeWidth={2} />
              )}
              <Text style={styles.statusText}>{status}</Text>
            </View>
            <View style={styles.button}>
              <GradientButton title="OK, got it" onPress={acknowledgeReminder} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', gap: 6 },
  overline: {
    color: aurora.lilac,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  repeat: { color: aurora.textSubtle, fontFamily: fonts.regular, fontSize: 12 },
  center: { alignItems: 'center', gap: 28 },
  message: {
    color: aurora.text,
    fontFamily: fonts.semibold,
    fontSize: 24,
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  footer: { alignItems: 'center', gap: 18 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  statusPillListening: { backgroundColor: aurora.violet, borderColor: aurora.accentBorder },
  statusText: { color: aurora.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 17, includeFontPadding: false, textAlignVertical: 'center' },
  button: { alignSelf: 'stretch' },
});
