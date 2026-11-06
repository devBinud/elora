import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { aurora } from '@/theme/aurora';

const ShimmerContext = createContext<SharedValue<number> | null>(null);

type SkeletonGroupProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Wraps skeleton blocks so they shimmer in sync: one shared animation drives
 * a soft light band sweeping across every block. Static for reduced motion.
 */
export function SkeletonGroup({ children, style, accessibilityLabel = 'Loading' }: SkeletonGroupProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.set(
      withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, false),
    );
  }, [reduceMotion, progress]);

  return (
    <ShimmerContext.Provider value={reduceMotion ? null : progress}>
      <View style={style} accessible accessibilityLabel={accessibilityLabel} accessibilityRole="progressbar">
        {children}
      </View>
    </ShimmerContext.Provider>
  );
}

/** One placeholder shape. Size and radius come from `style`. */
export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const progress = useContext(ShimmerContext);
  const [width, setWidth] = useState(0);

  const bandStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress ? progress.get() : 0, [0, 1], [-width, width]) }],
  }));

  return (
    <View style={[styles.block, style]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {progress && width > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, bandStyle]}>
          <Svg width={width} height="100%">
            <Defs>
              <LinearGradient id="skeleton-shimmer" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#E9D5FF" stopOpacity="0.13" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#skeleton-shimmer)" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { overflow: 'hidden', backgroundColor: aurora.glassPressed, borderRadius: 8 },
});
