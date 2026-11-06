import type { LucideIcon } from 'lucide-react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

export type AuroraTextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/**
 * Frosted text input for aurora screens. With `secureTextEntry`, an eye
 * button lets the user show or hide what they typed.
 */
export function AuroraTextField({
  label,
  icon: Icon,
  error,
  hint,
  secureTextEntry,
  multiline,
  onFocus,
  onBlur,
  ref,
  ...rest
}: AuroraTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isSecret = Boolean(secureTextEntry);

  const iconColor = error ? aurora.danger : focused ? aurora.lilac : aurora.textSubtle;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          multiline && styles.fieldMultiline,
          focused && styles.fieldFocused,
          error ? styles.fieldError : null,
        ]}>
        {Icon ? <Icon size={18} color={iconColor} strokeWidth={1.9} /> : null}
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={isSecret && !revealed}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          placeholderTextColor={aurora.textSubtle}
          selectionColor={aurora.lilac}
          cursorColor={aurora.lilac}
          accessibilityLabel={label}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {isSecret ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            style={styles.eye}>
            {revealed ? (
              <EyeOff size={19} color={aurora.lilac} strokeWidth={1.9} />
            ) : (
              <Eye size={19} color={aurora.textMuted} strokeWidth={1.9} />
            )}
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: aurora.textMuted, fontFamily: fonts.medium, fontSize: 13, marginLeft: 4 },
  field: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: aurora.glass,
    borderColor: aurora.glassBorder,
    borderWidth: 1,
  },
  fieldMultiline: { height: undefined, minHeight: 110, alignItems: 'flex-start', paddingVertical: 14 },
  fieldFocused: {
    borderColor: aurora.lilac,
    backgroundColor: 'rgba(139, 92, 246, 0.10)',
    boxShadow: '0 0 14px rgba(168, 85, 247, 0.35)',
  },
  fieldError: { borderColor: aurora.danger },
  input: {
    flex: 1,
    color: aurora.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    paddingVertical: 0,
  },
  inputMultiline: { lineHeight: 22, minHeight: 80 },
  eye: { padding: 2 },
  error: { color: aurora.danger, fontFamily: fonts.medium, fontSize: 12, marginLeft: 4 },
  hint: { color: aurora.textSubtle, fontFamily: fonts.regular, fontSize: 12, marginLeft: 4 },
});
