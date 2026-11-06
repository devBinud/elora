import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/app-text';
import { useTheme } from '@/theme';

import { OfflineBanner } from './offline-banner';

export type ScreenProps = {
  children: ReactNode;
  /** Large in-page title, used by tab screens that hide the native header. */
  title?: string;
  subtitle?: string;
  /** Element shown to the right of the title (e.g. an icon button). */
  headerRight?: ReactNode;
  scroll?: boolean;
  /** Safe-area edges to pad. Screens under a native header should omit 'top'. */
  edges?: Edge[];
  keyboardAware?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  title,
  subtitle,
  headerRight,
  scroll = true,
  edges = ['top'],
  keyboardAware = false,
  refreshing,
  onRefresh,
  contentStyle,
}: ScreenProps) {
  const theme = useTheme();
  const padding = {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.xl,
  };

  const header = title ? (
    <View style={[styles.header, { paddingTop: theme.spacing.md }]}>
      <View style={styles.headerText}>
        <AppText variant="display">{title}</AppText>
        {subtitle ? (
          <AppText variant="body" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {headerRight}
    </View>
  ) : null;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padding, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={theme.colors.text}
          />
        ) : undefined
      }>
      {header}
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentStyle]}>
      {header}
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <OfflineBanner />
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerText: { flex: 1, gap: 4 },
});
