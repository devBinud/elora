import { Text, type TextProps } from 'react-native';

import { useTheme, type ColorTokens } from '@/theme';
import type { TypographyVariant } from '@/theme/tokens';

export type TextTone = 'default' | 'muted' | 'subtle' | 'danger' | 'success' | 'onPrimary';

const toneToColor: Record<TextTone, keyof ColorTokens> = {
  default: 'text',
  muted: 'textMuted',
  subtle: 'textSubtle',
  danger: 'danger',
  success: 'success',
  onPrimary: 'onPrimary',
};

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  tone?: TextTone;
  align?: 'left' | 'center' | 'right';
};

export function AppText({
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[
        theme.typography[variant],
        { color: theme.colors[toneToColor[tone]] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
