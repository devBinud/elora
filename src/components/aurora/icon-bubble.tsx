import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { aurora } from '@/theme/aurora';

type IconBubbleProps = { icon: LucideIcon; size?: number; tone?: 'accent' | 'danger' };

/** A round, tinted badge holding an icon (violet, or red for destructive actions). */
export function IconBubble({ icon: Icon, size = 42, tone = 'accent' }: IconBubbleProps) {
  const danger = tone === 'danger';
  return (
    <View
      style={[
        styles.bubble,
        { width: size, height: size, borderRadius: size / 2 },
        danger && styles.danger,
      ]}
      accessible={false}>
      <Icon size={size * 0.46} color={danger ? aurora.danger : aurora.lilac} strokeWidth={1.75} />
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.accentTint,
    borderColor: aurora.accentBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  danger: { backgroundColor: aurora.dangerTint, borderColor: aurora.dangerBorder },
});
