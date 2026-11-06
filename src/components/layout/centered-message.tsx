import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { useTheme } from '@/theme';

export type CenteredMessageProps = {
  title?: string;
  message?: string;
  loading?: boolean;
  children?: ReactNode;
};

/** Full-screen centred content, used for loading, error and setup states. */
export function CenteredMessage({ title, message, loading, children }: CenteredMessageProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background, padding: theme.spacing.xl, gap: theme.spacing.md },
      ]}>
      {loading ? <ActivityIndicator color={theme.colors.text} /> : null}
      {title ? (
        <AppText variant="title" align="center">
          {title}
        </AppText>
      ) : null}
      {message ? (
        <AppText variant="body" tone="muted" align="center">
          {message}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
