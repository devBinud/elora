import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  icon?: LucideIcon;
  accessibilityLabel?: string;
  /** Shows a spinner and ignores presses. */
  loading?: boolean;
  disabled?: boolean;
  /** 'primary' = glowing gradient; 'glass' = frosted outline for secondary actions. */
  variant?: 'primary' | 'glass';
};

const HEIGHT = 56;

/** A glowing violet pill, the primary call to action on aurora surfaces. */
export function GradientButton({
  title,
  onPress,
  icon: Icon,
  accessibilityLabel,
  loading = false,
  disabled = false,
  variant = 'primary',
}: GradientButtonProps) {
  const isPrimary = variant === 'primary';
  const inactive = loading || disabled;
  return (
    <View style={[isPrimary && styles.glow, disabled && styles.disabled]}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={({ pressed }) => [
          styles.button,
          !isPrimary && styles.glass,
          pressed && styles.pressed,
        ]}>
        {isPrimary ? (
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="gradient-button" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#3B1578" />
              <Stop offset="0.5" stopColor="#9333EA" />
              <Stop offset="1" stopColor="#3B1578" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#gradient-button)" />
        </Svg>
        ) : null}
        {loading ? (
          <ActivityIndicator color={aurora.text} />
        ) : (
          <>
            {Icon ? <Icon size={18} color={aurora.text} strokeWidth={1.9} /> : null}
            <Text style={styles.title}>{title}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    borderRadius: HEIGHT / 2,
    boxShadow: '0 0 28px rgba(147, 51, 234, 0.45)',
  },
  button: {
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: aurora.accentBorder,
  },
  glass: { backgroundColor: aurora.glass, borderColor: aurora.glassBorder },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  title: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, letterSpacing: 0.2, includeFontPadding: false, textAlignVertical: 'center' },
});
