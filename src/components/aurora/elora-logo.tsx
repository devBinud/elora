import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

const LOGO = require('@/assets/images/splash-icon.png') as number;

/**
 * Elora's logo tile: the same artwork as the app icon (violet glow, voice
 * wave and white wordmark), with a soft violet glow around it.
 */
export function EloraLogo({ size = 96 }: { size?: number }) {
  return (
    <View
      style={[
        styles.glow,
        { width: size, height: size, borderRadius: size * 0.225, boxShadow: `0 0 ${size * 0.35}px rgba(139, 92, 246, 0.55)` },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Elora logo">
      <Image source={LOGO} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { overflow: 'visible' },
});
