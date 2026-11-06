import { PlusJakartaSans_300Light } from '@expo-google-fonts/plus-jakarta-sans/300Light';
import { PlusJakartaSans_300Light_Italic } from '@expo-google-fonts/plus-jakarta-sans/300Light_Italic';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { useFonts } from 'expo-font';

/**
 * Elora's bundled typeface, Plus Jakarta Sans.
 *
 * Use these family names instead of `fontWeight`: each weight is a separate
 * font file. Bundling the font also avoids Android OEM system fonts that
 * clip the last characters of light/semibold text.
 */
export const fonts = {
  light: 'PlusJakartaSans_300Light',
  lightItalic: 'PlusJakartaSans_300Light_Italic',
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

/** Loads the app fonts. Returns true once they are ready (or failed to load). */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    [fonts.light]: PlusJakartaSans_300Light,
    [fonts.lightItalic]: PlusJakartaSans_300Light_Italic,
    [fonts.regular]: PlusJakartaSans_400Regular,
    [fonts.medium]: PlusJakartaSans_500Medium,
    [fonts.semibold]: PlusJakartaSans_600SemiBold,
    [fonts.bold]: PlusJakartaSans_700Bold,
  });
  return loaded || error !== null;
}
