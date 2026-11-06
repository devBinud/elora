import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { aurora } from '@/theme/aurora';

const WORDMARK = require('@/assets/images/splash-logo.png') as number;
/** Matches `imageWidth` of the native splash in app.config.ts, so the hand-off is seamless. */
const WORDMARK_WIDTH = 180;
/** Width / height of assets/images/splash-logo.png. */
const WORDMARK_ASPECT = 1200 / 393;
const FADE_MS = 380;

type BrandSplashProps = {
  /** While true the splash covers the app; when it turns false it fades out. */
  visible: boolean;
  /** Called once the splash is on screen, so the native splash can hide underneath it. */
  onShown?: () => void;
};

/**
 * Elora's launch screen, drawn in-app: brand violet with the white "Elora."
 * wordmark, identical to the native splash. It takes over from the native
 * splash (which Expo Go doesn't always show) and fades into the app.
 */
export function BrandSplash({ visible, onShown }: BrandSplashProps) {
  const [mounted, setMounted] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) return;
    opacity.set(withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.quad) }));
    const timer = setTimeout(() => setMounted(false), FADE_MS + 40);
    return () => clearTimeout(timer);
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  if (!mounted) return null;
  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.root, style]}
      onLayout={onShown}
      accessible
      accessibilityLabel="Elora is starting">
      <Image
        source={WORDMARK}
        style={{ width: WORDMARK_WIDTH, height: WORDMARK_WIDTH / WORDMARK_ASPECT }}
        contentFit="contain"
        accessible={false}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: aurora.brand,
  },
});
