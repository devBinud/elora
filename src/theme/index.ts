import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settings-store';

import { darkColors, lightColors, type ColorTokens } from './colors';
import { iconSize, radius, spacing, typography } from './tokens';

export type ColorSchemeName = 'light' | 'dark';

export type Theme = {
  scheme: ColorSchemeName;
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  iconSize: typeof iconSize;
};

export function buildTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    iconSize,
  };
}

const lightTheme = buildTheme('light');
const darkTheme = buildTheme('dark');

/** Resolves the user's theme preference (system/light/dark) to a concrete theme. */
export function useTheme(): Theme {
  const system = useColorScheme();
  const preference = useSettingsStore((s) => s.themePreference);
  const scheme: ColorSchemeName =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export { darkColors, lightColors, iconSize, radius, spacing, typography };
export type { ColorTokens };
