import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { aurora } from '@/theme/aurora';

type AssistantOrbProps = {
  size?: number;
  /** Breathing glow, blinking and the idle voice wave. Off for reduced motion. */
  animated?: boolean;
  /** While true, the voice-wave mouth moves as if Elora is talking. */
  speaking?: boolean;
  /** Unique prefix for SVG gradient ids when several orbs are on screen. */
  idPrefix: string;
};

/** The eyes' box in the 100x100 design (centred on the eye line, y = 49). */
const EYES_TOP = 44;
const EYES_HEIGHT = 10;

/** Relative heights of the five voice-wave bars (the middle one is tallest). */
const BAR_SHAPE = [0.45, 0.75, 1, 0.75, 0.45];
const BAR_PHASE = [0, 1.3, 2.4, 0.7, 1.9];

/**
 * Elora, drawn as a friendly voice assistant: a glossy violet sphere wearing
 * headphones, with a dark glass visor showing smiling eyes and an animated
 * voice-wave mouth. Designed in a 100x100 box and scaled to `size`.
 */
export function AssistantOrb({
  size = 220,
  animated = true,
  speaking = false,
  idPrefix,
}: AssistantOrbProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animated && !reduceMotion;

  const breathe = useSharedValue(0);
  const wave = useSharedValue(0);
  const energy = useSharedValue(speaking ? 1 : 0);
  const blink = useSharedValue(1);

  useEffect(() => {
    if (!shouldAnimate) return;
    breathe.set(
      withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    wave.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.linear }), -1, false));
    // Blink every few seconds.
    blink.set(
      withRepeat(
        withSequence(
          withDelay(3200, withTiming(0.1, { duration: 90 })),
          withTiming(1, { duration: 140 }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(breathe);
      cancelAnimation(wave);
      cancelAnimation(blink);
    };
  }, [shouldAnimate, breathe, wave, blink]);

  useEffect(() => {
    energy.set(withTiming(speaking ? 1 : 0, { duration: 260 }));
  }, [speaking, energy]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + breathe.get() * 0.4 + energy.get() * 0.15,
    transform: [{ scale: 0.94 + breathe.get() * 0.07 + energy.get() * 0.05 }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (breathe.get() - 0.5) * size * 0.02 }],
  }));
  const eyesStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: blink.get() }] }));

  const id = (name: string) => `${idPrefix}-${name}`;
  const unit = size / 100;

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      {/* Soft outer glow */}
      <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={id('glow')} cx="50%" cy="52%" r="50%">
              <Stop offset="0.4" stopColor={aurora.violetBright} stopOpacity="0.55" />
              <Stop offset="0.7" stopColor={aurora.violet} stopOpacity="0.18" />
              <Stop offset="1" stopColor={aurora.violet} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="52" r="50" fill={`url(#${id('glow')})`} />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, bodyStyle]}>
        {/* Head, headphones and visor */}
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={id('head')} cx="50%" cy="50%" r="50%" fx="38%" fy="28%">
              <Stop offset="0" stopColor="#FBF7FF" />
              <Stop offset="0.35" stopColor="#DCC7FF" />
              <Stop offset="0.75" stopColor="#9B6BF5" />
              <Stop offset="1" stopColor="#5B21B6" />
            </RadialGradient>
            <LinearGradient id={id('band')} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#7C3AED" />
              <Stop offset="0.5" stopColor="#E9D5FF" />
              <Stop offset="1" stopColor="#7C3AED" />
            </LinearGradient>
            <LinearGradient id={id('pod')} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#C084FC" />
              <Stop offset="1" stopColor="#5B21B6" />
            </LinearGradient>
            <LinearGradient id={id('visor')} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#24104A" />
              <Stop offset="1" stopColor="#0E0620" />
            </LinearGradient>
          </Defs>

          {/* Headphone band */}
          <Path
            d="M20 47 A30 30 0 0 1 80 47"
            fill="none"
            stroke={`url(#${id('band')})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Head */}
          <Circle cx="50" cy="54" r="30" fill={`url(#${id('head')})`} />

          {/* Ear pods */}
          <Rect x="13" y="44" width="11" height="20" rx="5.5" fill={`url(#${id('pod')})`} />
          <Rect x="76" y="44" width="11" height="20" rx="5.5" fill={`url(#${id('pod')})`} />
          <Rect x="15.5" y="47" width="2" height="9" rx="1" fill="#FFFFFF" opacity="0.35" />
          <Rect x="78.5" y="47" width="2" height="9" rx="1" fill="#FFFFFF" opacity="0.35" />

          {/* Visor */}
          <Rect
            x="29"
            y="42"
            width="42"
            height="26"
            rx="13"
            fill={`url(#${id('visor')})`}
            stroke="#FFFFFF"
            strokeOpacity="0.18"
            strokeWidth="0.6"
          />

          {/* Gloss highlight */}
          <Ellipse cx="40" cy="33" rx="10" ry="4.2" fill="#FFFFFF" opacity="0.55" transform="rotate(-20 40 33)" />
        </Svg>

        {/* Smiling eyes (blink) */}
        <Animated.View
          style={[styles.eyes, { top: EYES_TOP * unit, height: EYES_HEIGHT * unit }, eyesStyle]}>
          <Svg width={size} height={EYES_HEIGHT * unit} viewBox={`0 ${EYES_TOP} 100 ${EYES_HEIGHT}`}>
            <Path
              d="M37.5 51 Q41 46.5 44.5 51 M55.5 51 Q59 46.5 62.5 51"
              fill="none"
              stroke="#F3E8FF"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {/* Voice-wave mouth */}
        <View
          style={[
            styles.mouth,
            { top: 56 * unit, height: 9 * unit, left: 39 * unit, width: 22 * unit, gap: 1.8 * unit },
          ]}>
          {BAR_SHAPE.map((shape, index) => (
            <VoiceBar
              key={index}
              shape={shape}
              phase={BAR_PHASE[index]}
              wave={wave}
              energy={energy}
              width={2.4 * unit}
              maxHeight={9 * unit}
              animate={shouldAnimate}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

type VoiceBarProps = {
  shape: number;
  phase: number;
  wave: SharedValue<number>;
  energy: SharedValue<number>;
  width: number;
  maxHeight: number;
  animate: boolean;
};

function VoiceBar({ shape, phase, wave, energy, width, maxHeight, animate }: VoiceBarProps) {
  const style = useAnimatedStyle(() => {
    if (!animate) return { height: maxHeight * shape * 0.5 };
    const t = wave.get() * Math.PI * 2;
    // Idle: a slow, small ripple. Speaking: fast, tall, uneven motion.
    const idle = 0.28 + 0.12 * Math.sin(t + phase);
    const talk = 0.35 + 0.65 * Math.abs(Math.sin(t * 3 + phase * 1.7));
    const level = idle + (talk - idle) * energy.get();
    return { height: Math.max(width, maxHeight * shape * level) };
  });

  return (
    <Animated.View
      style={[styles.bar, { width, borderRadius: width / 2, boxShadow: `0 0 ${width * 2}px ${aurora.ice}` }, style]}
    />
  );
}

const styles = StyleSheet.create({
  eyes: { position: 'absolute', left: 0, right: 0 },
  mouth: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: { backgroundColor: '#C7F4FF' },
});
