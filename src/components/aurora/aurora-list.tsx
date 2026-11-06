import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import { IconBubble } from './icon-bubble';

type AuroraListGroupProps = { title?: string; footer?: string; children: ReactNode };

/** A titled frosted card holding rows, with hairline dividers between them. */
export function AuroraListGroup({ title, footer, children }: AuroraListGroupProps) {
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={styles.group}>
      {title ? <Text style={styles.groupTitle}>{title}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={row.key ?? index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

type AuroraListItemProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Small pill on the right instead of a chevron, e.g. "Soon". */
  badge?: string;
  /** Plain value on the right, e.g. a version number. */
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

/** One row: icon bubble, title and subtitle, and a chevron or badge. */
export function AuroraListItem({
  icon,
  title,
  subtitle,
  badge,
  value,
  onPress,
  destructive = false,
  disabled = false,
}: AuroraListItemProps) {
  const interactive = Boolean(onPress) && !disabled;
  return (
    <Pressable
      onPress={interactive ? onPress : undefined}
      disabled={!interactive}
      accessibilityRole={interactive ? 'button' : undefined}
      accessibilityState={{ disabled: !interactive }}
      accessibilityLabel={[title, subtitle, value, badge].filter(Boolean).join(', ')}
      style={({ pressed }) => [
        styles.row,
        disabled && styles.rowDisabled,
        pressed && interactive && styles.rowPressed,
      ]}>
      <IconBubble icon={icon} size={38} tone={destructive ? 'danger' : 'accent'} />
      <View style={styles.text}>
        <Text style={[styles.title, destructive && styles.titleDanger]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : interactive && !destructive ? (
        <ChevronRight size={18} color={aurora.textSubtle} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  groupTitle: {
    color: aurora.textSubtle,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: aurora.glassBorder, marginLeft: 68 },
  footer: { color: aurora.textSubtle, fontFamily: fonts.regular, fontSize: 12, marginLeft: 4 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16 },
  rowPressed: { backgroundColor: aurora.glassPressed },
  rowDisabled: { opacity: 0.6 },
  text: { flex: 1, gap: 2 },
  title: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  titleDanger: { color: aurora.danger },
  subtitle: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: aurora.accentTint,
    borderColor: aurora.accentBorder,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  badgeText: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, includeFontPadding: false, textAlignVertical: 'center' },
  value: { color: aurora.textMuted, fontFamily: fonts.medium, fontSize: 14, maxWidth: '45%' },
});
