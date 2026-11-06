import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useNow } from '@/hooks/use-now';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

/** Height of the bar below the status bar. Content should start below it. */
export const APP_HEADER_BAR_HEIGHT = 60;

/** Scroll distance over which the header's frosted backdrop fades in. */
const BACKDROP_FADE_DISTANCE = 36;

/** Scroll offset at which a sub-page's compact title fades into the bar. */
const TITLE_FADE_RANGE: [number, number] = [40, 80];

type AppHeaderProps = {
  /** Vertical scroll offset of the screen's content. */
  scrollY: SharedValue<number>;
  /**
   * Sub-page mode: shows a back button instead of the wordmark and clock, and
   * fades `title` into the bar once the page's large title scrolls away.
   */
  onBack?: () => void;
  title?: string;
};

/**
 * Sticky app header: the Elora wordmark and a live clock pill. Transparent
 * at the top of the page; a frosted dark backdrop fades in once content
 * scrolls underneath it.
 */
export function AppHeader({ scrollY, onBack, title }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, BACKDROP_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), TITLE_FADE_RANGE, [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View pointerEvents="box-none" style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="app-header-backdrop" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0B0716" stopOpacity="0.98" />
              <Stop offset="1" stopColor="#0B0716" stopOpacity="0.88" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#app-header-backdrop)" />
        </Svg>
        <View style={styles.edge} />
      </Animated.View>

      {onBack ? (
        <View style={styles.bar}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
            <ChevronLeft size={22} color={aurora.text} strokeWidth={2} />
          </Pressable>
          <Animated.Text style={[styles.compactTitle, titleStyle]} numberOfLines={1}>
            {title}
          </Animated.Text>
          <View style={styles.backButtonSpacer} />
        </View>
      ) : (
        <View style={styles.bar}>
          <Wordmark />
          <ClockPill />
        </View>
      )}
    </View>
  );
}

function Wordmark() {
  return (
    <Text style={styles.wordmark} accessibilityRole="header" accessibilityLabel="Elora">
      Elora<Text style={styles.wordmarkDot}>.</Text>
    </Text>
  );
}

/**
 * Live clock with seconds, e.g. "4:54:07 PM". It ticks on its own every
 * second, so only this pill re-renders, not the whole screen.
 */
function ClockPill() {
  const now = useNow(1000);
  const hoursMinutes = format(now, 'h:mm');
  const seconds = format(now, 'ss');
  const period = format(now, 'a');
  return (
    <View
      style={styles.clockPill}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Time ${hoursMinutes} ${period}`}>
      <Text style={styles.clockTime}>
        {hoursMinutes}
        <Text style={styles.clockSeconds}>:{seconds}</Text>
      </Text>
      <Text style={styles.clockPeriod}>{period}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(216, 180, 254, 0.18)',
  },
  bar: {
    height: APP_HEADER_BAR_HEIGHT,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(216, 180, 254, 0.22)',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  backButtonPressed: { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
  backButtonSpacer: { width: 40 },
  compactTitle: {
    flex: 1,
    textAlign: 'center',
    color: aurora.text,
    fontFamily: fonts.semibold,
    fontSize: 16,
    marginHorizontal: 12,
  },

  wordmark: {
    color: aurora.text,
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(168, 85, 247, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  wordmarkDot: { color: aurora.violetBright },

  clockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(216, 180, 254, 0.22)',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  clockTime: {
    color: aurora.text,
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  clockSeconds: { color: aurora.lilac },
  clockPeriod: {
    includeFontPadding: false,
    color: aurora.textMuted,
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 20,
    letterSpacing: 0.8,
  },
});
