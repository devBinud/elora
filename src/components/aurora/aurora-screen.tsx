import { useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import { APP_HEADER_BAR_HEIGHT, AppHeader } from './app-header';
import { AuroraBackground } from './aurora-background';
import { BottomScrim } from './bottom-scrim';

type AuroraScreenProps = {
  /** Small uppercase label above the title, e.g. "Private · only you". */
  overline: string;
  /** Bold first line of the title, e.g. "Your". */
  title: string;
  /** Lilac italic second line, e.g. "journal". */
  accent?: string;
  /** Sub-page mode: shows a back button in the header (see AppHeader). */
  onBack?: () => void;
  children: ReactNode;
};

/**
 * Standard layout for Elora's dark tab screens: aurora backdrop, the sticky
 * Elora header with its clock, a two-line title, and scrolling content.
 */
export function AuroraScreen({ overline, title, accent, onBack, children }: AuroraScreenProps) {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });

  return (
    <View style={styles.root}>
      <AuroraBackground />
      {isFocused ? <StatusBar style="light" /> : null}

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + APP_HEADER_BAR_HEIGHT + 8,
            // Full-screen sub-pages have no tab bar, so clear the system nav area.
            paddingBottom: onBack ? insets.bottom + 48 : 36,
          },
        ]}>
        <View style={styles.titleBlock}>
          <Text style={styles.overline}>{overline}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {accent ? <Text style={styles.accent}>{accent}</Text> : null}
        </View>
        {children}
      </Animated.ScrollView>

      {onBack ? <BottomScrim /> : null}

      <AppHeader
        scrollY={scrollY}
        onBack={onBack}
        title={accent ? `${title} ${accent}` : title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: aurora.background },
  content: { paddingHorizontal: 20, paddingBottom: 36, gap: 16 },
  titleBlock: { marginTop: 4, marginBottom: 4 },
  overline: {
    color: aurora.lilac,
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: { color: aurora.text, fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, letterSpacing: -0.6 },
  accent: {
    color: aurora.lilac,
    fontFamily: fonts.lightItalic,
    fontSize: 30,
    lineHeight: 38,
    letterSpacing: -0.4,
  },
});
