import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { aurora } from '@/theme/aurora';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB = 24;
const PADDING = 3;
const TRAVEL = TRACK_WIDTH - THUMB - PADDING * 2;

type AuroraSwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
};

/**
 * A smooth on/off switch. It flips instantly when tapped (the change is saved
 * in the background) with a springy thumb, a colour fade and a soft glow.
 */
export function AuroraSwitch({ value, onValueChange, accessibilityLabel, disabled }: AuroraSwitchProps) {
  // Optimistic value: shows the user's choice at once, until `value` catches up.
  const [override, setOverride] = useState<boolean | null>(null);
  if (override !== null && override === value) setOverride(null);
  const on = override ?? value;

  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    const target = on ? 1 : 0;
    progress.set(
      reduceMotion
        ? withTiming(target, { duration: 0 })
        : withSpring(target, { damping: 17, stiffness: 240, mass: 0.7 }),
    );
  }, [on, progress, reduceMotion]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.get(), [0, 1], ['rgba(255,255,255,0.12)', aurora.violet]),
    borderColor: interpolateColor(progress.get(), [0, 1], ['rgba(255,255,255,0.16)', aurora.accentBorder]),
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: interpolate(progress.get(), [0, 1], [0, 1]) }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.get() * TRAVEL },
      // A tiny squash mid-way makes the motion feel springy.
      { scaleX: 1 + Math.sin(progress.get() * Math.PI) * 0.12 },
    ],
    backgroundColor: interpolateColor(progress.get(), [0, 1], ['#CFC8DE', '#FFFFFF']),
  }));

  const toggle = () => {
    const next = !on;
    setOverride(next);
    onValueChange(next);
  };

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      accessibilityLabel={accessibilityLabel}
      style={disabled ? styles.disabled : undefined}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    borderWidth: 1,
    padding: PADDING - 1,
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    boxShadow: '0 0 14px rgba(139, 92, 246, 0.7)',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  disabled: { opacity: 0.5 },
});
