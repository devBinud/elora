import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { GlassCard, GradientButton, IconBubble } from '@/components/aurora';
import { SkeletonBlock, SkeletonGroup } from '@/components/aurora/skeleton';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

/** Shimmering placeholders shaped like the real feed: a lead story, then story cards. */
export function NewsSkeleton() {
  return (
    <SkeletonGroup style={styles.skeleton} accessibilityLabel="Loading news">
      {/* Lead story */}
      <View style={styles.heroCard}>
        <SkeletonBlock style={styles.heroImage} />
        <View style={styles.heroText}>
          <SkeletonBlock style={[styles.line, { width: '36%' }]} />
          <SkeletonBlock style={[styles.lineTall, { width: '96%' }]} />
          <SkeletonBlock style={[styles.lineTall, { width: '70%' }]} />
        </View>
      </View>

      {/* Story cards */}
      {[0, 1, 2, 3, 4].map((key) => (
        <View key={key} style={styles.rowCard}>
          <View style={styles.rowText}>
            <SkeletonBlock style={[styles.line, { width: '42%' }]} />
            <SkeletonBlock style={[styles.line, { width: '96%' }]} />
            <SkeletonBlock style={[styles.line, { width: key % 2 ? '64%' : '82%' }]} />
          </View>
          <SkeletonBlock style={styles.thumb} />
        </View>
      ))}
    </SkeletonGroup>
  );
}

type NewsMessageProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** An empty, error or setup message in a glass card. */
export function NewsMessage({ icon, title, message, actionLabel, onAction }: NewsMessageProps) {
  return (
    <GlassCard style={styles.message}>
      <IconBubble icon={icon} size={48} />
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageBody}>{message}</Text>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <GradientButton title={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  skeleton: { gap: 12 },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  heroImage: { aspectRatio: 4 / 3, borderRadius: 0 },
  heroText: { padding: 16, gap: 10 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  rowText: { flex: 1, gap: 10 },
  line: { height: 11, borderRadius: 6 },
  lineTall: { height: 16, borderRadius: 8 },
  thumb: { width: 88, height: 88, borderRadius: 16 },

  message: { alignItems: 'center', gap: 10, paddingVertical: 28 },
  messageTitle: {
    color: aurora.text,
    fontFamily: fonts.semibold,
    fontSize: 17,
    textAlign: 'center',
    marginTop: 4,
  },
  messageBody: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  action: { alignSelf: 'stretch', marginTop: 8 },
});
