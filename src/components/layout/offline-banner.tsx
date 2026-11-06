import { CloudOff } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { useNetworkStore } from '@/store/network-store';
import { useTheme } from '@/theme';

/** A slim notice shown while the device is offline. Changes still save locally. */
export function OfflineBanner() {
  const theme = useTheme();
  const isOnline = useNetworkStore((s) => s.isOnline);
  if (isOnline !== false) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderBottomColor: theme.colors.border,
          paddingVertical: theme.spacing.xs,
          gap: theme.spacing.xs,
        },
      ]}>
      <CloudOff size={14} color={theme.colors.textMuted} />
      <AppText variant="caption" tone="muted">
        Offline. Changes are saved on this device and will sync later.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
