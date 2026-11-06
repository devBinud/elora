import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './app-text';

export type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function TextField({
  label,
  error,
  hint,
  style,
  onFocus,
  onBlur,
  multiline,
  ref,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.text
      : theme.colors.borderStrong;

  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" tone="muted">
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={theme.colors.textSubtle}
        selectionColor={theme.colors.text}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          theme.typography.body,
          styles.input,
          {
            color: theme.colors.text,
            backgroundColor: theme.colors.background,
            borderColor,
            borderRadius: theme.radius.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.md,
          },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="subtle">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  input: { borderWidth: 1 },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
});
