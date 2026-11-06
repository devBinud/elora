import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';
import { Button } from './button';

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        { gap: theme.spacing.sm, paddingVertical: compact ? theme.spacing.lg : theme.spacing.xxxl },
      ]}>
      {Icon ? (
        <Icon size={compact ? 22 : 32} color={theme.colors.textSubtle} strokeWidth={1.5} />
      ) : null}
      <AppText variant={compact ? 'bodyStrong' : 'subheading'} align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" tone="muted" align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant="secondary"
          size="sm"
          onPress={onAction}
          style={{ marginTop: theme.spacing.sm }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  message: { maxWidth: 300 },
});
