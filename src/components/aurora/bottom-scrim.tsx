import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { aurora } from '@/theme/aurora';

/**
 * A dark fade along the bottom edge of full-screen pages (those without the
 * tab bar), so Android's navigation buttons sit on a dark band instead of
 * over the content when they are shown.
 */
export function BottomScrim() {
  const insets = useSafeAreaInsets();
  if (insets.bottom === 0) return null;

  return (
    <View pointerEvents="none" style={[styles.scrim, { height: insets.bottom + 36 }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="bottom-scrim" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={aurora.background} stopOpacity="0" />
            <Stop offset="0.45" stopColor={aurora.background} stopOpacity="0.9" />
            <Stop offset="1" stopColor={aurora.background} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bottom-scrim)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
