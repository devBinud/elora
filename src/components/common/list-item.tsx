import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

export type ListItemProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Short text or element shown on the right (e.g. a value or a switch). */
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  showChevron?: boolean;
  destructive?: boolean;
};

export function ListItem({
  title,
  subtitle,
  icon: Icon,
  trailing,
  onPress,
  disabled = false,
  showChevron = Boolean(onPress),
  destructive = false,
}: ListItemProps) {
  const theme = useTheme();
  const tone = destructive ? 'danger' : 'default';
  const iconColor = destructive ? theme.colors.danger : theme.colors.text;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          gap: theme.spacing.md,
          opacity: disabled ? 0.45 : pressed ? 0.6 : 1,
        },
      ]}>
      {Icon ? <Icon size={theme.iconSize.md} color={iconColor} strokeWidth={1.75} /> : null}
      <View style={styles.text}>
        <AppText variant="body" tone={tone} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {typeof trailing === 'string' ? (
        <AppText variant="caption" tone="muted">
          {trailing}
        </AppText>
      ) : (
        trailing
      )}
      {showChevron ? <ChevronRight size={theme.iconSize.sm} color={theme.colors.textSubtle} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, gap: 2 },
});
