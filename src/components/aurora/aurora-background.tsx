import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { aurora } from '@/theme/aurora';

/** Full-screen dark backdrop with soft violet light, fixed behind scrolling content. */
export function AuroraBackground() {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.base]}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="aurora-top" cx="50%" cy="0%" rx="90%" ry="48%" fx="50%" fy="0%">
            <Stop offset="0" stopColor={aurora.violet} stopOpacity="0.42" />
            <Stop offset="0.5" stopColor={aurora.violetDeep} stopOpacity="0.16" />
            <Stop offset="1" stopColor={aurora.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="aurora-mid" cx="50%" cy="40%" rx="70%" ry="28%" fx="50%" fy="40%">
            <Stop offset="0" stopColor={aurora.orchid} stopOpacity="0.14" />
            <Stop offset="1" stopColor={aurora.background} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="aurora-low" cx="0%" cy="100%" rx="85%" ry="40%" fx="0%" fy="100%">
            <Stop offset="0" stopColor={aurora.violetDeep} stopOpacity="0.28" />
            <Stop offset="1" stopColor={aurora.background} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#aurora-top)" />
        <Rect width="100%" height="100%" fill="url(#aurora-mid)" />
        <Rect width="100%" height="100%" fill="url(#aurora-low)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: aurora.background },
});
