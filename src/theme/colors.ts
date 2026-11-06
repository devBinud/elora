/**
 * Elora colour palette: a black-and-white foundation with a small set of
 * neutral greys. The only non-neutral colours are semantic (danger/success/
 * warning) and are used sparingly for status indicators.
 */
const palette = {
  black: '#000000',
  white: '#FFFFFF',
  grey50: '#FAFAFA',
  grey100: '#F4F4F5',
  grey200: '#E4E4E7',
  grey300: '#D4D4D8',
  grey400: '#A1A1AA',
  grey500: '#71717A',
  grey600: '#52525B',
  grey700: '#3F3F46',
  grey800: '#27272A',
  grey900: '#18181B',
  grey950: '#0B0B0C',
  red500: '#DC2626',
  red400: '#F87171',
  green600: '#16A34A',
  green400: '#4ADE80',
  amber600: '#D97706',
  amber400: '#FBBF24',
} as const;

export type ColorTokens = {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
  warning: string;
  overlay: string;
};

export const lightColors: ColorTokens = {
  background: palette.white,
  surface: palette.grey50,
  surfaceMuted: palette.grey100,
  border: palette.grey200,
  borderStrong: palette.grey300,
  text: palette.black,
  textMuted: palette.grey600,
  textSubtle: palette.grey400,
  primary: palette.black,
  onPrimary: palette.white,
  danger: palette.red500,
  success: palette.green600,
  warning: palette.amber600,
  overlay: 'rgba(0,0,0,0.4)',
};

export const darkColors: ColorTokens = {
  background: palette.black,
  surface: palette.grey950,
  surfaceMuted: palette.grey900,
  border: palette.grey800,
  borderStrong: palette.grey700,
  text: palette.white,
  textMuted: palette.grey400,
  textSubtle: palette.grey600,
  primary: palette.white,
  onPrimary: palette.black,
  danger: palette.red400,
  success: palette.green400,
  warning: palette.amber400,
  overlay: 'rgba(0,0,0,0.6)',
};
