import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, MailCheck, User } from 'lucide-react-native';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GradientButton, IconBubble } from '@/components/aurora';
import { FormAuroraTextField } from '@/components/forms/form-aurora-text-field';
import {
  describeAuthError,
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
} from '@/firebase/auth';
import { useAuthStore } from '@/store/auth-store';
import { aurora } from '@/theme/aurora';
import { fonts } from '@/theme/fonts';

import {
  resetSchema,
  signInSchema,
  signUpSchema,
  type ResetValues,
  type SignInValues,
  type SignUpValues,
} from './schemas';

export type AuthMode = 'signin' | 'signup' | 'reset';

type FormProps = { onSwitchMode: (mode: AuthMode) => void };

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox} accessibilityRole="alert">
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

/** "Prompt text  Action" on one line, e.g. "New here?  Create an account". */
function SwitchLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={styles.switch}>
      <Text style={styles.switchText}>
        {prompt} <Text style={styles.switchAction}>{action}</Text>
      </Text>
    </Pressable>
  );
}

export function SignInForm({ onSwitchMode }: FormProps) {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await signInWithEmail(email, password);
      // Navigation happens automatically when auth state changes.
    } catch (e) {
      setError(describeAuthError(e));
    }
  });
  const onSubmit = () => void submit();

  return (
    <View style={styles.form}>
      <FormAuroraTextField
        control={control}
        name="email"
        label="Email"
        icon={Mail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormAuroraTextField
        control={control}
        name="password"
        label="Password"
        icon={Lock}
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <Pressable
        onPress={() => onSwitchMode('reset')}
        accessibilityRole="button"
        hitSlop={8}
        style={styles.forgot}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>
      <FormError message={error} />
      <GradientButton title="Sign in" loading={formState.isSubmitting} onPress={onSubmit} />
      <SwitchLink prompt="New here?" action="Create an account" onPress={() => onSwitchMode('signup')} />
    </View>
  );
}

export function SignUpForm({ onSwitchMode }: FormProps) {
  const [error, setError] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const submit = handleSubmit(async ({ name, email, password }) => {
    setError(null);
    try {
      const user = await signUpWithEmail(email, password, name);
      // The auth listener fires before the name is saved, so pass it on here.
      useAuthStore.getState().updateUser({ displayName: user.displayName });
    } catch (e) {
      setError(describeAuthError(e));
    }
  });
  const onSubmit = () => void submit();

  return (
    <View style={styles.form}>
      <FormAuroraTextField
        control={control}
        name="name"
        label="Name"
        icon={User}
        placeholder="What should Elora call you?"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
      />
      <FormAuroraTextField
        control={control}
        name="email"
        label="Email"
        icon={Mail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormAuroraTextField
        control={control}
        name="password"
        label="Password"
        icon={Lock}
        placeholder="At least 8 characters"
        hint="Use 8 or more characters."
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <FormError message={error} />
      <GradientButton title="Create account" loading={formState.isSubmitting} onPress={onSubmit} />
      <SwitchLink
        prompt="Already have an account?"
        action="Sign in"
        onPress={() => onSwitchMode('signin')}
      />
    </View>
  );
}

export function ResetPasswordForm({ onSwitchMode }: FormProps) {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { control, handleSubmit, formState } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const submit = handleSubmit(async ({ email }) => {
    setError(null);
    try {
      await sendPasswordReset(email);
      setSentTo(email);
    } catch (e) {
      setError(describeAuthError(e));
    }
  });
  const onSubmit = () => void submit();

  if (sentTo) {
    return (
      <View style={[styles.form, styles.sent]}>
        <IconBubble icon={MailCheck} size={56} />
        <Text style={styles.sentTitle}>Check your inbox</Text>
        <Text style={styles.sentBody}>
          If an account exists for {sentTo}, a link to reset your password is on its way.
        </Text>
        <View style={styles.sentAction}>
          <GradientButton title="Back to sign in" onPress={() => onSwitchMode('signin')} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <FormAuroraTextField
        control={control}
        name="email"
        label="Email"
        icon={Mail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={onSubmit}
      />
      <FormError message={error} />
      <GradientButton title="Send reset link" loading={formState.isSubmitting} onPress={onSubmit} />
      <SwitchLink prompt="Remembered it?" action="Sign in" onPress={() => onSwitchMode('signin')} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 18 },
  forgot: { alignSelf: 'flex-end', marginTop: -6 },
  forgotText: { color: aurora.lilac, fontFamily: fonts.semibold, fontSize: 13 },
  errorBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: aurora.dangerTint,
    borderColor: aurora.dangerBorder,
    borderWidth: 1,
  },
  errorText: { color: aurora.danger, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  switch: { alignSelf: 'center', paddingVertical: 4 },
  switchText: { color: aurora.textMuted, fontFamily: fonts.regular, fontSize: 14 },
  switchAction: { color: aurora.lilac, fontFamily: fonts.semibold },
  sent: { alignItems: 'center', gap: 12 },
  sentTitle: { color: aurora.text, fontFamily: fonts.semibold, fontSize: 18 },
  sentBody: {
    color: aurora.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sentAction: { alignSelf: 'stretch', marginTop: 8 },
});
